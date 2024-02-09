import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import {
  Button,
  Dropdown,
  Grid,
  Input,
  Modal,
  Text,
  useTheme
} from '@nextui-org/react';
import React, { useMemo, useState } from 'react';
import { currentNoteVar } from '../cache/cache';
import {
  EditableNoteRole,
  NoteRole
} from '../generated/types/graphql';
import { useUserInfo } from '../hooks/useUserInfo';
import { NoteDB } from '../models/note';
import { UserNotePermissionDB } from '../models/userNotePermission';

const ROLES_THAT_CAN_SHARE = [
  NoteRole.Admin,
  NoteRole.Owner
];

export function prettyPrintRole(
  role: NoteRole | EditableNoteRole
) {
  const splitWords = role.split('_');
  return splitWords.map((w) => w.toLowerCase()).join(' ');
}

const SHARE_NOTE = gql`
  mutation shareNote(
    $username: String!
    $noteID: String!
    $role: EditableNoteRole!
  ) {
    shareNote(
      request: {
        username: $username
        noteID: $noteID
        role: $role
      }
    ) {
      username
      userID
      role
      noteID
      userNotePermissionID
    }
  }
`;

export default function NoteShareModal({
  modalOpen,
  setModalOpen,
  note
}: {
  modalOpen: boolean;
  setModalOpen: (arg: boolean) => void;
  note: NoteDB;
}) {
  // const note = useReactiveVar(currentNoteVar);
  const { theme } = useTheme();
  const [usernameToShareTo, setUsernameToShareTo] =
    useState<string>('');
  const [selectedRole, setSelectedRole] =
    useState<EditableNoteRole>(EditableNoteRole.Editor);
  const [shareNote] = useMutation(SHARE_NOTE, {
    variables: {
      username: usernameToShareTo,
      noteID: note.noteID,
      role: selectedRole
    }
  });
  const { user } = useUserInfo();
  const userCanShare = useMemo<boolean>(() => {
    if (note.noteID) {
      return (
        note.userNotePermissions.filter(
          (n) =>
            n.userID === user?.userID &&
            ROLES_THAT_CAN_SHARE.includes(n.role)
        ).length === 1
      );
    }
    return false;
  }, [note, user]);

  return (
    <Modal
      width='500px'
      blur
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
    >
      <Modal.Header
        style={{
          paddingBottom: 0,
          paddingTop: theme.space.md.value
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start',
            flex: 1
          }}
        >
          <Text h4>
            {userCanShare
              ? 'Share note with'
              : 'Shared with'}
          </Text>
        </div>
      </Modal.Header>
      <Modal.Body
        style={{
          paddingTop: 0,
          paddingBottom: theme.space.md.value
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: 10
          }}
        >
          <Input
            placeholder='username'
            onChange={(e) => {
              setUsernameToShareTo(
                e.target.value as string
              );
            }}
            value={usernameToShareTo}
            fullWidth
          />
          <div
            style={{
              marginLeft: 10,
              marginRight: 10
            }}
          >
            <Text>as</Text>
          </div>
          <Dropdown placement='bottom-left'>
            <Dropdown.Button>
              {prettyPrintRole(selectedRole)}
            </Dropdown.Button>
            <Dropdown.Menu
              onAction={(key) => {
                setSelectedRole(key as EditableNoteRole);
              }}
            >
              {Object.values(EditableNoteRole).map((r) => (
                <Dropdown.Item key={r}>
                  {prettyPrintRole(r)}
                </Dropdown.Item>
              ))}
            </Dropdown.Menu>
          </Dropdown>
        </div>
        <div
          style={{
            borderTopStyle: 'solid',
            borderTopColor: theme.colors.gray500.value,
            paddingTop: 10,
            marginBottom: 0
          }}
        >
          <Grid.Container gap={0.5} alignItems='center'>
            {note.userNotePermissions.map((n) => {
              return (
                <React.Fragment
                  key={`notesharedlist-${n.userID}`}
                >
                  <Grid xs={9}>
                    <div style={{ marginLeft: 10 }}>
                      <Text size={theme.fontSizes.xs}>
                        {n.username}
                      </Text>
                    </div>
                  </Grid>
                  <Grid xs={3}>
                    {n.role === NoteRole.Owner ? (
                      <div style={{ paddingLeft: 12 }}>
                        <Text size='$sm'>
                          {prettyPrintRole(
                            n.role as NoteRole
                          )}
                        </Text>
                      </div>
                    ) : (
                      <Dropdown placement='bottom-left'>
                        <Dropdown.Button
                          size='xs'
                          style={{
                            backgroundColor: 'transparent',
                            color: 'black',
                            borderStyle: 'solid',
                            borderWidth: 0.5
                          }}
                        >
                          {prettyPrintRole(
                            n.role as NoteRole
                          )}
                        </Dropdown.Button>
                        <Dropdown.Menu
                          onAction={async (key) => {
                            if (key === 'unshare-user') {
                              console.log('placeholder');

                              // await removeUserFromDocument(
                              //   {
                              //     variables: {
                              //       userDocumentPermissionIDToRemove:
                              //         s.userDocumentPermissionID,
                              //       callerUserDocumentPermissionID:
                              //         isOnDocument
                              //           ? currentDocumentVersionDualID.sharingDocumentPermissionID()
                              //           : currentDocumentVersionDualID.sharingDocumentVersionPermissionID()
                              //     }
                              //   }
                              // );
                              // await loadSharedUsers();
                            }
                          }}
                        >
                          <Dropdown.Item
                            key='unshare-user'
                            color='error'
                          >
                            <Text size='$xs' color='error'>
                              remove
                            </Text>
                          </Dropdown.Item>
                        </Dropdown.Menu>
                      </Dropdown>
                    )}
                  </Grid>
                </React.Fragment>
              );
            })}
          </Grid.Container>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end',
              marginTop: 10,
              borderTopStyle: 'solid',
              borderTopColor: theme.colors.gray500.value,
              paddingTop: 16
            }}
          >
            <Button
              style={{
                backgroundColor: theme.colors.gray600.value,
                marginRight: 10,
                minWidth: 0
              }}
              onClick={() => {
                setModalOpen(false);
              }}
            >
              {userCanShare ? 'Cancel' : 'Close'}
            </Button>
            {userCanShare ? (
              <Button
                style={{ minWidth: 0 }}
                onClick={async () => {
                  if (usernameToShareTo) {
                    const newPermission = await shareNote();
                    const newUnp =
                      UserNotePermissionDB.fromGraphQL(
                        newPermission.data.shareNote
                      );
                    note.userNotePermissionsPush(newUnp);
                  }
                }}
                disabled={!usernameToShareTo}
              >
                Share
              </Button>
            ) : null}
          </div>
        </div>
      </Modal.Body>
    </Modal>
  );
}
