import { gql } from '@apollo/client';
import { Loading, Navbar, Text } from '@nextui-org/react';
import DocumentList from '../components/DocumentList';
import { useSharedDocuments } from '../hooks/useDocuments';
import { useUserInfo } from '../hooks/useUserInfo';
import { useSession } from 'next-auth/react';

const LOAD_DOCUMENTS = gql`
  query getSharedDocuments {
    getSharedDocuments {
      documents {
        title
        documentID
        updatedAt
        userDocumentPermissions {
          role
          userID
          username
        }
      }
    }
  }
`;

const Shared = () => {
  const { status } = useSession({ required: true });
  const { user: userInfo } = useUserInfo();
  const sharedDocuments = useSharedDocuments();
  if (!userInfo || status === 'loading') {
    return <Loading />;
  }
  return (
    <>
      <Navbar>
        <Navbar.Content hideIn='xs'>
          <Navbar.Link href='/'>My Documents</Navbar.Link>
          <Navbar.Link isActive href='/shared'>
            Shared with me
          </Navbar.Link>
        </Navbar.Content>
      </Navbar>
      <Text>Welcome {userInfo.username}!</Text>
      <Text>shared page</Text>
      {sharedDocuments ? (
        <DocumentList documents={sharedDocuments} />
      ) : (
        <Loading />
      )}
    </>
  );
};
export default Shared;
