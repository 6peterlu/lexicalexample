import { gql, useQuery } from '@apollo/client';
import { useEffect, useState } from 'react';
import { WritingSession } from '../generated/types/graphql';
import WritingSessionCard from './WritingSessionCard';
import { Text, useTheme } from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useUserInfo } from '../hooks/useUserInfo';

const GET_WRITING_SESSIONS_FOR_USER = gql`
  query getWritingSessionsForUser($username: String!) {
    getWritingSessionsForUser(
      args: { username: $username }
    ) {
      writingSessionID
      wordsChanged
      timeSpentSeconds
      startDateTime
      title
      segmentTime
      flow
    }
  }
`;

export default function WritingSessionList() {
  const router = useRouter();
  const { username } = router.query;
  const { user } = useUserInfo();
  const { data: writingSessionsResponse } = useQuery(
    GET_WRITING_SESSIONS_FOR_USER,
    { variables: { username }, fetchPolicy: 'no-cache' }
  );
  const [writingSessions, setWritingSessions] = useState<
    WritingSession[]
  >([]);
  const { theme } = useTheme();
  useEffect(() => {
    if (writingSessionsResponse) {
      setWritingSessions(
        writingSessionsResponse.getWritingSessionsForUser
      );
    }
  }, [writingSessionsResponse]);
  return (
    <>
      {writingSessions.length > 0 && (
        <div style={{ marginTop: theme.space.xl.value }}>
          <Text
            size='$xl'
            color={theme.colors.blue600.value}
            weight='bold'
            style={{
              letterSpacing:
                theme.letterSpacings.normal.value
            }}
          >
            Writing activity
          </Text>
        </div>
      )}
      {writingSessions.map((writingSession) => (
        <div
          style={{ marginBottom: theme.space.xl.value }}
          key={`writingSessionCard-${writingSession.writingSessionID}`}
        >
          <WritingSessionCard
            writingSession={writingSession}
            isSelf={user?.username === username}
          />
        </div>
      ))}
    </>
  );
}
