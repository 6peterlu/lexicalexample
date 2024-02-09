import {
  gql,
  useMutation,
  useQuery,
  useReactiveVar
} from '@apollo/client';
import {
  Button,
  Input,
  Loading,
  Text,
  Textarea,
  Tooltip,
  useTheme
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { EnhancedDocument as gql_EnhancedDocument } from '../../generated/types/graphql';
import { useDebouncedCallback } from 'use-debounce';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faArrowLeft } from '@fortawesome/free-solid-svg-icons/faArrowLeft';
import { faAnglesRight } from '@fortawesome/free-solid-svg-icons/faAnglesRight';
import { AnimatePresence, motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import LandingPage from '../../components/LandingPage';
import EnhancedDocumentNoteLexicalComposer from '../../components/lexicalComposers/EnhancedDocumentNoteLexicalComposer';
import SectionSeparator from '../../components/SectionSeparator';
import useOutsideAlerter from '../../hooks/useOutsideAlerter';
import { chatWindowOpenVar } from '../../cache/cache';
import { set } from 'date-fns';
import { v4 } from 'uuid';
import EnhancedDocumentDraftLexicalComposer from '../../components/lexicalComposers/EnhancedDocumentDraftLexicalComposer';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { faCircleArrowUp } from '@fortawesome/free-solid-svg-icons/faCircleArrowUp';

const GET_ENHANCED_DOCUMENT = gql`
  query getEnhancedDocument($enhancedDocumentID: String!) {
    getEnhancedDocument(
      args: { enhancedDocumentID: $enhancedDocumentID }
    ) {
      enhancedDocumentID
      title
      notesContent
      embeddingsByNodeID
      draftContent
      draftCollapsed
      ideas
    }
  }
`;

const UPDATE_TITLE = gql`
  mutation updateTitle(
    $enhancedDocumentID: String!
    $updatedTitle: String!
  ) {
    updateTitle(
      request: {
        enhancedDocumentID: $enhancedDocumentID
        updatedTitle: $updatedTitle
      }
    )
  }
`;

const SET_DRAFT_COLLAPSED = gql`
  mutation setDraftCollapsed(
    $enhancedDocumentID: String!
    $collapsed: Boolean!
  ) {
    setDraftCollapsed(
      request: {
        enhancedDocumentID: $enhancedDocumentID
        collapsed: $collapsed
      }
    )
  }
`;

export const DRAG_AREA_DIV_ID = 'drag-area';
export const EMBEDDING_AREA_DIV_ID = 'embedding-area';
export const EMBEDDING_DETAIL_DIV_ID = 'embedding-detail';
export const IDEAS_PANE_DIV_ID = 'ideas-pane';
export const START_CHAT_DIV_ID = 'initiate-chat-buttons';
export const CHAT_WINDOW_DIV_ID = 'chat-window';
export const GENERATE_DRAFT_DIV_ID =
  'generate-draft-button';
export const COPY_ALL_DIV_ID = 'copy-all-button';
const CHATBOX_HEIGHT = 400;
const CHATBOX_WIDTH = 400;

enum ChatMessageType {
  USER = 'USER',
  SYSTEM = 'SYSTEM'
}

export type ChatMessage = {
  message: string;
  sender: ChatMessageType;
};

export type ThreadState = {
  threadID: string;
  plainText: string; // lexical config stringified
  sectionText: string; // markdown string
  document: string; // markdown string
  messages: ChatMessage[];
  chatWindowOpen: boolean;
};

const START_CHAT_CONVERSATION = gql`
  mutation startChatConversation(
    $enhancedDocumentID: String!
    $sectionJSON: String!
    $sectionText: String!
    $document: String!
    $chatMessage: String!
  ) {
    startChatConversation(
      request: {
        enhancedDocumentID: $enhancedDocumentID
        sectionJSON: $sectionJSON
        sectionText: $sectionText
        document: $document
        chatMessage: $chatMessage
      }
    ) {
      threadID
      responseMessage
    }
  }
`;

const CONTINUE_CHAT_CONVERSATION = gql`
  mutation continueChatConversation(
    $threadID: String!
    $chatMessage: String!
    $enhancedDocumentID: String!
  ) {
    continueChatConversation(
      request: {
        threadID: $threadID
        chatMessage: $chatMessage
        enhancedDocumentID: $enhancedDocumentID
      }
    ) {
      responseMessage
    }
  }
`;

export default function EnhancedDocument() {
  const { data: session, status } = useSession();

  const router = useRouter();
  const { theme } = useTheme();
  const scrollableRef = useRef<HTMLDivElement>(null);
  const { enhancedDocumentID } = router.query;
  const [threadState, setThreadState] =
    useState<ThreadState>({
      threadID: null,
      plainText: '',
      sectionText: '',
      document: '',
      messages: [],
      chatWindowOpen: false
    });
  const [chatWindowOpen, setChatWindowOpen] =
    useState(false);
  const { data } = useQuery(GET_ENHANCED_DOCUMENT, {
    variables: {
      enhancedDocumentID
    },
    fetchPolicy: 'no-cache'
  });
  const [updateTitle] = useMutation(UPDATE_TITLE, {
    variables: {
      enhancedDocumentID: '',
      updatedTitle: ''
    }
  });
  const [
    startChatConversation,
    { loading: startChatLoading }
  ] = useMutation(START_CHAT_CONVERSATION, {
    variables: {
      enhancedDocumentID: '',
      sectionJSON: '',
      sectionText: '',
      document: '',
      chatMessage: ''
    }
  });
  const [
    continueChatConversation,
    { loading: continueChatLoading }
  ] = useMutation(CONTINUE_CHAT_CONVERSATION, {
    variables: {
      threadID: '',
      chatMessage: '',
      enhancedDocumentID: ''
    }
  });
  const chatLoading = useMemo(() => {
    return startChatLoading || continueChatLoading;
  }, [startChatLoading, continueChatLoading]);

  const [setDraftCollapsedMutation] = useMutation(
    SET_DRAFT_COLLAPSED,
    {
      variables: {
        enhancedDocumentID: '',
        collapsed: true
      }
    }
  );

  const debouncedUpdateTitle = useDebouncedCallback(
    updateTitle,
    300
  );
  const [enhancedDocumentData, setEnhancedDocumentData] =
    useState<gql_EnhancedDocument>(null);

  useEffect(() => {
    document.addEventListener('dragover', function (e) {
      e.preventDefault();
    });
  }, []);

  const [hoveringOverNotePanel, setHoveringOverNotePanel] =
    useState(false);
  const [scrollOffset, setScrollOffset] =
    useState<number>(0);
  const [collapsedDraft, setCollapsedDraft] =
    useState(true);

  useEffect(() => {
    if (data) {
      setEnhancedDocumentData(data.getEnhancedDocument);
      setCollapsedDraft(
        data.getEnhancedDocument.draftCollapsed
      );
    }
  }, [data]);

  const chatWindowOpenState = useReactiveVar(
    chatWindowOpenVar
  );

  const onMouseOver = useCallback(() => {
    if (!hoveringOverNotePanel) {
      setHoveringOverNotePanel(true);
    }
  }, [hoveringOverNotePanel]);
  const [messageInput, setMessageInput] = useState('');
  useEffect(() => {
    if (!chatWindowOpenState) {
      setMessageInput('');
      setThreadState({
        threadID: null,
        plainText: '',
        sectionText: '',
        document: '',
        messages: [],
        chatWindowOpen: false
      });
    }
  }, [chatWindowOpenState]);

  const submitChat = useCallback(async () => {
    const updatedMessages = [
      ...threadState.messages,
      {
        sender: ChatMessageType.USER,
        message: messageInput
      }
    ];
    setThreadState({
      ...threadState,
      messages: updatedMessages
    });
    setMessageInput('');
    if (threadState.threadID) {
      const response = await continueChatConversation({
        variables: {
          threadID: threadState.threadID,
          chatMessage: messageInput,
          enhancedDocumentID: enhancedDocumentID as string
        }
      });
      updatedMessages.push({
        sender: ChatMessageType.SYSTEM,
        message:
          response.data.continueChatConversation
            .responseMessage
      });
    } else {
      const response = await startChatConversation({
        variables: {
          enhancedDocumentID: enhancedDocumentID as string,
          sectionText: threadState.sectionText,
          sectionJSON: threadState.plainText,
          document: threadState.document,
          chatMessage: messageInput
        }
      });

      updatedMessages.push({
        sender: ChatMessageType.SYSTEM,
        message:
          response.data.startChatConversation
            .responseMessage
      });

      setThreadState({
        ...threadState,
        messages: updatedMessages,
        threadID:
          response.data.startChatConversation.threadID
      });
    }
  }, [
    continueChatConversation,
    enhancedDocumentID,
    messageInput,
    startChatConversation,
    threadState
  ]);
  if (
    !enhancedDocumentData ||
    !enhancedDocumentData.notesContent
  ) {
    return <Loading />;
  }
  if (!session) {
    // not signed in
    return <LandingPage />;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        height: '100vh',
        maxHeight: '100vh',
        paddingTop: theme.space.xl.value,
        paddingLeft: theme.space.xl.value,
        paddingRight: theme.space.xl.value,
        paddingBottom: theme.space.xl.value
      }}
      className='fill-safari-view-height'
      onDragOver={(e) => {
        e.dataTransfer.dropEffect = 'move';
        e.currentTarget.style.cursor = 'grabbing';
        e.preventDefault();
      }}
      onDragLeave={(e) => {
        e.currentTarget.style.cursor = 'auto';
        e.preventDefault();
      }}
      onDrop={(e) => {
        e.dataTransfer.dropEffect = 'none';
        e.currentTarget.style.cursor = 'auto';
        e.preventDefault();
      }}
    >
      <div
        style={{
          marginBottom: theme.space.md.value,
          paddingLeft: 50,
          display: 'flex'
        }}
      >
        <motion.div
          style={{
            width: 50,
            height: 50,
            borderStyle: 'solid',
            borderWidth: 1,
            borderColor: theme.colors.gray500.value,
            color: theme.colors.gray500.value,
            marginLeft: -36 - 50,
            marginRight: 36,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          whileHover={{
            backgroundColor: theme.colors.black.value,
            color: theme.colors.white.value,
            borderColor: theme.colors.black.value,
            cursor: 'pointer'
          }}
          onClick={() => {
            router.push('/');
          }}
        >
          <FontAwesomeIcon icon={faArrowLeft} />
        </motion.div>
        <input
          value={enhancedDocumentData.title}
          size={Math.min(
            enhancedDocumentData.title.length ?? 10 + 1,
            50
          )}
          aria-label='Document title input'
          style={{
            fontSize: theme.fontSizes.xl.value,
            fontWeight: 'bold',
            border: 'none'
          }}
          onChange={(e) => {
            debouncedUpdateTitle({
              variables: {
                enhancedDocumentID:
                  enhancedDocumentID as string,
                updatedTitle: e.target.value
              }
            });
            setEnhancedDocumentData({
              ...enhancedDocumentData,
              title: e.target.value
            });
          }}
          placeholder='placeholder'
        />
      </div>
      <div
        style={{
          display: 'flex',
          flex: 1,
          width: '100%',
          height: '100%'
        }}
      >
        <motion.div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column'
          }}
          layout='position'
        >
          <div style={{ marginLeft: 30 }}>
            <SectionSeparator sectionTitle='notes' />
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              flex: 1,
              width: '100%',
              overflowY: 'auto',
              position: 'relative'
            }}
            id={'note-content-editable-container'}
          >
            <motion.div
              style={{
                display: 'flex',
                flexDirection: 'column',
                flex: 1,
                overflowY: 'auto'
              }}
            >
              <div
                ref={scrollableRef}
                onScroll={() => {
                  setScrollOffset(
                    scrollableRef.current.scrollTop
                  );
                }}
                style={{
                  display: 'flex',
                  flexDirection: 'row'
                }}
                onMouseEnter={onMouseOver}
                onMouseLeave={() => {
                  if (hoveringOverNotePanel) {
                    setHoveringOverNotePanel(false);
                  }
                }}
                className={
                  hoveringOverNotePanel
                    ? undefined
                    : 'hide-scrollbar'
                }
              >
                <motion.div
                  layout
                  style={{
                    position: 'relative',
                    height: '100%',
                    minWidth: 30
                  }}
                  id={DRAG_AREA_DIV_ID}
                />
                <motion.div
                  layout='position'
                  style={{ flex: 1, height: '100%' }}
                >
                  <EnhancedDocumentNoteLexicalComposer
                    scrollOffset={scrollOffset}
                    hoveringOverNotePanel={
                      hoveringOverNotePanel
                    }
                    enhancedDocumentData={
                      enhancedDocumentData
                    }
                    enhancedDocumentID={
                      enhancedDocumentID as string
                    }
                    currentThreadState={threadState}
                    setThreadState={setThreadState}
                    setChatWindowOpen={setChatWindowOpen}
                  />
                </motion.div>
                {/* <motion.div
                  layout
                  style={{
                    position: 'relative',
                    height: '100%',
                    minWidth: 30
                  }}
                  id={START_CHAT_DIV_ID}
                /> */}
              </div>
            </motion.div>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              minHeight: 100
            }}
            id={GENERATE_DRAFT_DIV_ID}
          />
        </motion.div>
        <motion.div
          onClick={async () => {
            await setDraftCollapsedMutation({
              variables: {
                enhancedDocumentID:
                  enhancedDocumentID as string,
                collapsed: !collapsedDraft
              }
            });
            setCollapsedDraft(!collapsedDraft);
          }}
          whileHover={{
            backgroundColor: theme.colors.gray100.value,
            color: theme.colors.black.value
          }}
          transition={{ type: 'tween' }}
          style={{
            paddingRight: 2,
            paddingLeft: 2,
            cursor: 'pointer',
            backgroundColor: theme.colors.white.value,
            color: theme.colors.gray500.value
          }}
        >
          <motion.div
            animate={{ rotate: collapsedDraft ? 180 : 0 }}
          >
            <FontAwesomeIcon icon={faAnglesRight} />
          </motion.div>
        </motion.div>
        {!collapsedDraft && (
          <div
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <div style={{ display: 'flex' }}>
              <SectionSeparator sectionTitle='draft' />
              <div id={COPY_ALL_DIV_ID} />
            </div>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flex: 1,
                width: '100%',
                marginBottom: 100,
                overflowY: 'auto',
                position: 'relative'
              }}
              id={'draft-content-editable-container'}
            >
              <motion.div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  flex: 1
                }}
              >
                <EnhancedDocumentDraftLexicalComposer
                  enhancedDocumentData={
                    enhancedDocumentData
                  }
                  enhancedDocumentID={
                    enhancedDocumentID as string
                  }
                  currentThreadState={threadState}
                  setThreadState={setThreadState}
                  setChatWindowOpen={setChatWindowOpen}
                />
              </motion.div>
            </div>
          </div>
        )}
      </div>
      {/* <AnimatePresence>
        {threadState.chatWindowOpen && ( */}
      <motion.div
        // layoutDependency={chatWindowOpenState}
        key='chat-window-slider'
        style={{
          position: 'absolute',
          backgroundColor: theme.colors.white.value,
          borderColor: theme.colors.black.value,
          borderStyle: 'solid',
          borderWidth: 1,
          borderRightWidth: 0,
          padding: theme.space.md.value,
          zIndex: 1,
          right: 0,
          bottom: 0,
          display: 'flex',
          flexDirection: 'column',
          width: CHATBOX_WIDTH
        }}
      >
        <Tooltip
          content='Draft Zero has the context of your document. Try asking it questions like, "Can you provide me different perspectives on this idea?"'
          style={{ width: '100%' }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              width: '100%',
              borderStyle: 'solid',
              borderWidth: 0,
              borderBottomWidth: 1,
              borderColor: theme.colors.black.value,
              flexDirection: 'column',
              cursor: threadState.sectionText
                ? 'pointer'
                : 'default'
            }}
            onClick={() => {
              setChatWindowOpen(!chatWindowOpen);
            }}
          >
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between'
              }}
            >
              <div>
                <Text style={{ fontFamily: 'Alata' }}>
                  {threadState.sectionText
                    ? 'ask me anything about:'
                    : 'select text to discuss'}
                </Text>
              </div>
              {threadState.sectionText && (
                <motion.div
                  animate={{
                    rotate: chatWindowOpen ? 0 : -90
                  }}
                >
                  <FontAwesomeIcon icon={faChevronDown} />
                </motion.div>
              )}
            </div>
            <Text style={{ whiteSpace: 'pre-wrap' }}>
              {threadState.plainText}
            </Text>
          </div>
        </Tooltip>
        {chatWindowOpen && threadState.sectionText && (
          <>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                paddingTop: theme.space.md.value,
                overflowY: 'auto',
                maxHeight: CHATBOX_HEIGHT
              }}
            >
              {threadState.messages.map((message, i) => (
                <div
                  key={v4()}
                  style={{
                    padding: theme.space.xs.value,
                    backgroundColor:
                      message.sender ===
                      ChatMessageType.USER
                        ? theme.colors.blue600.value
                        : theme.colors.gray500.value,
                    borderRadius: theme.radii.md.value,
                    marginBottom: theme.space.xs.value,

                    alignSelf:
                      message.sender ===
                      ChatMessageType.USER
                        ? 'flex-end'
                        : 'flex-start',
                    maxWidth: '70%'
                  }}
                >
                  <Text
                    style={{
                      color:
                        message.sender ===
                        ChatMessageType.USER
                          ? theme.colors.white.value
                          : theme.colors.black.value,
                      letterSpacing: 'normal'
                    }}
                  >
                    {message.message}
                  </Text>
                </div>
              ))}
              {chatLoading && (
                <div
                  className='chat-bubble'
                  style={{
                    width: 60,
                    backgroundColor:
                      theme.colors.gray500.value
                  }}
                >
                  <div className='typing'>
                    <div className='dot'></div>
                    <div className='dot'></div>
                    <div className='dot'></div>
                  </div>
                </div>
              )}
            </div>
            <div style={{ flex: 0, display: 'flex' }}>
              <Textarea
                onChange={(e) =>
                  setMessageInput(e.target.value)
                }
                autoFocus={true}
                value={messageInput}
                aria-label='chat message input'
                fullWidth={true}
                maxRows={3}
                minRows={1}
                onKeyDown={async (e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    await submitChat();
                  }
                }}
                placeholder='Can you provide me different perspectives on this idea?'
              />
              <Button
                disabled={!messageInput}
                onClick={async () => {
                  await submitChat();
                }}
                style={{ minWidth: 0 }}
              >
                <FontAwesomeIcon icon={faCircleArrowUp} />
              </Button>
            </div>
          </>
        )}
      </motion.div>
      {/* )}
      </AnimatePresence> */}
      {/* <motion.div
        style={{
          position: 'relative',
          flex: 0,
          display: 'flex',
          flexDirection: 'column'
        }}
        id={IDEAS_PANE_DIV_ID}
      /> */}
    </div>
  );
}
