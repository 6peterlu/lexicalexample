import {
  DocumentNode,
  gql,
  Resolvers
} from '@apollo/client';
import { GetStatSegmentRequest } from '../../../../generated/types/graphql';
import { UserDB } from '../../models/user';
import {
  DailyStatUnitDB,
  DailyStatUnitAggregate
} from '../../models/dailyStatUnit';
import prisma from '../../../../utils/prisma';

const typeDefs: DocumentNode = gql`
  input GetStatSegmentRequest {
    startDate: Date!
    endDate: Date!
    username: String
  }
  type Stat {
    date: Date!
    wordsChanged: Int!
    timeSpentSeconds: Int!
  }
  type StatResponse {
    stats: [Stat!]!
  }
  extend type Query {
    getStatSegment(
      args: GetStatSegmentRequest!
    ): StatResponse!
  }
`;

// Aggregates by day
async function getStatSegment(
  _parent: any,
  { args }: { args: GetStatSegmentRequest },
  { user }: { user: UserDB }
) {
  let targetUserID = user?.userID;
  if (args.username) {
    const targetUser = await UserDB.fromUsername(
      args.username
    );
    targetUserID = targetUser.userID;
  }
  const statSegments = await prisma.dailyStatUnit.findMany({
    where: {
      userID: targetUserID,
      date: {
        gte: args.startDate,
        lte: args.endDate
      }
    }
  });
  const dailyStatUnitAggregate =
    DailyStatUnitAggregate.fromDailyStatUnits(
      statSegments.map((s) => DailyStatUnitDB.fromPrisma(s))
    );
  return {
    stats: dailyStatUnitAggregate.map((s) => s.toGraphQL())
  };
}

const resolvers: Resolvers = {
  Query: {
    getStatSegment
  }
};

export default { typeDefs, resolvers };
