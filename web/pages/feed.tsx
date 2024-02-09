import { Loading, useTheme } from '@nextui-org/react';
import CommunityHeader from '../components/CommunityHeader';
import { gql, useQuery } from '@apollo/client';
import {
  FeedItem,
  FeedItemType,
  WritingSession as gql_WritingSession
} from '../generated/types/graphql';
import WritingSessionCard from '../components/WritingSessionCard';
import { useUserInfo } from '../hooks/useUserInfo';

const GET_FEED_DATA = gql`
  query getFeedItems {
    getFeedItems {
      feedItemType
      date
      serializedData
    }
  }
`;

function FeedItem({
  feedItemType,
  date,
  body
}: {
  feedItemType: FeedItemType;
  date: string;
  body: any;
}) {
  const { user } = useUserInfo();
  if (!user) {
    return <Loading />;
  }
  if (feedItemType === FeedItemType.WritingSession) {
    const writingSessionData = body as gql_WritingSession;
    return (
      <div style={{ paddingBottom: 30 }}>
        <WritingSessionCard
          writingSession={body}
          isSelf={writingSessionData.userID === user.userID}
        />
      </div>
    );
  }
  return null;
}

export default function Feed() {
  const { theme } = useTheme();
  const { data: feedData } = useQuery(GET_FEED_DATA);
  if (!feedData) {
    return <Loading />;
  }
  return (
    <div
      style={{
        backgroundColor: theme.colors.gray50.value,
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <CommunityHeader />

      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div style={{ width: 700 }}>
          {feedData.getFeedItems.map(
            (feedItem: FeedItem) => (
              <div
                key={feedItem.date}
                style={{
                  backgroundColor: 'white',
                  padding: theme.space.lg.value,
                  marginTop: theme.space.xl.value,
                  marginBottom: theme.space.xl.value,
                  borderRadius: theme.radii.md.value
                }}
              >
                <FeedItem
                  feedItemType={feedItem.feedItemType}
                  date={feedItem.date}
                  body={JSON.parse(feedItem.serializedData)}
                />
              </div>
            )
          )}
        </div>
      </div>
    </div>
  );
}
