import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import {
  TableCellNode,
  TableNode,
  TableRowNode
} from '@lexical/table';
import { ListItemNode, ListNode } from '@lexical/list';
import { CodeHighlightNode, CodeNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { RemoveLineBreakPlugin } from './plugins/RemoveLineBreakPlugin';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import {
  ORDERED_LIST,
  UNORDERED_LIST
} from '@lexical/markdown';
import { useRouter } from 'next/router';
import {
  extractTextFromEditorState,
  generateInitialLexicalConfigFromText
} from '../utils/lexical';
import { useEffect, useMemo, useState } from 'react';
import {
  $getRoot,
  EditorState,
  LexicalEditor,
  LexicalNode,
  NodeMap
} from 'lexical';
import {
  Button,
  Collapse,
  Loading,
  Text,
  useTheme
} from '@nextui-org/react';
import { useDebouncedCallback } from 'use-debounce';
import {
  gql,
  useMutation,
  useLazyQuery,
  useReactiveVar,
  useQuery
} from '@apollo/client';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { useWebsocketProvider } from '../utils/collaboration';
import { currentNoteVar } from '../cache/cache';
import ReadOnlyContentEditable from './editor/ReadOnlyContentEditable';
import { useUserInfo } from '../hooks/useUserInfo';

const editorTheme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5'
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem'
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem'
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough:
      'editor-text-underlineStrikethrough',
    code: 'editor-text-code'
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',
    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable'
  }
};

const customNodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  AutoLinkNode,
  LinkNode
];

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
  throw error;
}

const TextPlaceholder = ({
  placeholderText
}: {
  placeholderText: string;
}) => {
  return (
    <div
      style={{
        paddingTop: 2,
        position: 'absolute',
        pointerEvents: 'none',
        color: '#aaa'
      }}
    >
      {placeholderText}
    </div>
  );
};
const SAVE_NOTE = gql`
  mutation saveNote($noteID: String!, $content: String!) {
    saveNote(
      request: { noteID: $noteID, content: $content }
    )
  }
`;

const SAVE_NOTE_TITLE = gql`
  mutation saveNoteTitle(
    $noteID: String!
    $title: String!
  ) {
    saveNoteTitle(
      request: { noteID: $noteID, title: $title }
    )
  }
`;

const LOAD_NOTE = gql`
  query getNote($noteID: String!) {
    getNote(args: { noteID: $noteID }) {
      content
      noteID
    }
  }
`;

function EditorErrorBoundary({
  onError,
  children
}: {
  onError: (error: Error) => void;
  children: JSX.Element;
}) {
  return <>{children}</>;
}

export default function NoteEditor({
  noteID
}: {
  noteID: string;
}) {
  const { user } = useUserInfo();
  const [contentInitialLoad, setContentInitialLoad] =
    useState(false);

  const { wsProviderFactory, connected } =
    useWebsocketProvider();

  const { theme } = useTheme();

  const [
    saveNote,
    {
      loading: notesMutationLoading,
      error: notesMutationError,
      data: notesMutationData
    }
  ] = useMutation(SAVE_NOTE);

  const {
    called: notesRetrieveCalled,
    loading: notesRetrieveLoading,
    error: notesRetrieveError,
    data: notesRetrieveData
  } = useQuery(LOAD_NOTE, {
    variables: { noteID },
    fetchPolicy: 'no-cache'
  });

  const debouncedSaveNote = useDebouncedCallback(
    async (editorState) => {
      await saveNote({
        variables: {
          noteID: noteID,
          content: JSON.stringify(editorState)
        }
      });
    },
    300
  );

  if (
    !noteID ||
    !notesRetrieveCalled ||
    notesRetrieveLoading ||
    !notesRetrieveData ||
    notesRetrieveData.getNote.noteID !== noteID
  ) {
    return <Loading />;
  }

  const initialConfig: any = {
    theme: editorTheme,
    onError,
    nodes: customNodes
  };

  // if we found data for this note, set it as the initial state

  if (notesRetrieveData.getNote.content) {
    initialConfig['editorState'] =
      notesRetrieveData.getNote.content;
  } else {
    initialConfig['editorState'] = null;
  }

  return (
    <div
      style={{
        // same as css above
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        padding: 20,
        maxHeight: '100%',
        backgroundColor: 'white'
      }}
      // forcing re-render on noteID change
      key={`note-editor-${noteID}`}
    >
      <LexicalComposer
        initialConfig={{
          ...initialConfig,
          editorState: null
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <RichTextPlugin
            placeholder={
              <TextPlaceholder placeholderText='Enter some text...' />
            }
            contentEditable={
              <ReadOnlyContentEditable
                style={{
                  outline: 0,
                  flex: 1,
                  zIndex: 1,
                  backgroundColor: 'transparent'
                }}
                contenteditable={true}
                wsConnected={connected}
              />
            }
            ErrorBoundary={EditorErrorBoundary}
          />
          <OnChangePlugin
            onChange={(editorState: EditorState) => {
              if (!contentInitialLoad) {
                setContentInitialLoad(true);
              } else {
                debouncedSaveNote(editorState);
              }
            }}
            ignoreSelectionChange
          />

          <AutoFocusPlugin />
          {/* <ListPlugin />
          <MarkdownShortcutPlugin
            transformers={TRANSFORMERS}
          /> */}
          {noteID && user && (
            <CollaborationPlugin
              id={`note-${noteID}`}
              providerFactory={wsProviderFactory}
              shouldBootstrap={true}
              username={user.firstName ?? user.username}
              initialEditorState={
                initialConfig['editorState']
              }
            />
          )}
          <MarkdownShortcutPlugin
            transformers={[ORDERED_LIST, UNORDERED_LIST]}
          />
          <TabIndentationPlugin />
        </div>
      </LexicalComposer>
    </div>
  );
}
