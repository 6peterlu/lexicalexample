import { gql, useQuery } from '@apollo/client';
import { Loading, Text, useTheme } from '@nextui-org/react';
import { PublishedDocumentVersionMetadata } from '../generated/types/graphql';
import dayjs from 'dayjs';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';
import { useRouter } from 'next/router';

const GET_PUBLISHED_DOCUMENTS_FOR_USERNAME = gql`
  query getAllPublishedDocumentVersionsForUser(
    $username: String!
  ) {
    getAllPublishedDocumentVersionsForUser(
      args: { username: $username }
    ) {
      title
      publishedAt
      url
    }
  }
`;

export default function PublishedDocumentList({
  username
}: {
  username: string;
}) {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: publishedDocumentData } = useQuery(
    GET_PUBLISHED_DOCUMENTS_FOR_USERNAME,
    {
      variables: { username },
      fetchPolicy: 'no-cache'
    }
  );
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  if (
    publishedDocumentData
      ?.getAllPublishedDocumentVersionsForUser.length === 0
  ) {
    return null;
  }
  return (
    <div style={{ marginBottom: theme.space.xl.value }}>
      <Text
        size='$xl'
        color={theme.colors.blue600.value}
        weight='bold'
        style={{
          letterSpacing: theme.letterSpacings.normal.value
        }}
      >
        Collection
      </Text>
      {publishedDocumentData?.getAllPublishedDocumentVersionsForUser.map(
        (
          publishedDocument: PublishedDocumentVersionMetadata
        ) => (
          <div
            key={publishedDocument.url}
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'flex-end',
              cursor: 'pointer'
            }}
            onClick={() => {
              router.push(
                `/post/${username}/${publishedDocument.url}`
              );
            }}
          >
            <div
              style={{
                display: 'flex',
                flex: 1,
                flexDirection: 'row'
              }}
            >
              <Text
                style={{
                  lineHeight: theme.lineHeights.sm.value
                }}
                size={isDesktop ? 'medium' : 'small'}
              >
                {publishedDocument.title}
              </Text>
              <div
                style={{
                  flex: 1,
                  borderBottomColor: 'black',
                  borderBottomStyle: 'dotted',
                  borderBottomWidth: 2,
                  marginBottom:
                    ((parseFloat(
                      theme.lineHeights.sm.value
                    ) -
                      parseFloat(
                        theme.fontSizes.md.value
                      )) *
                      // * 16 to convert from rem to px
                      8) /
                    // / 2 because space is present on the top and bottom of the line
                    2,
                  marginLeft: 8,
                  marginRight: 8
                }}
              />
            </div>
            <Text size={isDesktop ? 'medium' : 'small'}>
              {dayjs(publishedDocument.publishedAt).format(
                'M/D/YYYY'
              )}
            </Text>
          </div>
        )
      )}
      {!publishedDocumentData && <Loading />}
    </div>
  );
}
