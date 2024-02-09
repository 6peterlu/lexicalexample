import {
  Button,
  Input,
  Modal,
  Switch,
  Text,
  useTheme
} from '@nextui-org/react';
import ResponsiveButton from './ResponsiveButton';
import { useEffect, useMemo, useState } from 'react';
import { useUserInfo } from '../hooks/useUserInfo';
import { validateSlug } from '../utils/string';
import {
  gql,
  useMutation,
  useQuery,
  useReactiveVar
} from '@apollo/client';
import {
  currentDocumentVersionContentVar,
  currentDocumentVersionIDVar
} from '../cache/cache';
import { PublishedDocumentVersion } from '../generated/types/graphql';

// after publish, navigate to published page

// Publish document
const PUBLISH_DOCUMENT = gql`
  mutation publishDocumentVersion(
    $documentVersionID: String!
    $title: String!
    $subtitle: String
    $url: String!
    $content: String
  ) {
    publishDocumentVersion(
      request: {
        documentVersionID: $documentVersionID
        title: $title
        subtitle: $subtitle
        url: $url
        content: $content
      }
    )
  }
`;

const UNPUBLISH_DOCUMENT = gql`
  mutation unpublishDocumentVersion($documentID: String!) {
    unpublishDocumentVersion(
      request: { documentID: $documentID }
    )
  }
`;

const GET_PUBLISHED_DOCUMENT = gql`
  query getPublishedDocumentVersion(
    $documentID: String!
    $userID: String!
  ) {
    getPublishedDocumentVersion(
      args: { documentID: $documentID, userID: $userID }
    ) {
      documentID
      title
      subtitle
      url
    }
  }
`;

export default function PublishModal() {
  const { theme } = useTheme();
  const { user } = useUserInfo();
  const [modalOpen, setModalOpen] = useState(false);
  const documentVersionDualID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const currentDocumentContent = useReactiveVar(
    currentDocumentVersionContentVar
  );

  const [publishedDocumentData, setPublishedDocumentData] =
    useState<
      Pick<
        PublishedDocumentVersion,
        | 'content'
        | 'url'
        | 'userID'
        | 'documentID'
        | 'title'
      >
    >(null);
  const { data: publishedDocument } = useQuery(
    GET_PUBLISHED_DOCUMENT,
    {
      variables: {
        documentID: documentVersionDualID.documentID,
        userID: user?.userID
      },
      fetchPolicy: 'no-cache'
    }
  );
  const [unpublishDocument] = useMutation(
    UNPUBLISH_DOCUMENT,
    {
      variables: {
        documentID: documentVersionDualID.documentID
      }
    }
  );
  useEffect(() => {
    if (publishedDocument) {
      setPublishedDocumentData(
        publishedDocument.getPublishedDocumentVersion
      );
      setTitleValue(
        publishedDocument.getPublishedDocumentVersion.title
      );
      setUrlValue(
        publishedDocument.getPublishedDocumentVersion.url
      );
      setSubtitleValue(
        publishedDocument.getPublishedDocumentVersion
          .subtitle
      );
    }
  }, [publishedDocument]);
  const [publishDocument] = useMutation(PUBLISH_DOCUMENT, {
    variables: {
      documentVersionID: '',
      title: '',
      url: '',
      content: '',
      subtitle: ''
    }
  });
  const [titleValue, setTitleValue] = useState<string>('');
  const [urlValue, setUrlValue] = useState<string>('');
  const [subtitleValue, setSubtitleValue] =
    useState<string>('');
  const [republishContent, setRepublishContent] =
    useState<boolean>(false);
  const slugError = useMemo(() => {
    if (!urlValue) return false;
    return !validateSlug(urlValue);
  }, [urlValue]);
  const buttonDisabled = useMemo(() => {
    return !titleValue || !urlValue || slugError;
  }, [titleValue, urlValue, slugError]);
  return (
    <>
      <ResponsiveButton
        style={{
          marginLeft: theme.space.md.value,
          marginRight: theme.space.md.value
        }}
        onClick={() => setModalOpen(true)}
      >
        {publishedDocumentData ? 'Re/unpublish' : 'Publish'}
      </ResponsiveButton>
      <Modal
        open={modalOpen}
        onClose={() => {
          setModalOpen(false);
        }}
      >
        <Modal.Header
          style={{
            backgroundColor: theme.colors.blue600.value,
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'flex-start'
          }}
        >
          <Text
            color='white'
            style={{
              letterSpacing:
                theme.letterSpacings.normal.value
            }}
          >
            {publishedDocumentData
              ? 'Republish'
              : 'Publish'}
          </Text>
        </Modal.Header>
        <Modal.Body>
          {publishedDocumentData ? (
            <div style={{ display: 'flex' }}>
              <Text size='small'>
                Your document is published at{' '}
                <a
                  href={`/post/${user?.username}/${publishedDocumentData.url}`}
                >
                  draftzero.com/post/{user?.username}/
                  {publishedDocumentData.url}
                </a>
                .
              </Text>
            </div>
          ) : (
            <Text
              size='small'
              style={{
                letterSpacing:
                  theme.letterSpacings.normal.value
              }}
            >
              Once you publish your document, it will be
              accessible at the URL you specify to everyone
              on the internet.
            </Text>
          )}

          <Input
            underlined
            placeholder='title of post'
            value={titleValue}
            onChange={(e) => {
              setTitleValue(e.target.value);
            }}
          />
          <Input
            underlined
            placeholder='subtitle of post'
            value={subtitleValue}
            onChange={(e) => {
              setSubtitleValue(e.target.value);
            }}
          />
          <Input
            underlined
            placeholder='url'
            labelLeft={`draftzero.com/posts/${user?.username}`}
            color={slugError ? 'error' : 'primary'}
            value={urlValue}
            onChange={(e) => {
              setUrlValue(e.target.value);
            }}
          />
          {publishedDocumentData && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <Switch
                checked={republishContent}
                onChange={(e) => {
                  setRepublishContent(e.target.checked);
                }}
              />
              <Text
                style={{ marginLeft: theme.space.sm.value }}
                size='small'
              >
                Republish content
              </Text>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end'
            }}
          >
            {publishedDocumentData && (
              <ResponsiveButton
                color='error'
                style={{
                  marginRight: theme.space.md.value
                }}
                onClick={async () => {
                  await unpublishDocument();
                  setModalOpen(false);
                  setPublishedDocumentData(null);
                }}
              >
                Unpublish
              </ResponsiveButton>
            )}
            <ResponsiveButton
              disabled={buttonDisabled}
              onClick={async () => {
                await publishDocument({
                  variables: {
                    documentVersionID:
                      documentVersionDualID.documentVersionID,
                    title: titleValue,
                    url: urlValue,
                    content:
                      republishContent ||
                      !publishedDocumentData // always publish on the first publish
                        ? JSON.stringify(
                            currentDocumentContent
                          )
                        : undefined,
                    subtitle: subtitleValue
                  }
                });
                setPublishedDocumentData({
                  documentID:
                    documentVersionDualID.documentID,
                  title: titleValue,
                  url: urlValue,
                  userID: user?.userID
                });
                setModalOpen(false);
              }}
            >
              {publishedDocumentData
                ? 'Republish'
                : 'Publish'}
            </ResponsiveButton>
          </div>
        </Modal.Body>
      </Modal>
    </>
  );
}
