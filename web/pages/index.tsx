import { gql, useMutation, useQuery } from '@apollo/client';
import { Button, Text, useTheme } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { EnhancedDocumentMetadata } from '../generated/types/graphql';
import { useRouter } from 'next/router';
import { motion } from 'framer-motion';
import dayjs from 'dayjs';
import ResponsiveButton from '../components/ResponsiveButton';
import { convertPxStringToNumber } from '../utils/string';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faClose } from '@fortawesome/free-solid-svg-icons/faClose';
import { signOut, useSession } from 'next-auth/react';
// import LandingPage from '../components/LandingPage';
import dynamic from 'next/dynamic';
import useMediaQuery from '../hooks/useMediaQuery';

const LandingPage = dynamic(
  () => import('../components/LandingPage'),
  { ssr: false }
);

const GET_ENHANCED_DOCUMENT_METADATA = gql`
  query getEnhancedDocumentMetadata {
    getEnhancedDocumentMetadata {
      enhancedDocumentID
      title
      updatedAt
    }
  }
`;

const CREATE_ENHANCED_DOCUMENT = gql`
  mutation createEnhancedDocument {
    createEnhancedDocument {
      enhancedDocumentID
      title
    }
  }
`;

const DELETE_DOCUMENT = gql`
  mutation deleteEnhancedDocument(
    $enhancedDocumentID: String!
  ) {
    deleteEnhancedDocument(
      request: { enhancedDocumentID: $enhancedDocumentID }
    )
  }
`;

