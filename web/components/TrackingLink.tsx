import { Loading, Text, useTheme } from '@nextui-org/react';
import { useRouter } from 'next/router';
import {
  gql,
  useLazyQuery,
  useQuery
} from '@apollo/client';
import { useMemo } from 'react';
import { Stat as gql_Stat } from '../generated/types/graphql';
import {
  getCurrentDateGraphQLString,
  secondsToHoursMinutes
} from '../utils/time';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';

const GET_STAT_SEGMENT = gql`
  query getStatSegment($startDate: Date!, $endDate: Date!) {
    getStatSegment(
      args: { startDate: $startDate, endDate: $endDate }
    ) {
      stats {
        date
        wordsChanged
        timeSpentSeconds
      }
    }
  }
`;
export default function TrackingLink() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const { data: statSegmentData } = useQuery(
    GET_STAT_SEGMENT,
    {
      variables: {
        startDate: getCurrentDateGraphQLString(),
        endDate: getCurrentDateGraphQLString()
      },
      fetchPolicy: 'no-cache'
    }
  );

  const aggregateStats = useMemo<gql_Stat>(() => {
    if (
      !statSegmentData ||
      statSegmentData.getStatSegment.stats.length === 0
    ) {
      return {
        wordsChanged: 0,
        timeSpentSeconds: 0,
        date: getCurrentDateGraphQLString()
      };
    }
    return statSegmentData.getStatSegment
      .stats[0] as gql_Stat;
  }, [statSegmentData]);
  if (!statSegmentData) {
    return <Loading />;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        cursor: 'pointer',
        marginBottom: theme.space.xs.value
      }}
      onClick={() => {
        router.push('/tracking');
      }}
      tabIndex={0}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1
        }}
      >
        <Text
          size={isDesktop ? 'medium' : 'small'}
          style={{
            userSelect: 'none'
          }}
        >
          Tracking
        </Text>
        <div
          style={{
            flex: 1,
            borderBottomColor: 'black',
            borderBottomStyle: 'dotted',
            borderBottomWidth: 2,
            marginBottom:
              ((parseFloat(theme.lineHeights.lg.value) -
                parseFloat(theme.fontSizes.md.value[0])) *
                // * 16 to convert from rem to px
                16) /
              // / 2 because space is present on the top and bottom of the line
              2,
            marginLeft: 8,
            marginRight: 8
          }}
        />
        <Text
          size={isDesktop ? 'medium' : 'small'}
          style={{
            userSelect: 'none'
          }}
        >
          {aggregateStats.wordsChanged} words in{' '}
          {secondsToHoursMinutes(
            aggregateStats.timeSpentSeconds
          ).hours > 0
            ? `${
                secondsToHoursMinutes(
                  aggregateStats.timeSpentSeconds
                ).hours
              } hours, `
            : ''}
          {
            secondsToHoursMinutes(
              aggregateStats.timeSpentSeconds
            ).minutes
          }{' '}
          minutes today
        </Text>
      </div>
    </div>
  );
}
