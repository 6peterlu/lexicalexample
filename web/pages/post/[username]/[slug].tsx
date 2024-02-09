import { gql, useMutation, useQuery } from '@apollo/client';
import { useRouter } from 'next/router';
import { PublishedDocumentVersion } from '../../../generated/types/graphql';
import { useEffect, useMemo, useState } from 'react';
import { Loading, Text, useTheme } from '@nextui-org/react';
import {
  convertPxStringToNumber,
  getFullNameString
} from '../../../utils/string';
import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { lexicalComposerDefaultTheme } from '../../../utils/constants';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import {
  TableCellNode,
  TableNode,
  TableRowNode
} from '@lexical/table';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import ReadOnlyContentEditable from '../../../components/editor/ReadOnlyContentEditable';
import EditorErrorBoundary from '../../../components/EditorErrorBoundary';
import useMediaQuery from '../../../hooks/useMediaQuery';
import paperTexture from '../../../public/papertexture.png';
import Head from 'next/head';
import { faHeart as faHeartEmpty } from '@fortawesome/free-regular-svg-icons/faHeart';
import { faHeart as faHeartFull } from '@fortawesome/free-solid-svg-icons/faHeart';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useUserInfo } from '../../../hooks/useUserInfo';

const GET_PUBLISHED_DOCUMENT = gql`
  query getPublishedDocumentVersion(
    $username: String!
    $slug: String!
  ) {
    getPublishedDocumentVersion(
      args: { username: $username, slug: $slug }
    ) {
      publishedAt
      updatedAt
      documentID
      publishedDocumentID
      title
      subtitle
      url
      content
      userID
      user {
        username
        firstName
        lastName
      }
      likingUsers
    }
  }
`;

const TOGGLE_LIKE = gql`
  mutation toggleLikePublishedDocumentVersion(
    $publishedDocumentID: String!
  ) {
    toggleLikePublishedDocumentVersion(
      request: { publishedDocumentID: $publishedDocumentID }
    )
  }
`;

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
  throw error;
}

const customNodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  AutoLinkNode,
  LinkNode
];

