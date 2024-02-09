import { gql, Resolvers } from '@apollo/client';
import { DocumentNode } from 'graphql';
import {
  GetDailyChallengeForDateRequest,
  GetDailyChallengeStatusesForTrackingPageRequest,
  GetOthersDailyChallengeResponsesRequest,
  DailyChallengeStatus as gql_DailyChallengeStatus
} from '../../../../generated/types/graphql';
import prisma from '../../../../utils/prisma';
import { UserDB } from '../../models/user';
import { GetDailyChallengeForDateResponse } from '../../../../generated/types/graphql';
import { DailyChallengeResponseDB } from '../../models/dailyChallengeResponse';
import { getWordCount } from '../../../../utils/lexical';
import {
  DailyChallengeStatus,
  DAILY_CHALLENGE_REQUIRED_WORD_COUNT
} from '../../../../utils/constants';
import {
  getStartAndEndOfCurrentDayPacificTime,
  startOfDayUTC
} from '../../../../utils/time';
import { addDays } from 'date-fns';
import { getCurrentStreak } from '../../utils/tracking';

const typeDefs: DocumentNode = gql`
  input GetDailyChallengeForDateRequest {
    date: Date!
  }
  type DailyChallenge {
    date: Date!
    id: Int!
    content: String!
  }
  type DailyChallengeResponse {
    dailyChallengeID: Int!
    dailyChallengeResponseID: String
    content: String
    userID: String
    likes: [String!]! # userIDs who liked this response
    postedOn: DateTime
  }
  type GetDailyChallengeForDateResponse {
    prompt: DailyChallenge!
    response: DailyChallengeResponse
  }
  input GetOthersDailyChallengeResponsesRequest {
    dailyChallengeID: Int!
    responseString: String
  }
  input GetDailyChallengeStatusesForTrackingPageRequest {
    startDate: Date!
    endDate: Date!
  }
  type DailyChallengeStatus {
    date: Date!
    status: Int!
    completedOnTime: Boolean!
  }
  type TrackingPageData {
    longestStreak: Int!
    currentStreak: Int!
    dailyChallengeStatuses: [DailyChallengeStatus!]!
  }
  extend type Query {
    getDailyChallengeForDate(
      args: GetDailyChallengeForDateRequest
    ): GetDailyChallengeForDateResponse!
    getOthersDailyChallengeResponses(
      args: GetOthersDailyChallengeResponsesRequest
    ): [DailyChallengeResponse!]!
    getTrackingPageData(
      args: GetDailyChallengeStatusesForTrackingPageRequest
    ): TrackingPageData!
  }
`;

async function getDailyChallengeForDate(
  _parent: any,
  { args }: { args: GetDailyChallengeForDateRequest },
  { user }: { user: UserDB }
): Promise<GetDailyChallengeForDateResponse> {
  const currentDayChallenge =
    await prisma.dailyChallenge.findUniqueOrThrow({
      where: { date: args.date }
    });
  if (!user) {
    return {
      prompt: {
        date: currentDayChallenge.date,
        id: currentDayChallenge.id,
        content: currentDayChallenge.prompt
      }
    };
  }
  const dailyChallengeResponse =
    await DailyChallengeResponseDB.fromDailyChallengeIDAndUserID(
      {
        dailyChallengeID: currentDayChallenge.id,
        userID: user.userID
      }
    );
  return {
    prompt: {
      date: currentDayChallenge.date,
      id: currentDayChallenge.id,
      content: currentDayChallenge.prompt
    },
    response: dailyChallengeResponse.toGraphQL()
  };
}

async function getOthersDailyChallengeResponses(
  _parent: any,
  {
    args
  }: {
    args: GetOthersDailyChallengeResponsesRequest;
  },
  { user }: { user: UserDB }
) {
  if (!user) {
    if (
      getWordCount(args.responseString) <
      DAILY_CHALLENGE_REQUIRED_WORD_COUNT
    ) {
      return [];
    }
  } else {
    const dailyChallengeResponse =
      await DailyChallengeResponseDB.fromDailyChallengeIDAndUserID(
        {
          dailyChallengeID: args.dailyChallengeID,
          userID: user.userID
        }
      );
    if (!dailyChallengeResponse.postedOn) {
      return []; // return empty list if you haven't posted
    }
  }
  const prRecords =
    await prisma.dailyChallengeResponse.findMany({
      where: {
        dailyChallengeID: args.dailyChallengeID,
        postedOn: { not: null },
        OR: [
          {
            userID: {
              not: user?.userID
            }
          },
          { userID: null }
        ]
      },
      include: {
        likes: true
      }
    });
  return prRecords.map((pr) =>
    DailyChallengeResponseDB.fromPrisma(pr).toGraphQL()
  );
}

async function getTrackingPageData(
  _parent: any,
  {
    args
  }: {
    args: GetDailyChallengeStatusesForTrackingPageRequest;
  },
  { user }: { user: UserDB }
) {
  const prRecords =
    await prisma.dailyChallengeResponse.findMany({
      where: {
        userID: user.userID,
        dailyChallenge: {
          date: {
            gte: args.startDate,
            lte: args.endDate
          }
        }
      },
      include: {
        dailyChallenge: {
          select: {
            date: true
          }
        }
      },
      orderBy: {
        dailyChallenge: {
          date: 'asc'
        }
      }
    });
  const dailyChallengeStatuses: gql_DailyChallengeStatus[] =
    [];
  for (const pr of prRecords) {
    const wordCount = pr.wordCount;
    const date = pr.dailyChallenge.date;
    let status = DailyChallengeStatus.NOT_STARTED;
    if (wordCount >= DAILY_CHALLENGE_REQUIRED_WORD_COUNT) {
      status = DailyChallengeStatus.COMPLETED;
    } else if (wordCount > 0) {
      status = DailyChallengeStatus.IN_PROGRESS;
    }
    dailyChallengeStatuses.push({
      date,
      status,
      completedOnTime: pr.completedOnTime
    });
  }
  const longestStreakUserRecord =
    await prisma.user.findUnique({
      where: {
        userID: user.userID
      },
      select: {
        longestStreak: true
      }
    });
  // get current completed on time streak
  const currentStreak = getCurrentStreak(prRecords);

  return {
    dailyChallengeStatuses: dailyChallengeStatuses,
    longestStreak: longestStreakUserRecord.longestStreak,
    currentStreak
  };
}

const resolvers: Resolvers = {
  Query: {
    getDailyChallengeForDate,
    getOthersDailyChallengeResponses,
    getTrackingPageData
  }
};

export default { typeDefs, resolvers };
