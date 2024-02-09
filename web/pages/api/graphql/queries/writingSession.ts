import {
  DocumentNode,
  Resolvers,
  gql
} from '@apollo/client';
import { UserDB } from '../../models/user';
import prisma from '../../../../utils/prisma';
import {
  GetWritingSessionForDocumentRequest,
  GetWritingSessionsForUserRequest,
  WritingSession
} from '../../../../generated/types/graphql';
import { computeSegmentFlow } from '../../utils/writingAnalytics';

const typeDefs: DocumentNode = gql`
  type WritingSession {
    writingSessionID: String!
    wordsChanged: Int!
    timeSpentSeconds: Int!
    startDateTime: DateTime!
    title: String!
    segmentTime: [Int!]!
    userID: String!
    flow: Int
    username: String
  }
  input GetWritingSessionsForUserRequest {
    username: String!
  }
  input GetWritingSessionForDocumentRequest {
    documentID: String!
  }
  extend type Query {
    getWritingSessionsForUser(
      args: GetWritingSessionsForUserRequest!
    ): [WritingSession!]!
    getWritingSessionForDocument(
      args: GetWritingSessionForDocumentRequest!
    ): WritingSession
  }
`;

async function getWritingSessionsForUser(
  _parent: any,
  { args }: { args: GetWritingSessionsForUserRequest },
  _context: any
): Promise<WritingSession[]> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { username: args.username }
  });
  // TODO: convert writing session to model type
  const writingSessions =
    await prisma.writingSession.findMany({
      where: {
        userID: user.userID,
        inProgress: false
      },
      orderBy: {
        startDateTime: 'desc'
      }
    });
  return writingSessions.map((writingSession) => ({
    writingSessionID: writingSession.writingSessionID,
    wordsChanged:
      writingSession.wordsAdded +
      writingSession.wordsRemoved,
    timeSpentSeconds: writingSession.timeSpentSeconds,
    startDateTime: writingSession.startDateTime,
    title: writingSession.title,
    segmentTime: writingSession.segmentTime,
    flow: computeSegmentFlow(writingSession.segmentTime),
    userID: writingSession.userID
  }));
}

async function getWritingSessionForDocument(
  _parent: any,
  { args }: { args: GetWritingSessionForDocumentRequest },
  { user }: { user: UserDB }
): Promise<WritingSession> {
  const writingSession =
    await prisma.writingSession.findFirst({
      where: {
        userID: user.userID,
        documentID: args.documentID,
        inProgress: true
      }
    });
  if (!writingSession) {
    return null;
  }
  return {
    writingSessionID: writingSession.writingSessionID,
    wordsChanged:
      writingSession.wordsAdded +
      writingSession.wordsRemoved,
    timeSpentSeconds: writingSession.timeSpentSeconds,
    startDateTime: writingSession.startDateTime,
    title: writingSession.title,
    segmentTime: writingSession.segmentTime,
    flow: computeSegmentFlow(writingSession.segmentTime),
    userID: writingSession.userID
  };
}

export const resolvers: Resolvers = {
  Query: {
    getWritingSessionsForUser,
    getWritingSessionForDocument
  }
};

export default { typeDefs, resolvers };
