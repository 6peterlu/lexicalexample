import { gql, Resolvers } from '@apollo/client';
import { DocumentNode, GraphQLError } from 'graphql';
import {
  NotLoggedInPostDailyChallengeRequest,
  PostDailyChallengeRequest,
  SubmitPromptSuggestionRequest,
  ToggleLikeDailyChallengeResponseRequest,
  UnpostDailyChallengeRequest,
  UpdateDailyChallengeResponseContentRequest
} from '../../../../generated/types/graphql';
import { UserDB } from '../../models/user';
import { DailyChallengeResponseDB } from '../../models/dailyChallengeResponse';
import prisma from '../../../../utils/prisma';
import { DailyStatUnitDB } from '../../models/dailyStatUnit';
import { DAILY_CHALLENGE_REQUIRED_WORD_COUNT } from '../../../../utils/constants';
import { getStartAndEndOfDatePacificTime } from '../../../../utils/time';
import { getCurrentStreak } from '../../utils/tracking';
import {
  Prisma,
  PrismaPromise
} from '../../../../generated/prisma';

const typeDefs: DocumentNode = gql`
  input UpdateDailyChallengeResponseContentRequest {
    content: String!
    dailyChallengeResponseID: String!
    wordCount: Int!
    date: Date!
  }
  input PostDailyChallengeRequest {
    dailyChallengeResponseID: String!
  }
  input ToggleLikeDailyChallengeResponseRequest {
    dailyChallengeResponseID: String!
  }
  input UnpostDailyChallengeRequest {
    dailyChallengeResponseID: String!
  }
  input NotLoggedInPostDailyChallengeRequest {
    dailyChallengeID: Int!
    content: String!
  }
  input SubmitPromptSuggestionRequest {
    prompt: String!
  }
  extend type Mutation {
    updateDailyChallengeResponseContent(
      request: UpdateDailyChallengeResponseContentRequest!
    ): Void
    postDailyChallengeResponse(
      request: PostDailyChallengeRequest
    ): Void
    toggleLikeDailyChallengeResponse(
      request: ToggleLikeDailyChallengeResponseRequest!
    ): Void
    unpostDailyChallengeResponse(
      request: UnpostDailyChallengeRequest!
    ): Void
    notLoggedInPostDailyChallenge(
      request: NotLoggedInPostDailyChallengeRequest!
    ): Void
    submitPromptSuggestion(
      request: SubmitPromptSuggestionRequest!
    ): Void
  }
`;

async function updateDailyChallengeResponseContent(
  _parent: any,
  {
    request
  }: {
    request: UpdateDailyChallengeResponseContentRequest;
  },
  { user }: { user: UserDB }
) {
  const dailyChallengeResponse =
    await DailyChallengeResponseDB.fromDailyChallengeResponseIDAndUserID(
      {
        dailyChallengeResponseID:
          request.dailyChallengeResponseID,
        userID: user.userID
      }
    );
  const wordDelta =
    request.wordCount - dailyChallengeResponse.wordCount;

  const dailyStatUnitPrismaUpdate =
    await DailyStatUnitDB.createOrUpdateStatsForDailyChallengeResponse(
      {
        dailyChallengeResponseID:
          dailyChallengeResponse.dailyChallengeResponseID,
        wordsAdded: wordDelta > 0 ? wordDelta : 0,
        wordsRemoved: wordDelta < 0 ? -wordDelta : 0,
        timeSpentSeconds: 0,
        date: request.date,
        userID: user.userID
      }
    );
  let isCompletedOnTime = false;
  if (
    request.wordCount >= DAILY_CHALLENGE_REQUIRED_WORD_COUNT
  ) {
    // get daily challenge record
    const dailyChallenge =
      await prisma.dailyChallenge.findUniqueOrThrow({
        where: {
          id: dailyChallengeResponse.dailyChallengeID
        }
      });
    // convert dailyChallenge.date to pacific time
    const { startOfDay, endOfDay } =
      getStartAndEndOfDatePacificTime(dailyChallenge.date);
    isCompletedOnTime =
      request.date >= startOfDay &&
      request.date <= endOfDay;
  }

  const transactionList: PrismaPromise<any>[] = [
    prisma.dailyStatUnit.update(dailyStatUnitPrismaUpdate),
    prisma.dailyChallengeResponse.update({
      where: {
        dailyChallengeResponseID:
          dailyChallengeResponse.dailyChallengeResponseID
      },
      data: {
        content: JSON.parse(request.content),
        wordCount: request.wordCount,
        completedOnTime: isCompletedOnTime
          ? true
          : undefined
      }
    })
  ];

  if (isCompletedOnTime) {
    // check and update longest streak if necessary
    const responses =
      await prisma.dailyChallengeResponse.findMany({
        where: {
          userID: user.userID
        },
        include: {
          dailyChallenge: {
            select: {
              date: true
            }
          }
        }
      });
    const currentStreak = getCurrentStreak(responses);
    const currentLongestStreakUser =
      await prisma.user.findUnique({
        where: {
          userID: user.userID
        }
      });
    if (
      currentStreak + 1 >
      currentLongestStreakUser.longestStreak
    ) {
      transactionList.push(
        prisma.user.update({
          where: {
            userID: user.userID
          },
          data: {
            longestStreak: currentStreak + 1
          }
        })
      );
    }
  }

  await prisma.$transaction(transactionList);
}

