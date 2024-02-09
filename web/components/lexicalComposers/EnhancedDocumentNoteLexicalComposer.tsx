import {
  InitialConfigType,
  LexicalComposer
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import ReadOnlyContentEditable from '../editor/ReadOnlyContentEditable';
import EditorErrorBoundary from '../EditorErrorBoundary';
import DraggableHandlePlugin from '../plugins/DraggableHandlePlugin';
import { EnhancedDocument as gql_EnhancedDocument } from '../../generated/types/graphql';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import EmbeddingPlugin from '../plugins/EmbeddingPlugin';
import { ListPlugin } from '@lexical/react/LexicalListPlugin';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import DisallowParagraphCreationPlugin from '../plugins/DisallowParagraphCreationPlugin';
import DebouncedSavePlugin from '../plugins/DebouncedSavePlugin';
import { gql, useMutation } from '@apollo/client';
import { CustomListItemNode } from '../nodes/CustomListItemNode';
import { ListItemNode, ListNode } from '@lexical/list';
import { useWebsocketProvider } from '../../utils/collaboration';
import GenerateIdeasPlugin from '../plugins/GenerateIdeasPlugin';
import { useMemo, useState } from 'react';
import {
  createBulletedListInitialConfig,
  createDemoConfig
} from '../../utils/lexical';
import {
  IDEAS_PANE_DIV_ID,
  ThreadState
} from '../../pages/document/[enhancedDocumentID]';
import BulletPlaceholderPlugin from '../plugins/BulletPlaceholderPlugin';
import { Text, useTheme } from '@nextui-org/react';
import NewInitiateChatPlugin from '../plugins/NewInitiateChatPlugin';
import GenerateDraftPlugin from '../plugins/GenerateDraftPlugin';

export const PREVIEW_CONTAINER_DIV_ID = 'preview-container';

const SAVE_NOTES_CONTENT = gql`
  mutation saveEnhancedDocumentNotesContent(
    $enhancedDocumentID: String!
    $notesContent: String!
  ) {
    saveEnhancedDocumentNotesContent(
      request: {
        enhancedDocumentID: $enhancedDocumentID
        notesContent: $notesContent
      }
    )
  }
`;

const initialConfig: InitialConfigType = {
  theme: {
    list: {
      nested: {
        listitem: 'editor-nested-listitem'
      },
      ol: 'editor-list-ol',
      ul: 'editor-list-ul-1',
      listitem: 'custom-editor-listitem'
    }
  },
  onError: (error: Error) => {
    console.error(error);
    throw error;
  },
  nodes: [
    CustomListItemNode,
    {
      replace: ListItemNode,
      with: () => new CustomListItemNode()
    },
    ListNode
  ],
  namespace: 'editor',
  editorState: null
};

export default function EnhancedDocumentNoteLexicalComposer({
  scrollOffset,
  hoveringOverNotePanel,
  enhancedDocumentID,
  enhancedDocumentData,
  currentThreadState,
  setThreadState,
  setChatWindowOpen
}: {
  scrollOffset?: number;
  hoveringOverNotePanel: boolean;
  enhancedDocumentID?: string;
  enhancedDocumentData?: gql_EnhancedDocument;
  currentThreadState: ThreadState;
  setThreadState: (newThreadState: ThreadState) => void;
  setChatWindowOpen: (open: boolean) => void;
}) {
  const onPublicPage = useMemo(() => {
    return (
      !enhancedDocumentID ||
      !enhancedDocumentData ||
      !enhancedDocumentData.notesContent
    );
  }, [enhancedDocumentData, enhancedDocumentID]);
  const { wsProviderFactory, connected } =
    useWebsocketProvider();
  const [saveNotesContent] = useMutation(
    SAVE_NOTES_CONTENT,
    {
      variables: {
        enhancedDocumentID: '',
        notesContent: ''
      }
    }
  );
  const [placeholderState, setPlaceholderState] =
    useState(false);
  const { theme } = useTheme();
  return (
    <>
      <LexicalComposer
        initialConfig={{
          ...initialConfig,
          ...(onPublicPage
            ? {
                editorState: JSON.stringify(
                  createDemoConfig()
                )
              }
            : null)
        }}
      >
        <div
          style={{
            flex: 1,
            position: 'relative',
            width: '100%',
            height: '100%'
          }}
          id='note-scrolling-container'
        >
          {placeholderState && (
            <div
              style={{
                position: 'absolute',
                top: 12,
                left: 0,
                flex: 1,
                display: 'flex'
              }}
            >
              <div
                style={{
                  zIndex: 2,
                  backgroundColor:
                    'rgba(255, 255, 255, 0.8)',
                  minWidth: 10,
                  marginRight: 12
                }}
              />
              <Text
                style={{
                  letterSpacing: 'normal',
                  color: theme.colors.gray500.value
                }}
              >
                Click here to start taking notes
              </Text>
            </div>
          )}
          <RichTextPlugin
            placeholder={null}
            contentEditable={
              <ReadOnlyContentEditable
                style={{
                  outline: 0,
                  flex: 1,
                  zIndex: 1,
                  backgroundColor: 'transparent',
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  color: placeholderState
                    ? theme.colors.gray500.value
                    : undefined,
                  height: '100%'
                }}
                contenteditable={true}
                id='note-editor-content-editable'
                wsConnected={
                  onPublicPage ? true : connected
                }
              />
            }
            ErrorBoundary={EditorErrorBoundary}
          />
          <DraggableHandlePlugin
            hoveringOverNotePanel={hoveringOverNotePanel}
            scrollOffset={scrollOffset}
          />
          {!onPublicPage && (
            <CollaborationPlugin
              id={`enhanced-document-${enhancedDocumentID}`}
              providerFactory={wsProviderFactory}
              shouldBootstrap={true}
              username={'test'}
              initialEditorState={
                enhancedDocumentData.notesContent
              }
            />
          )}
          {/* <EmbeddingPlugin
            enhancedDocumentID={
              enhancedDocumentID as string
            }
            existingEmbeddings={JSON.parse(
              enhancedDocumentData.embeddingsByNodeID
            )}
            scrollOffset={scrollOffset}
          /> */}
          <ListPlugin />
          <TabIndentationPlugin />
          <DisallowParagraphCreationPlugin />
          {!onPublicPage && (
            <DebouncedSavePlugin
              saveMutation={saveNotesContent}
              variables={{
                enhancedDocumentID:
                  enhancedDocumentID as string
              }}
              contentArgName='notesContent'
            />
          )}
          {/* <GenerateIdeasPlugin
            enhancedDocumentID={
              onPublicPage
                ? null
                : (enhancedDocumentID as string)
            }
            existingIdeas={
              onPublicPage
                ? [
                    'Multi-cursor functionality in collaboration can increase productivity and enable real-time editing, but what potential challenges or conflicts could arise with multiple users editing simultaneously?',
                    'Shared spaces may raise privacy and security concerns, especially in sensitive projects.'
                  ]
                : enhancedDocumentData.ideas
            }
          /> */}
          <BulletPlaceholderPlugin
            setPlaceholderState={setPlaceholderState}
          />
          <NewInitiateChatPlugin
            currentThreadState={currentThreadState}
            setThreadState={setThreadState}
            setChatWindowOpen={setChatWindowOpen}
            listPlugin={true}
            enhancedDocumentID={enhancedDocumentID}
          />
          <GenerateDraftPlugin
            enhancedDocumentID={
              enhancedDocumentID as string
            }
          />
        </div>
      </LexicalComposer>
      <div
        id={PREVIEW_CONTAINER_DIV_ID}
        style={{ position: 'absolute', zIndex: -1000 }}
      />
    </>
  );
}
