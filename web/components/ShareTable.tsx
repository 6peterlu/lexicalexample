import {
  gql,
  LazyQueryExecFunction,
  useLazyQuery,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import {
  Button,
  Dropdown,
  Grid,
  Text,
  useTheme
} from '@nextui-org/react';
import React from 'react';
import {
  currentDocumentVersionIDVar,
  userInfoVar
} from '../cache/cache';
import {
  ActionPermission,
  Role
} from '../generated/types/graphql';
import { UserMetadataDB } from '../models/user';
import HoverDiv from './HoverDiv';
import { prettyPrintRole } from './ShareModal';

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

const REMOVE_COLLABORATOR_FROM_DOCUMENT_VERSION = gql`
  mutation unshareDocumentVersion(
    $userID: String!
    $documentVersionID: String!
  ) {
    unshareDocumentVersion(
      request: {
        userID: $userID
        documentVersionID: $documentVersionID
      }
    )
  }
`;

export default function ShareTable({
  sharedUserMetadataList,
  isOnDocument,
  loadSharedUsers
}: {
  sharedUserMetadataList: UserMetadataDB[];
  isOnDocument: boolean;
  // copied this type from the function defintion
  loadSharedUsers: LazyQueryExecFunction<
    any,
    {
      documentID: string;
      versionName: string;
    }
  >;
}) {
  const { theme } = useTheme();
  let user = useReactiveVar(userInfoVar);
  const currentDocumentVersionDualID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const [removeUserFromDocument] = useMutation(
    REMOVE_COLLABORATOR_FROM_DOCUMENT_VERSION
  );
  return (
    <>
      {sharedUserMetadataList.map((s) => {
        return (
          <React.Fragment key={`sharedlist-${s.userID}`}>
            <Grid xs={9}>
              <div style={{ marginLeft: 10 }}>
                <Text size={theme.fontSizes.xs}>
                  {s.username}
                </Text>
              </div>
            </Grid>
            <Grid xs={3}>
              {s.role === Role.Owner ||
              (!currentDocumentVersionDualID.hasPermission(
                ActionPermission.ShareDocument
              ) &&
                !currentDocumentVersionDualID.hasPermission(
                  ActionPermission.ShareDocumentVersion
                )) ? (
                <div style={{ paddingLeft: 12 }}>
                  <Text size='$sm'>
                    {prettyPrintRole(s.role as Role)}
                  </Text>
                </div>
              ) : (
                <Dropdown>
                  <Dropdown.Button
                    size='xs'
                    style={{
                      backgroundColor: 'transparent',
                      color: 'black',
                      borderStyle: 'solid',
                      borderWidth: 0.5
                    }}
                  >
                    {prettyPrintRole(s.role as Role)}
                  </Dropdown.Button>
                  <Dropdown.Menu
                    onAction={async (key) => {
                      if (key === 'unshare-user') {
                        await removeUserFromDocument({
                          variables: {
                            userID: s.userID,
                            documentVersionID:
                              currentDocumentVersionDualID.documentVersionID
                          }
                        });
                        await loadSharedUsers();
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
    </>
  );
}
