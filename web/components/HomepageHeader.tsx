import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import { faTrashCan } from '@fortawesome/free-regular-svg-icons/faTrashCan';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  Loading,
  Text,
  useTheme
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import {
  currentDocumentVar,
  documentsVar,
  selectedDocumentIDVar,
  sharedDocumentsVar
} from '../cache/cache';
import { useUserInfo } from '../hooks/useUserInfo';
import Logo from '../public/Logo.svg';
import DailyChallengeButton from './DailyChallengeButton';
import ProfileMenu from './ProfileMenu';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';
import ResponsiveLogo from './ResponsiveLogo';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';

const CREATE_DOCUMENT = gql`
  mutation createDocument {
    createDocument {
      documentID
    }
  }
`;
const DELETE_DOCUMENT_FOR_USER = gql`
  mutation deleteDocumentForUser($documentID: String!) {
    deleteDocumentForUser(
      request: { documentID: $documentID }
    )
  }
`;

export default function HomepageHeader() {
  const selectedDocumentID = useReactiveVar(
    selectedDocumentIDVar
  );
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const documents = useReactiveVar(documentsVar);
  const sharedDocuments = useReactiveVar(
    sharedDocumentsVar
  );
  const [
    createDocument,
    {
      loading: createDocumentMutationLoading,
      error: createDocumentMutationError,
      data: createDocumentMutationData
    }
  ] = useMutation(CREATE_DOCUMENT, {
    fetchPolicy: 'no-cache'
  });
  const [deleteDocumentForUser] = useMutation(
    DELETE_DOCUMENT_FOR_USER
  );
  const router = useRouter();

  const { user } = useUserInfo();
  if (!user || !user.firstName) {
    return <Loading />;
  }
  return (
    <div
      style={{
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'row',
        paddingTop: theme.space.sm.value,
        paddingBottom: theme.space.sm.value,
        paddingLeft: isDesktop
          ? theme.space['2xl'].value
          : theme.space.md.value,
        paddingRight: isDesktop
          ? theme.space['2xl'].value
          : theme.space.md.value,
        backgroundColor: theme.colors.gray200.value,
        borderBottomStyle: 'solid',
        borderBottomColor: theme.colors.gray600.value,
        borderBottomWidth: 0.5
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <ResponsiveLogo />
        {isDesktop && (
          <Text
            style={{
              fontSize: theme.fontSizes['2xl'].value,
              fontFamily: 'Cedarville Cursive',
              marginLeft: theme.space.md.value,
              marginTop: -2
            }}
          >
            draft zero
          </Text>
        )}
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          {selectedDocumentID && (
            <div>
              <Button
                icon={<FontAwesomeIcon icon={faTrashCan} />}
                style={{
                  minWidth: 0,
                  backgroundColor:
                    theme.colors.pink500.value
                }}
                size={isDesktop ? 'md' : 'sm'}
                onFocusCapture={async (e) => {
                  try {
                    await deleteDocumentForUser({
                      variables: {
                        documentID: selectedDocumentID
                      }
                    });
                    documentsVar(
                      documents.filter(
                        (d) =>
                          d.documentID !==
                          selectedDocumentID
                      )
                    );
                    sharedDocumentsVar(
                      sharedDocuments.filter(
                        (d) =>
                          d.documentID !==
                          selectedDocumentID
                      )
                    );
                  } catch (e) {
                    console.error(
                      'deleteDocumentForUser failed',
                      e
                    );
                  }
                }}
              />
            </div>
          )}
          <div
            style={{
              marginLeft: theme.space.md.value,
              marginRight: theme.space.md.value
            }}
          >
            <Button
              onPress={async () => {
                const resp = await createDocument();
                // TODO: handle fetch error cases
                // set it to null otherwise title input will render with the last loaded title
                currentDocumentVar(null);
                router.push(
                  `document/${resp.data.createDocument.documentID}/draft%20zero`
                );
              }}
              size={isDesktop ? 'md' : 'sm'}
              style={{ minWidth: 0 }}
              iconLeftCss={{
                position: 'relative',
                left: 0,
                top: 0,
                transform: 'none'
              }}
              icon={
                !isDesktop && (
                  <FontAwesomeIcon icon={faPlus} />
                )
              }
            >
              {isDesktop && 'Create document'}
            </Button>
          </div>
          <DailyChallengeButton />
        </div>
        <ProfileMenu />
      </div>
    </div>
  );
}
