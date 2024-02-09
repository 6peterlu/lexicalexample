import { useEffect, useState } from 'react';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { ListItemNode, ListNode } from '@lexical/list';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import {
  $getRoot,
  createCommand,
  EditorState,
  LexicalCommand,
  LexicalEditor
} from 'lexical';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import CommentPlugin from '../plugins/CommentPlugin';
import {
  currentDocumentVar,
  currentDocumentVersionIDVar,
  currentEditorModeVar,
  analyticsLayerStateVar,
  wordCounterStateVar,
  activeEditorVar,
  commentsVar
} from '../../cache/cache';
import { MarkNode } from '@lexical/mark';
import { ControlledComponentPlugin } from '../plugins/ControlledComponentPlugin';
import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import { Loading } from '@nextui-org/react';
import { useDebouncedCallback } from 'use-debounce';
import { useWebsocketProvider } from '../../utils/collaboration';
import ReadOnlyContentEditable from './ReadOnlyContentEditable';
import { EditorModes } from '../EditorModeMenu';
import AnalyticsPlugin from '../plugins/AnalyticsPlugin/AnalyticsPlugin';
import { AnalyticsNode } from '../nodes/AnalyticsNode';
import { useLoadDocumentVersion } from '../../hooks/useDocuments';
import ToolbarPlugin from '../plugins/ToolbarPlugin';
import WordCounterPlugin from '../plugins/WordCounterPlugin';
import DisableKeyboardShortcutsPlugin from '../plugins/DisableKeyboardShortcuts';
import { useUserInfo } from '../../hooks/useUserInfo';
import dynamic from 'next/dynamic';
import EmitEditorObjectPlugin from '../plugins/EmitEditorObjectPlugin';
import StatisticsPlugin, {
  InputType
} from '../plugins/StatisticsPlugin';
import { getCurrentDateGraphQLString } from '../../utils/time';
import CommentPanel from '../CommentPanel';
import SetDocumentContentOnLoadPlugin from '../plugins/SetDocumentContentOnLoadPlugin';
import { HeaderNode } from '../nodes/HeaderNode';
import HeaderPlugin from '../plugins/HeaderPlugin';
import { v4 } from 'uuid';
import { CommentDB } from '../../models/comment';
import { ActionPermission } from '../../generated/types/graphql';

const CollaborationPluginWrapper = dynamic(
  () => import('../plugins/CollaborationPluginWrapper'),
  { ssr: false }
);

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
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

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
  throw error;
}

const customNodes = [
  ListNode,
  ListItemNode,
  MarkNode,
  AnalyticsNode,
  HeaderNode
];

const initialConfig: any = {
  theme,
  onError,
  nodes: customNodes
};

const SAVE_DOCUMENT_CONTENT = gql`
  mutation saveDocumentContent(
    $documentID: String!
    $versionName: String
    $content: String!
    $wordCount: Int!
    $date: Date!
  ) {
    saveDocumentContent(
      request: {
        documentID: $documentID
        versionName: $versionName
        content: $content
        wordCount: $wordCount
        date: $date
      }
    ) {
      comments {
        commentData
        commentID
        user {
          userID
          username
        }
        resolved
        selectedText
      }
    }
  }
`;
export const SCROLL_COMMAND: LexicalCommand<string> =
  createCommand();

export const CREATE_HEADER_COMMAND: LexicalCommand<string> =
  createCommand();

function EditorErrorBoundary({
  onError,
  children
}: {
  onError: (error: Error) => void;
  children: JSX.Element;
}) {
  return <>{children}</>;
}

