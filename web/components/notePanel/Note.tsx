import {
  useQuery,
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import {
  Collapse,
  Loading,
  useTheme,
  Dropdown,
  Text
} from '@nextui-org/react';
import { useMemo, useState, useRef, Key } from 'react';
import { NoteDB } from '../../models/note';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons/faEllipsis';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import ReadOnlyContentEditable from '../editor/ReadOnlyContentEditable';
import { PlainTextPlugin } from '@lexical/react/LexicalPlainTextPlugin';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { EditorState } from 'lexical';
import CollaborationPluginWrapper from '../plugins/CollaborationPluginWrapper';
import { useWebsocketProvider } from '../../utils/collaboration';
import { useUserInfo } from '../../hooks/useUserInfo';
import {
  generateInitialLexicalConfigFromText,
  extractTextFromEditorState
} from '../../utils/lexical';
import { useDebouncedCallback } from 'use-debounce';
import NoteEditor from '../NoteEditor';
import { motion } from 'framer-motion';
import { HoverStyleButton } from '../HoverStyleButton';
import NoteShareModal from '../NoteShareModal';
import { notesListVar } from '../../cache/cache';

const LOAD_NOTE = gql`
  query getNote($noteID: String!) {
    getNote(args: { noteID: $noteID }) {
      content
      noteID
      title
      userNotePermissions {
        userID
        noteID
        role
        username
      }
    }
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

const DELETE_NOTE = gql`
  mutation deleteNote($noteID: String!) {
    deleteNote(request: { noteID: $noteID })
  }
`;

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  placeholder: 'editor-placeholder',
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

function EditorErrorBoundary({
  onError,
  children
}: {
  onError: (error: Error) => void;
  children: JSX.Element;
}) {
  return <>{children}</>;
}

enum NoteActions {
  Share = 'SHARE',
  Delete = 'DELETE'
}

export default function Note({
  noteID
}: {
  noteID: string;
}) {
  const notesList = useReactiveVar(notesListVar);
  const [expanded, setExpanded] = useState(
    !!notesList.filter((n) => n.noteID === noteID)[0].new
  );
  const [editingTitle, setEditingTitle] = useState(false);
  const [shareModalOpen, setShareModalOpen] =
    useState(false);
  const { theme } = useTheme();
  const { user } = useUserInfo();
  const timer = useRef<NodeJS.Timeout>();
  function onSingleClick() {
    if (!editingTitle) {
      setExpanded(!expanded);
    }
  }
  function onDoubleClick() {
    setEditingTitle(true);
  }
  function onClickHandler(e: any) {
    clearTimeout(timer.current);
    if (e.detail === 1) {
      timer.current = setTimeout(onSingleClick, 200);
    } else if (e.detail === 2) {
      onDoubleClick();
    }
  }
  const {
    called: notesRetrieveCalled,
    loading: notesRetrieveLoading,
    error: notesRetrieveError,
    data: notesRetrieveData
  } = useQuery(LOAD_NOTE, {
    variables: { noteID },
    fetchPolicy: 'no-cache'
  });
  const [saveNoteTitle] = useMutation(SAVE_NOTE_TITLE);

  const [deleteNote] = useMutation(DELETE_NOTE, {
    variables: { noteID }
  });

  const { wsProviderFactory, connected } =
    useWebsocketProvider();

  const debouncedSaveTitle = useDebouncedCallback(
    async (editorState) => {
      const updatedTitle =
        extractTextFromEditorState(editorState);
      await saveNoteTitle({
        variables: {
          noteID: noteID,
          title: updatedTitle
        }
      });
    },
    300
  );

  const currentNote = useMemo(() => {
    if (!notesRetrieveData) {
      return null;
    }
    return NoteDB.fromGraphQL(notesRetrieveData.getNote);
  }, [notesRetrieveData]);
  if (
    !noteID ||
    !notesRetrieveCalled ||
    notesRetrieveLoading ||
    !notesRetrieveData
  ) {
    return <Loading />;
  }
  titleInitialConfig.editorState = notesList.filter(
    (n) => n.noteID === noteID
  )[0].title
    ? generateInitialLexicalConfigFromText(
        notesList.filter((n) => n.noteID === noteID)[0]
          .title
      )
    : null;
  return (
    <>
      <Collapse.Group
        style={{
          padding: 0,
          marginRight: `-${theme.space.sm.value}`,
          marginLeft: `-${theme.space.sm.value}`
        }}
      >
        <Collapse
          preventDefault={false}
          title={
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'center',
                borderWidth: 1,
                borderStyle: 'solid',
                borderColor: theme.colors.blue500.value,
                cursor: 'pointer'
              }}
            >
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  backgroundColor:
                    theme.colors.gray50.value,

                  paddingLeft: theme.space.xs.value,

                  paddingBottom: 0,
                  flex: 1
                }}
                onClick={onClickHandler}
              >
                <div
                  style={{
                    paddingRight: theme.space.xs.value
                  }}
                >
                  <motion.div
                    animate={expanded ? { rotate: 90 } : {}}
                  >
                    <FontAwesomeIcon
                      icon={faChevronRight}
                      color={theme.colors.gray500.value}
                      size='xs'
                    />
                  </motion.div>
                </div>
                <LexicalComposer
                  initialConfig={{
                    ...titleInitialConfig
                  }}
                >
                  <div
                    style={{
                      display: 'flex',
                      flex: 1,
                      flexDirection: 'column',
                      fontSize: 16,
                      height: '100%'
                    }}
                    onBlur={() => setEditingTitle(false)}
                  >
                    <PlainTextPlugin
                      placeholder={
                        <Text
                          color={theme.colors.gray600.value}
                          style={{
                            position: 'absolute',
                            pointerEvents: 'none'
                          }}
                        >
                          Untitled
                        </Text>
                      }
                      contentEditable={
                        <ReadOnlyContentEditable
                          style={{
                            outline: 1,
                            flex: 1,
                            fontWeight: 'bold',
                            color: theme.colors.black.value,
                            minHeight: 28
                          }}
                          contenteditable={editingTitle}
                          wsConnected={connected}
                        />
                      }
                      ErrorBoundary={EditorErrorBoundary}
                    />
                    <OnChangePlugin
                      onChange={async (
                        editorState: EditorState
                      ) => {
                        await debouncedSaveTitle(
                          editorState
                        );
                      }}
                      ignoreSelectionChange
                    />
                    {/* <RemoveLineBreakPlugin /> */}
                    <CollaborationPluginWrapper
                      id={`note-title-${noteID}`}
                      providerFactory={wsProviderFactory}
                      shouldBootstrap={true}
                      username={
                        user?.firstName ?? user?.username
                      }
                      initialEditorState={
                        titleInitialConfig.editorState
                      }
                    />
                  </div>
                </LexicalComposer>
              </div>
              <Dropdown placement='bottom-left'>
                <Dropdown.Trigger>
                  <div>
                    <HoverStyleButton>
                      <motion.div
                        style={{
                          paddingLeft: theme.space.xs.value,
                          paddingRight:
                            theme.space.xs.value,
                          color: theme.colors.gray500.value
                        }}
                        whileHover={{
                          color: theme.colors.black.value
                        }}
                        transition={{ duration: 0 }}
                      >
                        <FontAwesomeIcon
                          icon={faEllipsis}
                        />
                      </motion.div>
                    </HoverStyleButton>
                  </div>
                </Dropdown.Trigger>
                <Dropdown.Menu
                  // note for the future: keys need to be strings for NextUI to work
                  onAction={async (key: Key) => {
                    if (key === NoteActions.Share) {
                      setShareModalOpen(true);
                    } else if (key === NoteActions.Delete) {
                      // send delete note mutation
                      await deleteNote();
                      // filter current note out of notes list
                      notesListVar(
                        notesList.filter(
                          (n) => n.noteID !== noteID
                        )
                      );
                    }
                  }}
                >
                  <Dropdown.Item key={NoteActions.Share}>
                    Share
                  </Dropdown.Item>
                  <Dropdown.Item
                    key={NoteActions.Delete}
                    color='error'
                  >
                    Delete
                  </Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
            </div>
          }
          expanded={expanded}
          disabled={true}
          showArrow={false}
        >
          {expanded && (
            <div
              style={{
                borderWidth: 0.5,
                borderStyle: 'dotted',
                borderColor: theme.colors.black.value,
                minHeight: 68
              }}
            >
              <NoteEditor noteID={noteID} />
            </div>
          )}
        </Collapse>
      </Collapse.Group>
      <NoteShareModal
        modalOpen={shareModalOpen}
        setModalOpen={setShareModalOpen}
        note={currentNote}
      />
    </>
  );
}