export default function Post() {
  const router = useRouter();
  const { username, slug } = router.query;
  const { user } = useUserInfo();
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const [heartOffsets, setHeartOffsets] = useState([]);
  const { data: publishedDocument } = useQuery(
    GET_PUBLISHED_DOCUMENT,
    {
      variables: {
        username,
        slug
      }
    }
  );
  const [toggleLike] = useMutation(TOGGLE_LIKE, {
    variables: {
      publishedDocumentID: ''
    }
  });

  const [publishedDocumentData, setPublishedDocumentData] =
    useState<
      Pick<
        PublishedDocumentVersion,
        | 'content'
        | 'title'
        | 'subtitle'
        | 'documentID'
        | 'publishedAt'
        | 'updatedAt'
        | 'user'
        | 'likingUsers'
        | 'publishedDocumentID'
      >
    >(null);

  useEffect(() => {
    if (publishedDocument) {
      setPublishedDocumentData(
        publishedDocument.getPublishedDocumentVersion
      );
      setHeartOffsets(
        [
          ...Array(
            publishedDocument.getPublishedDocumentVersion
              .likingUsers.length
          )
        ].map((v) => 2 - Math.random() * 4)
      );
    }
  }, [publishedDocument]);
  if (!publishedDocumentData) {
    return <Loading />;
  }
  const initialConfig: any = {
    theme: {
      ...lexicalComposerDefaultTheme,
      paragraph: 'published-editor-paragraph'
    },
    onError,
    nodes: customNodes,
    editorState: publishedDocumentData.content
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center'
      }}
    >
      <Head>
        <title>{publishedDocumentData.title}</title>
      </Head>
      <div
        style={{
          backgroundColor: 'black',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          height: '50vh',
          width: '100%',
          position: 'relative',
          userSelect: 'none'
        }}
      >
        <Text
          color='white'
          style={{
            ...{
              fontFamily: 'Alata',
              textAlign: 'center',
              marginBottom: theme.space.sm.value,
              lineHeight: theme.lineHeights.sm.value,
              paddingRight: theme.space.lg.value,
              paddingLeft: theme.space.lg.value,
              letterSpacing:
                theme.letterSpacings.normal.value
            },
            ...(isDesktop && {
              maxWidth: '50vw'
            })
          }}
          size='$3xl'
        >
          {publishedDocumentData?.title.toUpperCase()}
        </Text>
        {publishedDocumentData.subtitle && (
          <Text
            color='white'
            style={{
              ...{
                fontFamily: 'Grape Nuts',
                marginBottom: theme.space.lg.value,
                paddingRight: theme.space.lg.value,
                paddingLeft: theme.space.lg.value,
                lineHeight: theme.lineHeights.sm.value,
                letterSpacing:
                  theme.letterSpacings.normal.value,
                textAlign: 'center'
              },
              ...(isDesktop && {
                maxWidth: '50vw'
              })
            }}
            size='$2xl'
          >
            {publishedDocumentData.subtitle}
          </Text>
        )}
        <Text
          color='white'
          style={{
            letterSpacing: theme.letterSpacings.normal.value
          }}
        >
          By{' '}
          <a
            href={`/writer/${publishedDocumentData.user.username}`}
            style={{
              color: theme.colors.white.value,
              textDecoration: 'underline'
            }}
          >
            {getFullNameString(
              publishedDocumentData.user.firstName,
              publishedDocumentData.user.lastName
            )}
          </a>
        </Text>
        <Text
          color='white'
          size='small'
          style={{
            letterSpacing: theme.letterSpacings.normal.value
          }}
        >
          {publishedDocumentData.publishedAt}
        </Text>
        <div
          style={{
            marginTop: theme.space.lg.value,
            display: 'flex',
            alignItems: 'flex-end',
            cursor: 'pointer',
            position: 'absolute',
            bottom: theme.space.lg.value,
            right: theme.space.lg.value,
            justifyContent: 'flex-start'
          }}
          onClick={async () => {
            if (user) {
              await toggleLike({
                variables: {
                  publishedDocumentID:
                    publishedDocumentData.publishedDocumentID
                }
              });
              if (
                publishedDocumentData.likingUsers.includes(
                  user.userID
                )
              ) {
                setHeartOffsets(heartOffsets.slice(0, -1));
                setPublishedDocumentData({
                  ...publishedDocumentData,
                  likingUsers:
                    publishedDocumentData.likingUsers.slice(
                      0,
                      -1
                    )
                });
              } else {
                setHeartOffsets([
                  ...heartOffsets,
                  2 - 4 * Math.random()
                ]);
                setPublishedDocumentData({
                  ...publishedDocumentData,
                  likingUsers: [
                    ...publishedDocumentData.likingUsers,
                    user.userID
                  ]
                });
              }
            } else {
              router.push('/login?signup=true');
            }
          }}
        >
          <motion.div
            layout='position'
            style={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <motion.div
              animate={{
                skew: heartOffsets.length > 1 ? -20 : 0,
                rotate: heartOffsets.length > 1 ? 20 : 0
              }}
              style={{ zIndex: 20, position: 'relative' }}
            >
              <FontAwesomeIcon
                icon={
                  heartOffsets.length > 0
                    ? faHeartFull
                    : faHeartEmpty
                }
                color={theme.colors.red700.value}
                style={{
                  ...(heartOffsets.length > 1 && {
                    filter:
                      'drop-shadow(1px 1px 0px rgba(0,0,0,1))',
                    position: 'relative'
                  })
                }}
                size='lg'
              />
            </motion.div>
            {heartOffsets.length > 1 && (
              <motion.div
                style={{
                  marginTop: 0,
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                {heartOffsets
                  .slice(1)
                  .map((offset, idx) => (
                    <motion.div
                      style={{ marginTop: -18 }}
                      initial={{ x: -30 }}
                      animate={{ x: 0 }}
                      transition={{
                        ease: 'easeOut',
                        duration: 0.3
                      }}
                      key={`heart-${offset}-${idx}`}
                    >
                      <FontAwesomeIcon
                        icon={
                          heartOffsets.length > 0
                            ? faHeartFull
                            : faHeartEmpty
                        }
                        style={{
                          transform: `skew(160deg) translateX(${offset}px)`,
                          rotate: '20deg',

                          filter:
                            'drop-shadow(1px 1px 0px rgba(0,0,0,1))',
                          position: 'relative',
                          zIndex: 19 - idx
                        }}
                        color={theme.colors.red700.value}
                        size='lg'
                      />
                    </motion.div>
                  ))}
              </motion.div>
            )}
          </motion.div>
          <Text
            color='white'
            style={{ marginLeft: theme.space.sm.value }}
          >
            {heartOffsets.length}
          </Text>
        </div>
      </div>
      <div
        style={{
          backgroundImage: `url('${paperTexture.src}')`,
          backgroundRepeat: 'repeat',
          width: '100%',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingBottom: theme.space['2xl'].value,
          backgroundSize: '500px'
        }}
      >
        <div
          style={{
            maxWidth: 700,
            paddingRight: theme.space.lg.value,
            paddingLeft: theme.space.lg.value,
            marginTop: theme.space['2xl'].value
          }}
        >
          <LexicalComposer initialConfig={initialConfig}>
            <RichTextPlugin
              placeholder={null}
              contentEditable={
                <ReadOnlyContentEditable
                  style={{
                    outline: 0,
                    flex: 1,
                    zIndex: 1,
                    backgroundColor: 'transparent'
                  }}
                  id='editor-content-editable-published'
                  contenteditable={false}
                  wsConnected={true}
                />
              }
              ErrorBoundary={EditorErrorBoundary}
            />
          </LexicalComposer>
        </div>
      </div>
      <div
        style={{
          paddingTop: theme.space['2xl'].value,
          paddingBottom: theme.space['2xl'].value,
          borderTopStyle: 'solid',
          borderTopColor: theme.colors.gray500.value,
          borderTopWidth: 1,
          backgroundColor: theme.colors.blue600.value,
          display: 'flex',
          width: '100%',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            maxWidth: '100%',
            width: 700,
            paddingRight: theme.space.lg.value,
            paddingLeft: theme.space.lg.value,
            display: 'flex'
          }}
        >
          <Text
            style={{
              letterSpacing:
                theme.letterSpacings.normal.value
            }}
            color='white'
            size='large'
          >
            Come write with{' '}
            <a
              style={{
                color: 'white',
                textDecoration: 'underline'
              }}
              href={`/writer/${publishedDocumentData.user.username}`}
            >
              {getFullNameString(
                publishedDocumentData.user.firstName,
                publishedDocumentData.user.lastName
              )}
            </a>{' '}
            on{' '}
            <span
              style={{ marginRight: theme.space[2].value }}
            >
              <a
                style={{
                  color: 'white',
                  fontFamily: 'Cedarville Cursive',
                  fontSize: theme.fontSizes['2xl'].value,
                  paddingLeft: theme.space.xs.value
                }}
                href='https://draftzero.com'
              >
                draft zero
              </a>
              ,
            </span>{' '}
            an online writing sanctuary.
          </Text>
        </div>
      </div>
    </div>
  );
}
