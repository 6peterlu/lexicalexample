import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { Loading, useTheme } from '@nextui-org/react';
import { EditorState, LexicalEditor } from 'lexical';
import dynamic from 'next/dynamic';
import { useDebouncedCallback } from 'use-debounce';
import {
  currentDocumentVar,
  currentDocumentVersionIDVar
} from '../cache/cache';
import { useUserInfo } from '../hooks/useUserInfo';
import { useWebsocketProvider } from '../utils/collaboration';
import {
  extractTextFromEditorState,
  generateInitialLexicalConfigFromText
} from '../utils/lexical';
import ReadOnlyContentEditable from './editor/ReadOnlyContentEditable';
import { RemoveLineBreakPlugin } from './plugins/RemoveLineBreakPlugin';
import TextPlaceholder from './TextPlaceholder';

const CollaborationPluginWrapper = dynamic(
  () => import('./plugins/CollaborationPluginWrapper'),
  { ssr: false }
);

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
  paragraph: 'editor-title',
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

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
  throw error;
}

const titleInitialConfig: any = {
  theme,
  onError
};

const SAVE_DOCUMENT_TITLE = gql`
  mutation saveDocumentTitle(
    $documentID: String!
    $title: String!
  ) {
    saveDocumentTitle(
      request: { documentID: $documentID, title: $title }
    )
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

export default function TitleInput() {
  const { theme } = useTheme();
  const { wsProviderFactory, connected } =
    useWebsocketProvider();
  const currentDocument = useReactiveVar(
    currentDocumentVar
  );
  const { user } = useUserInfo();
  const [saveTitle] = useMutation(SAVE_DOCUMENT_TITLE);
  const debouncedSaveTitle = useDebouncedCallback(
    async (editorState) => {
      const newTitle =
        extractTextFromEditorState(editorState);
      await saveTitle({
        variables: {
          documentID: currentDocument.documentID,
          title: newTitle ?? ''
        }
      });
    },
    300
  );
  if (!currentDocument?.documentID || !user) {
    return <Loading />;
  }
  if (currentDocument.title) {
    titleInitialConfig['editorState'] =
      generateInitialLexicalConfigFromText(
        currentDocument?.title
      );
  } else {
    titleInitialConfig['editorState'] = null;
  }

  return (
    <LexicalComposer
      initialConfig={{
        ...titleInitialConfig,
        editorState: null
      }}
    >
      <div
        style={{
          display: 'flex',
          flex: 1,
          flexDirection: 'column',
          fontSize: theme.fontSizes.lg.value
        }}
      >
        <PlainTextPlugin
          placeholder={
            <TextPlaceholder placeholderText='Untitled document' />
          }
          contentEditable={
            <ReadOnlyContentEditable
              style={{
                outline: 1,
                flex: 1,
                fontWeight: 'bold',
                minHeight: 20
              }}
              contenteditable={true}
              wsConnected={connected}
            />
          }
          ErrorBoundary={EditorErrorBoundary}
        />
        <OnChangePlugin
          onChange={async (editorState: EditorState) => {
            await debouncedSaveTitle(editorState);
          }}
          ignoreSelectionChange
        />
        {/* <RemoveLineBreakPlugin /> */}
        <CollaborationPluginWrapper
          id={`ws-title-${currentDocument.documentID}`}
          providerFactory={wsProviderFactory}
          shouldBootstrap={true}
          username={user?.firstName ?? user?.username}
          initialEditorState={
            titleInitialConfig.editorState
          }
        />
      </div>
    </LexicalComposer>
  );
}
