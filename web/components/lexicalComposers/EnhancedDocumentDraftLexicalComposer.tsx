import {
  InitialConfigType,
  LexicalComposer
} from '@lexical/react/LexicalComposer';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import { Text, useTheme } from '@nextui-org/react';
import ReadOnlyContentEditable from '../editor/ReadOnlyContentEditable';
import EditorErrorBoundary from '../EditorErrorBoundary';
import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import DebouncedSavePlugin from '../plugins/DebouncedSavePlugin';
import { useWebsocketProvider } from '../../utils/collaboration';
import { EnhancedDocument as gql_EnhancedDocument } from '../../generated/types/graphql';
import { gql, useMutation } from '@apollo/client';
import ShareEditorContextPlugin from '../plugins/ShareEditorContextPlugin';
import NewInitiateChatPlugin from '../plugins/NewInitiateChatPlugin';
import { ThreadState } from '../../pages/document/[enhancedDocumentID]';
import CopyAllPlugin from '../plugins/CopyAllPlugin';

const SAVE_DRAFT_CONTENT = gql`
  mutation updateDraft(
    $enhancedDocumentID: String!
    $draftContent: String!
  ) {
    updateDraft(
      request: {
        enhancedDocumentID: $enhancedDocumentID
        updatedDraftContent: $draftContent
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
    },
    paragraph: 'editor-paragraph'
  },
  onError: (error: Error) => {
    console.error(error);
    throw error;
  },
  namespace: 'editor',
  editorState: null
};

export default function EnhancedDocumentDraftLexicalComposer({
  enhancedDocumentID,
  enhancedDocumentData,
  currentThreadState,
  setThreadState,
  setChatWindowOpen
}: {
  enhancedDocumentID: string;
  enhancedDocumentData: gql_EnhancedDocument;
  currentThreadState: ThreadState;
  setThreadState: (newThreadState: ThreadState) => void;
  setChatWindowOpen: (open: boolean) => void;
}) {
  const { wsProviderFactory, connected } =
    useWebsocketProvider();
  const { theme } = useTheme();
  const [saveDraftContent] = useMutation(
    SAVE_DRAFT_CONTENT,
    {
      variables: {
        enhancedDocumentID: '',
        draftContent: ''
      }
    }
  );
  return (
    <LexicalComposer
      initialConfig={{
        ...initialConfig
      }}
    >
      <RichTextPlugin
        placeholder={
          <div
            style={{
              position: 'absolute',
              pointerEvents: 'none',
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              top: 0
            }}
          >
            <Text
              color={theme.colors.gray500.value}
              size='md'
              style={{
                letterSpacing:
                  theme.letterSpacings.normal.value
              }}
            >
              now put it all together
            </Text>
          </div>
        }
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
              letterSpacing: 'normal'
            }}
            contenteditable={true}
            id='editor-content-editable-3'
            wsConnected={connected}
          />
        }
        ErrorBoundary={EditorErrorBoundary}
      />
      <CollaborationPlugin
        id={`enhanced-document-draft-${enhancedDocumentID}`}
        providerFactory={wsProviderFactory}
        shouldBootstrap={true}
        username={'test'}
        initialEditorState={
          enhancedDocumentData.draftContent
        }
      />
      <DebouncedSavePlugin
        saveMutation={saveDraftContent}
        variables={{
          enhancedDocumentID: enhancedDocumentID as string
        }}
        contentArgName='draftContent'
      />
      <ShareEditorContextPlugin />
      <NewInitiateChatPlugin
        currentThreadState={currentThreadState}
        setThreadState={setThreadState}
        setChatWindowOpen={setChatWindowOpen}
        listPlugin={false}
        enhancedDocumentID={enhancedDocumentID}
      />
      <CopyAllPlugin />
    </LexicalComposer>
  );
}
