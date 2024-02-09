import {
  Collapse,
  Loading,
  useTheme,
  Dropdown,
  Text,
  Button
} from '@nextui-org/react';
import {
  useReactiveVar,
  gql,
  useMutation
} from '@apollo/client';
import { notesListVar } from '../../cache/cache';
import { useState } from 'react';
import CollapseWrapper from '../CollapseWrapper';
import Note from './Note';
import { useRouter } from 'next/router';
import { useNotes } from '../../hooks/useNotes';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faEllipsis } from '@fortawesome/free-solid-svg-icons/faEllipsis';
import { NoteDB } from '../../models/note';
import SidebarDrawerTitle from '../SidebarDrawerTitle';
import ResponsiveButton from '../ResponsiveButton';

const CREATE_NOTE = gql`
  mutation createNote($documentID: String!) {
    createNote(request: { documentID: $documentID }) {
      title
      noteID
      userNotePermissions {
        noteID
        userID
        role
        username
      }
    }
  }
`;

export default function NoteSection() {
  const notesList = useReactiveVar(notesListVar);
  const router = useRouter();

  const { documentID: documentIDQueryArg } = router.query;
  useNotes({ documentID: documentIDQueryArg as string });
  const { theme } = useTheme();
  const [divStyle, setDivStyle] = useState(null);
  const [createNote] = useMutation(CREATE_NOTE, {
    variables: {
      documentID: documentIDQueryArg
    }
  });
  const [expanded, setExpanded] = useState<boolean>(false);

  if (!notesList) {
    return <Loading />;
  }
  return (
    <Collapse.Group
      style={{
        padding: 0,
        borderBottomStyle: 'solid',
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.white.value
      }}
    >
      {' '}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: '100%',
          borderBottom: 'none'
        }}
      >
        <Collapse
          title={
            <div>
              <SidebarDrawerTitle
                title='Notes'
                expanded={expanded}
                action={
                  <Dropdown placement='bottom-left'>
                    <Dropdown.Trigger>
                      <div
                        style={{
                          height: '100%',
                          backgroundColor:
                            theme.colors.blue500.value,
                          display: 'flex',
                          flexDirection: 'column',
                          justifyContent: 'center',
                          paddingRight:
                            theme.space.xs.value,
                          paddingLeft: theme.space.xs.value,
                          cursor: 'pointer',
                          ...divStyle
                        }}
                        onMouseEnter={() => {
                          setDivStyle({
                            backgroundColor:
                              theme.colors.gray500.value
                          });
                        }}
                        onMouseLeave={() => {
                          setDivStyle(null);
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faEllipsis}
                          color={theme.colors.white.value}
                        />
                      </div>
                    </Dropdown.Trigger>
                    <Dropdown.Menu
                      onAction={async (key) => {
                        if (key === 'create') {
                          const response =
                            await createNote();
                          const newlyCreatedNote =
                            NoteDB.fromGraphQL(
                              response.data.createNote
                            );
                          newlyCreatedNote.new = true;
                          notesListVar([
                            newlyCreatedNote,
                            ...notesList
                          ]);
                          setExpanded(true);
                        }
                      }}
                    >
                      <Dropdown.Item key='create'>
                        Create note
                      </Dropdown.Item>
                    </Dropdown.Menu>
                  </Dropdown>
                }
              />
            </div>
          }
          showArrow={false}
          onChange={(e) => {
            setExpanded(!expanded);
          }}
          style={{ flex: 1 }}
          expanded={expanded}
        >
          {expanded && (
            <Collapse.Group>
              {notesList.length > 0 ? (
                notesList.map((n) => (
                  <Note noteID={n.noteID} key={n.noteID} />
                ))
              ) : (
                <div>
                  <Text
                    style={{
                      letterSpacing:
                        theme.letterSpacings.normal.value
                    }}
                    color={theme.colors.gray600.value}
                  >
                    No notes yet! Notes are a place to keep
                    track of ideas related to your draft.
                  </Text>
                  <div
                    style={{
                      width: '100%',
                      display: 'flex',
                      justifyContent: 'center'
                    }}
                  >
                    <ResponsiveButton
                      onClick={async () => {
                        const response = await createNote();
                        const newlyCreatedNote =
                          NoteDB.fromGraphQL(
                            response.data.createNote
                          );
                        newlyCreatedNote.new = true;
                        notesListVar([
                          newlyCreatedNote,
                          ...notesList
                        ]);
                        setExpanded(true);
                      }}
                    >
                      Create a new note
                    </ResponsiveButton>
                  </div>
                </div>
              )}
            </Collapse.Group>
          )}
        </Collapse>
      </div>
    </Collapse.Group>
  );
}
