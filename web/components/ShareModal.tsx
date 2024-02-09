import {
  gql,
  useLazyQuery,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import {
  Button,
  Dropdown,
  Grid,
  Input,
  Loading,
  Modal,
  Switch,
  Text,
  Tooltip,
  useTheme
} from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { UserMetadataDB } from '../models/user';
import {
  ActionPermission,
  EditableRole,
  Role,
  UserDocumentPermissionMetadata as gql_UserDocumentPermissionMetadata
} from '../generated/types/graphql';
import { currentDocumentVersionIDVar } from '../cache/cache';
import { useUserInfo } from '../hooks/useUserInfo';
import ShareTable from './ShareTable';

const LOAD_SHARED_USERS = gql`
  query getSharedWith(
    $documentID: String!
    $versionName: String
  ) {
    getSharedWith(
      args: {
        documentID: $documentID
        versionName: $versionName
      }
    ) {
      sharedOnDocumentVersion {
        username
        userID
        role
        userDocumentPermissionID
      }
      sharedOnDocument {
        username
        userID
        role
        userDocumentPermissionID
      }
    }
  }
`;

const SHARE_DOCUMENT = gql`
  mutation shareDocument(
    $username: String!
    $documentID: String!
    $role: EditableRole!
  ) {
    shareDocument(
      request: {
        username: $username
        documentID: $documentID
        role: $role
      }
    ) {
      userDocumentPermission {
        username
        userID
        role
      }
    }
  }
`;

const SHARE_DOCUMENT_VERSION = gql`
  mutation shareDocumentVersion(
    $username: String!
    $documentID: String!
    $versionName: String
    $role: EditableRole!
  ) {
    shareDocumentVersion(
      request: {
        username: $username
        documentID: $documentID
        versionName: $versionName
        role: $role
      }
    ) {
      userDocumentPermission {
        username
        userID
        role
      }
    }
  }
`;

const REMOVE_COLLABORATOR_FROM_DOCUMENT_VERSION = gql`
  mutation unshareDocumentVersion(
    $username: String!
    $documentID: String!
    $versionName: String
  ) {
    unshareDocumentVersion(
      request: {
        username: $username
        documentID: $documentID
        versionName: $versionName
      }
    )
  }
`;

export function prettyPrintRole(role: Role | EditableRole) {
  const splitWords = role.split('_');
  return splitWords.map((w) => w.toLowerCase()).join(' ');
}

export default function ShareModal() {
  const [usernameToShareTo, setUsernameToShareTo] =
    useState<string>('');
  const [modalOpen, setModalOpen] =
    useState<boolean>(false);
  const [selectedRole, setSelectedRole] = useState<Role>(
    Role.Editor
  );
  const [
    shareOnAllDocumentVersions,
    setShareOnAllDocumentVersions
  ] = useState<boolean>(false);
  const [sharedUsers, setSharedUsers] = useState<{
    sharedOnDocumentVersion: UserMetadataDB[];
    sharedOnDocument: UserMetadataDB[];
  }>({ sharedOnDocumentVersion: [], sharedOnDocument: [] });
  const { theme } = useTheme();
  const currentDocumentVersionDualID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const { user } = useUserInfo();

  const [shareDocumentVersion] = useMutation(
    SHARE_DOCUMENT_VERSION
  );
  const [shareDocument] = useMutation(SHARE_DOCUMENT);
  const [removeUserFromDocument] = useMutation(
    REMOVE_COLLABORATOR_FROM_DOCUMENT_VERSION
  );
  const [
    loadSharedUsers,
    {
      called: loadSharedUsersCalled,
      loading: loadSharedUsersLoading,
      error: loadSharedUsersError,
      data: loadSharedUsersData
    }
  ] = useLazyQuery(LOAD_SHARED_USERS, {
    variables: {
      documentID: currentDocumentVersionDualID.documentID,
      versionName: currentDocumentVersionDualID.versionName
    },
    fetchPolicy: 'no-cache'
  });

  // TODO: investigate why you need a use effect here
  useEffect(() => {
    if (
      loadSharedUsersData?.getSharedWith
        ?.sharedOnDocumentVersion
    ) {
      setSharedUsers({
        sharedOnDocumentVersion:
          loadSharedUsersData?.getSharedWith?.sharedOnDocumentVersion.map(
            (um: gql_UserDocumentPermissionMetadata) =>
              UserMetadataDB.fromGraphQL(um)
          ),
        sharedOnDocument:
          loadSharedUsersData?.getSharedWith?.sharedOnDocument.map(
            (um: gql_UserDocumentPermissionMetadata) =>
              UserMetadataDB.fromGraphQL(um)
          )
      });
    }
  }, [loadSharedUsersData]);

  if (!user) {
    return <Loading />;
  }

  const cantShare =
    !currentDocumentVersionDualID.hasPermission(
      ActionPermission.ShareDocument
    ) &&
    !currentDocumentVersionDualID.hasPermission(
      ActionPermission.ShareDocumentVersion
    );

  return (
    <>
      <Button
        style={{
          minWidth: 0,
          fontSize: theme.fontSizes.sm.value
        }}
        onPress={() => {
          loadSharedUsers();
          setModalOpen(!modalOpen);
        }}
      >
        Share
      </Button>
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
              {cantShare
                ? 'Shared with'
                : 'Share document with'}
            </Text>
          </div>
        </Modal.Header>
        <Modal.Body
          style={{
            paddingTop: 0,
            paddingBottom: theme.space.md.value
          }}
        >
          {cantShare ? null : (
            <div>
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
                      setSelectedRole(key as Role);
                    }}
                  >
                    {Object.values(EditableRole).map(
                      (r) => (
                        <Dropdown.Item key={r}>
                          {prettyPrintRole(r)}
                        </Dropdown.Item>
                      )
                    )}
                  </Dropdown.Menu>
                </Dropdown>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                {currentDocumentVersionDualID.hasPermission(
                  ActionPermission.ShareDocument
                ) && (
                  <>
                    <Switch
                      checked={shareOnAllDocumentVersions}
                      onChange={() => {
                        setShareOnAllDocumentVersions(
                          !shareOnAllDocumentVersions
                        );
                      }}
                    />
                    <div style={{ marginLeft: 10 }}>
                      <Text>on all document versions</Text>
                    </div>
                  </>
                )}
              </div>
            </div>
          )}

          <div
            style={{
              borderTopStyle: 'solid',
              borderTopColor: theme.colors.gray500.value,
              paddingTop: 10,
              marginBottom: 0
            }}
          >
            {sharedUsers.sharedOnDocumentVersion?.length >
              0 && (
              <div style={{ marginBottom: 20 }}>
                <Text
                  size='$xs'
                  style={{ marginBottom: 0 }}
                >
                  Shared on this document version only:
                </Text>
                <Grid.Container
                  gap={0.5}
                  alignItems='center'
                >
                  <ShareTable
                    sharedUserMetadataList={
                      sharedUsers.sharedOnDocumentVersion
                    }
                    isOnDocument={false}
                    loadSharedUsers={loadSharedUsers}
                  />
                </Grid.Container>
              </div>
            )}
            <Text size='$xs' style={{ marginBottom: 0 }}>
              Shared on all document versions:
            </Text>
            <Grid.Container gap={0.5} alignItems='center'>
              <ShareTable
                sharedUserMetadataList={
                  sharedUsers.sharedOnDocument
                }
                isOnDocument={true}
                loadSharedUsers={loadSharedUsers}
              />
            </Grid.Container>
          </div>
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
              {cantShare ? 'Close' : 'Cancel'}
            </Button>
            {cantShare ? null : (
              <Button
                style={{ minWidth: 0 }}
                onClick={async () => {
                  if (usernameToShareTo) {
                    if (shareOnAllDocumentVersions) {
                      await shareDocument({
                        variables: {
                          documentID:
                            currentDocumentVersionDualID.documentID,
                          username: usernameToShareTo,
                          role: selectedRole
                        }
                      });
                    } else {
                      await shareDocumentVersion({
                        variables: {
                          documentID:
                            currentDocumentVersionDualID.documentID,
                          username: usernameToShareTo,
                          versionName:
                            currentDocumentVersionDualID.versionName,
                          // TODO: allow role selection on share
                          role: selectedRole
                        }
                      });
                    }
                    setUsernameToShareTo('');
                    // TODO: use user document permission return value instead of reloading the shared user list
                    await loadSharedUsers();
                  }
                }}
                disabled={!usernameToShareTo}
              >
                Share
              </Button>
            )}
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