export default function EnhancedDocumentHome() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const { data: session, status } = useSession();
  const [
    enhancedDocumentMetadata,
    setEnhancedDocumentMetadata
  ] = useState<EnhancedDocumentMetadata[]>([]);
  const { data: enhancedDocumentMetadataResponse } =
    useQuery(GET_ENHANCED_DOCUMENT_METADATA, {
      fetchPolicy: 'no-cache'
    });
  const [createEnhancedDocumentMutation] = useMutation(
    CREATE_ENHANCED_DOCUMENT
  );
  const [deleteDocument] = useMutation(DELETE_DOCUMENT, {
    variables: {
      enhancedDocumentID: ''
    }
  });
  useEffect(() => {
    if (enhancedDocumentMetadataResponse) {
      setEnhancedDocumentMetadata(
        enhancedDocumentMetadataResponse.getEnhancedDocumentMetadata
      );
    }
  }, [enhancedDocumentMetadataResponse]);
  async function createEnhancedDocument() {
    const response = await createEnhancedDocumentMutation();
    // if (response.data.createEnhancedDocument) {
    //   setEnhancedDocumentMetadata([
    //     ...enhancedDocumentMetadata,
    //     response.data.createEnhancedDocument
    //   ]);
    // }
    router.push(
      `/document/${response.data.createEnhancedDocument.enhancedDocumentID}`
    );
  }
  if (!session) {
    // not signed in
    return <LandingPage />;
  }
  return (
    <div
      style={{
        width: '100%',
        display: 'flex',
        flexDirection: 'column',
        padding: 50
      }}
    >
      <div
        style={{
          flex: 1,
          display: 'flex',
          justifyContent: 'space-between',
          marginBottom: theme.space.md.value
        }}
      >
        <Text
          size='x-large'
          weight='bold'
          style={{ letterSpacing: 'normal' }}
        >
          your stuff
        </Text>
        <div style={{ display: 'flex' }}>
          <div
            style={{ marginRight: theme.space.md.value }}
          >
            <ResponsiveButton
              onClick={createEnhancedDocument}
            >
              New
            </ResponsiveButton>
          </div>
          <ResponsiveButton
            onClick={() => signOut({ callbackUrl: '/' })}
          >
            Log out
          </ResponsiveButton>
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'flex-end'
        }}
      >
        <div
          style={{
            display: 'flex',
            flex: 1,
            alignItems: 'flex-end',
            height: '100%'
          }}
        >
          <div
            style={{
              flex: 3,
              display: 'flex',
              alignItems: 'flex-end',
              height: '100%'
            }}
          >
            <Text
              color={theme.colors.yellow800.value}
              style={{
                fontFamily: 'Alata',
                letterSpacing: 'normal'
              }}
            >
              title
            </Text>
            <motion.div
              layout
              style={{
                height: '50%',
                borderColor: theme.colors.blue600.value,
                borderTopWidth: 1,
                borderTopStyle: 'solid',
                marginLeft: theme.space.md.value,
                marginRight: theme.space.md.value,
                flex: 1
              }}
            />
          </div>
          {isDesktop && (
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'flex-end',
                height: '100%'
              }}
            >
              <Text
                color={theme.colors.yellow800.value}
                style={{
                  fontFamily: 'Alata',
                  letterSpacing: 'normal',
                  marginRight: isDesktop
                    ? theme.space.md.value
                    : 0
                }}
              >
                updated at
              </Text>
              <motion.div
                layout
                style={{
                  height: '50%',
                  borderColor: theme.colors.blue600.value,
                  borderTopWidth: isDesktop ? 1 : 0,
                  borderTopStyle: 'solid',
                  marginRight: isDesktop
                    ? theme.space.md.value
                    : 0,
                  flex: 1
                }}
              />
            </div>
          )}
        </div>
        <div
          style={{
            display: 'flex',
            width: 50,
            height: '100%',
            alignItems: 'center'
          }}
        >
          <Text
            color={theme.colors.yellow800.value}
            style={{
              fontFamily: 'Alata',
              letterSpacing: 'normal'
            }}
          >
            actions
          </Text>
        </div>
      </div>
      {enhancedDocumentMetadata.map((d) => {
        return (
          <div
            key={d.enhancedDocumentID}
            style={{ display: 'flex' }}
          >
            <motion.div
              whileHover={{
                backgroundColor: theme.colors.gray100.value,
                color: theme.colors.black.value,
                cursor: 'pointer'
              }}
              transition={{ type: 'tween' }}
              onClick={() => {
                router.push(
                  `/document/${d.enhancedDocumentID}`
                );
              }}
              style={{
                flex: 1,
                display: 'flex',
                padding: theme.space.sm.value,
                borderStyle: 'solid',
                borderTopWidth: 0.1,
                borderLeftWidth: 0.1,
                borderBottomWidth: 0,
                borderRightWidth: 0,
                borderColor: theme.colors.white.value,
                marginLeft: -12,
                marginRight: -12,
                color: theme.colors.gray700.value,
                backgroundColor: theme.colors.white.value,
                cursor: 'pointer'
              }}
            >
              <div style={{ flex: 3 }}>
                <p style={{ letterSpacing: 'normal' }}>
                  {d.title}
                </p>
              </div>
              {isDesktop && (
                <div
                  style={{
                    flex: 1,
                    display: 'flex'
                  }}
                >
                  <p
                    style={{
                      fontSize: theme.fontSizes.xs.value,
                      letterSpacing: 'normal'
                    }}
                  >
                    {dayjs(d.updatedAt).format(
                      'M/D/YYYY, h:mm A'
                    )}
                  </p>
                </div>
              )}
            </motion.div>
            <motion.div
              style={{
                width: 50,
                height: 50,
                color: theme.colors.gray500.value,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end'
              }}
              whileHover={{
                backgroundColor: theme.colors.red600.value,
                color: theme.colors.white.value,
                borderColor: theme.colors.red600.value,
                cursor: 'pointer'
              }}
              onClick={async () => {
                await deleteDocument({
                  variables: {
                    enhancedDocumentID: d.enhancedDocumentID
                  }
                });
                setEnhancedDocumentMetadata(
                  enhancedDocumentMetadata.filter(
                    (e) =>
                      e.enhancedDocumentID !==
                      d.enhancedDocumentID
                  )
                );
              }}
            >
              <FontAwesomeIcon icon={faClose} />
              <Text
                color={theme.colors.white.value}
                size='xx-small'
                style={{ letterSpacing: 'normal' }}
              >
                delete
              </Text>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