async function notLoggedInPostDailyChallenge(
  _parent: any,
  {
    request
  }: {
    request: NotLoggedInPostDailyChallengeRequest;
  },
  { user }: { user: UserDB }
) {
  if (user) {
    throw new GraphQLError(
      'notLoggedInPostDailyChallenge: User is logged in'
    );
  }
  await prisma.dailyChallengeResponse.create({
    data: {
      content: JSON.parse(request.content),
      postedOn: new Date(),
      dailyChallengeID: request.dailyChallengeID
    }
  });
}

async function postDailyChallengeResponse(
  _parent: any,
  {
    request
  }: {
    request: PostDailyChallengeRequest;
  },
  { user }: { user: UserDB }
) {
  const dailyChallengeResponse =
    await DailyChallengeResponseDB.fromDailyChallengeResponseIDAndUserID(
      {
        dailyChallengeResponseID:
          request.dailyChallengeResponseID,
        userID: user.userID
      }
    );
  await prisma.dailyChallengeResponse.update({
    where: {
      dailyChallengeResponseID:
        dailyChallengeResponse.dailyChallengeResponseID
    },
    data: {
      postedOn: new Date()
    }
  });
}

async function toggleLikeDailyChallengeResponse(
  _parent: any,
  {
    request
  }: {
    request: ToggleLikeDailyChallengeResponseRequest;
  },
  { user }: { user: UserDB }
) {
  const existingLike =
    await prisma.dailyChallengeResponseLikes.findUnique({
      where: {
        userID_dailyChallengeResponseID: {
          userID: user.userID,
          dailyChallengeResponseID:
            request.dailyChallengeResponseID
        }
      }
    });
  if (existingLike) {
    // unlike
    await prisma.dailyChallengeResponseLikes.delete({
      where: { likeID: existingLike.likeID }
    });
  } else {
    await prisma.dailyChallengeResponseLikes.create({
      data: {
        userID: user.userID,
        dailyChallengeResponseID:
          request.dailyChallengeResponseID
      }
    });
  }
}

// graphql resolver for unposting a daily challenge response
async function unpostDailyChallengeResponse(
  _parent: any,
  {
    request
  }: {
    request: UnpostDailyChallengeRequest;
  },
  { user }: { user: UserDB }
) {
  const dailyChallengeResponse =
    await DailyChallengeResponseDB.fromDailyChallengeResponseIDAndUserID(
      {
        dailyChallengeResponseID:
          request.dailyChallengeResponseID,
        userID: user.userID
      }
    );
  // delete likes and remove postedOn
  await prisma.$transaction([
    prisma.dailyChallengeResponseLikes.deleteMany({
      where: {
        dailyChallengeResponseID:
          dailyChallengeResponse.dailyChallengeResponseID
      }
    }),
    prisma.dailyChallengeResponse.update({
      where: {
        dailyChallengeResponseID:
          dailyChallengeResponse.dailyChallengeResponseID
      },
      data: {
        postedOn: null
      }
    })
  ]);
}

// graphql resolver for submitting a prompt suggestion
async function submitPromptSuggestion(
  _parent: any,
  {
    request
  }: {
    request: SubmitPromptSuggestionRequest;
  },
  { user }: { user: UserDB }
) {
  await prisma.dailyChallengePromptSuggestion.create({
    data: {
      prompt: request.prompt,
      userID: user.userID
    }
  });
}

const resolvers: Resolvers = {
  Mutation: {
    updateDailyChallengeResponseContent,
    postDailyChallengeResponse,
    toggleLikeDailyChallengeResponse,
    unpostDailyChallengeResponse,
    notLoggedInPostDailyChallenge,
    submitPromptSuggestion
  }
};

export default { typeDefs, resolvers };