export default function Editor() {
  const currentDocumentData = useReactiveVar(
    currentDocumentVar
  );
  const { wsProviderFactory, connected } =
    useWebsocketProvider();
  const currentDocumentVersionDualID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const currentEditorMode = useReactiveVar(
    currentEditorModeVar
  );
  const wordCount = useReactiveVar(wordCounterStateVar);
  const activeEditor = useReactiveVar(activeEditorVar);
  const {
    loadDocumentVersion,
    documentVersionQueryData,
    documentVersionQueryLoading
  } = useLoadDocumentVersion();
  const { user } = useUserInfo();
  useEffect(() => {
    loadDocumentVersion();
  }, [loadDocumentVersion]);

  const [saveDocumentContent] = useMutation(
    SAVE_DOCUMENT_CONTENT,
    {
      variables: {
        documentID: currentDocumentVersionDualID.documentID,
        versionName:
          currentDocumentVersionDualID.versionName,
        content: '',
        wordCount: 0,
        date: getCurrentDateGraphQLString()
      }
    }
  );
  const debouncedSaveContent = useDebouncedCallback(
    async ({ editorState }) => {
      if (currentDocumentData) {
        const saveContentResponse =
          await saveDocumentContent({
            variables: {
              documentID:
                currentDocumentVersionDualID.documentID,
              versionName:
                currentDocumentVersionDualID.versionName,
              content: JSON.stringify(editorState),
              wordCount,
              date: getCurrentDateGraphQLString()
            }
          });
        const commentList =
          saveContentResponse.data.saveDocumentContent.comments.map(
            (c: any) =>
              CommentDB.fromGraphQLResponse({ response: c })
          );
        commentsVar(commentList);
      }
    },
    300
  );

  useEffect(() => {
    if (documentVersionQueryData) {
      analyticsLayerStateVar(
        documentVersionQueryData
          .getDocumentVersionFromVersionName.content
      );
    }
  }, [documentVersionQueryData]);

  if (
    !currentDocumentData ||
    !documentVersionQueryData?.getDocumentVersionFromVersionName ||
    documentVersionQueryLoading
  ) {
    return <Loading />;
  }

  if (documentVersionQueryData) {
    initialConfig['editorState'] =
      documentVersionQueryData.getDocumentVersionFromVersionName.content;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100%'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1,
          maxHeight: '78vh',
          overflowY: 'scroll'
        }}
        onScroll={() => {
          if (activeEditor) {
            activeEditor.dispatchCommand(
              SCROLL_COMMAND,
              null
            );
          }
        }}
      >
        <div
          style={{
            width: 700,
            position: 'relative',
            display: 'flex',
            flexDirection: 'column'
          }}
          id='editor-viewport'
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
                flexDirection: 'column',
                position: 'absolute',
                top: 0,
                bottom: 0,
                zIndex: 1,
                width: '100%'
              }}
            >
              {currentDocumentVersionDualID.hasPermission(
                ActionPermission.EditDocumentVersionContent
              ) && <ToolbarPlugin />}
              <RichTextPlugin
                placeholder={null}
                contentEditable={
                  <ReadOnlyContentEditable
                    style={{
                      outline: 0,
                      flex: 1,
                      zIndex: 1,
                      paddingRight: 50,
                      paddingLeft: 50,
                      paddingTop: 50,
                      backgroundColor:
                        currentEditorMode.includes(
                          EditorModes.ANALYTICS
                        )
                          ? 'transparent'
                          : 'white',
                      position: 'relative',
                      display: 'flex',
                      flexDirection: 'column'
                    }}
                    contenteditable={currentDocumentVersionDualID.hasPermission(
                      ActionPermission.EditDocumentVersionContent
                    )}
                    id='editor-content-editable'
                    wsConnected={connected}
                  />
                }
                ErrorBoundary={EditorErrorBoundary}
              />
              <OnChangePlugin
                onChange={async (
                  editorState: EditorState,
                  editor: LexicalEditor
                ) => {
                  analyticsLayerStateVar(editorState);
                  await debouncedSaveContent({
                    editorState
                  });
                }}
                ignoreSelectionChange
              />
              <AutoFocusPlugin />
              <ListPlugin />
              <TabIndentationPlugin />
              {!currentDocumentVersionDualID.hasPermission(
                ActionPermission.EditDocumentVersionContent
              ) && <DisableKeyboardShortcutsPlugin />}
              {/* <MarkdownShortcutPlugin
              transformers={TRANSFORMERS}
            /> */}
              <CommentPlugin />
              <EmitEditorObjectPlugin />
              {/* <UpdateStatePlugin /> */}
              {currentDocumentVersionDualID.documentVersionID &&
                user && (
                  <CollaborationPluginWrapper
                    id={`document-${currentDocumentVersionDualID.documentVersionID}`}
                    providerFactory={wsProviderFactory}
                    shouldBootstrap={true}
                    username={
                      user.firstName ?? user.username
                    }
                    initialEditorState={
                      initialConfig['editorState']
                    }
                  />
                )}
              <StatisticsPlugin
                inputType={InputType.DOCUMENT}
              />
              <WordCounterPlugin />
              <SetDocumentContentOnLoadPlugin />
              <HeaderPlugin />
            </div>
          </LexicalComposer>
          {currentEditorMode.includes(
            EditorModes.ANALYTICS
          ) && (
            <LexicalComposer
              initialConfig={{
                ...initialConfig,
                editable: false
              }}
            >
              <div
                style={{
                  flex: 1,
                  flexDirection: 'column',
                  top: 0,
                  bottom: 0
                }}
              >
                <RichTextPlugin
                  placeholder={null}
                  contentEditable={
                    <ReadOnlyContentEditable
                      style={{
                        outline: 0,
                        height: '100%',
                        zIndex: 1,
                        color: 'white',
                        paddingRight: 50,
                        paddingLeft: 50,
                        paddingTop: 50,
                        backgroundColor: 'white'
                      }}
                      contenteditable={false}
                      wsConnected={true}
                    />
                  }
                  ErrorBoundary={EditorErrorBoundary}
                />
                <ListPlugin />
                <ControlledComponentPlugin />
                <AnalyticsPlugin />
              </div>
            </LexicalComposer>
          )}
        </div>
        <div style={{ flex: 1, width: '100%' }}>
          <CommentPanel />
        </div>
      </div>
      <div
        style={{
          flexDirection: 'row',
          justifyContent: 'flex-start'
        }}
      >
        <div
          style={{
            height: 50,
            backgroundColor: 'white',
            width: 700
          }}
        />
      </div>
    </div>
  );
}
