import {
  DocumentNode,
  Resolvers,
  gql
} from '@apollo/client';
import {
  FeedItem,
  GetDocumentVersionRequest
} from '../../../../generated/types/graphql';
import { UserDB } from '../../models/user';
import prisma from '../../../../utils/prisma';
import { WritingSessionDB } from '../../../../models/writingSession';

const typeDefs: DocumentNode = gql`
  enum FeedItemType {
    WritingSession
  }
  type FeedItem {
    feedItemType: FeedItemType!
    date: DateTime!
    serializedData: String!
  }
  extend type Query {
    getFeedItems: [FeedItem!]!
  }
`;

async function getFeedItems(
  _parent: any,
  _args: any,
  { user }: { user: UserDB }
): Promise<FeedItem[]> {
  const followingUserIDs = (
    await prisma.follows.findMany({
      where: {
        followerID: user.userID
      },
      select: {
        followingID: true
      }
    })
  ).map((f) => f.followingID);
  const writingSessionFeedItems =
    await prisma.writingSession.findMany({
      where: {
        userID: {
          in: [...followingUserIDs, user.userID]
        },
        inProgress: false
      },
      include: {
        user: true
      }
    });
  return writingSessionFeedItems.map((w) =>
    WritingSessionDB.fromPrisma(w).toFeedItem()
  );
}

const resolvers: Resolvers = {
  Query: {
    getFeedItems
  }
};

export default { resolvers, typeDefs };
