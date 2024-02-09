import {
  DocumentNode,
  Resolvers,
  gql
} from '@apollo/client';
import {
  CreateWritingSessionRequest,
  DeleteWritingSessionRequest,
  UpdateCompleteWritingSessionRequest,
  UpdateWritingSessionRequest
} from '../../../../generated/types/graphql';
import { UserDB } from '../../models/user';
import prisma from '../../../../utils/prisma';

const DEFAULT_WRITING_SESSION_TITLE = 'Writing session';

const typeDefs: DocumentNode = gql`
  input UpdateWritingSessionRequest {
    writingSessionID: String!
    wordsAdded: Int!
    wordsRemoved: Int!
    timeSpentSeconds: Int!
  }
  input CreateWritingSessionRequest {
    documentID: String!
  }
  input CompleteWritingSessionRequest {
    writingSessionID: String!
  }
  type WritingSessionCreateResponse {
    writingSessionID: String!
  }
  input DeleteWritingSessionRequest {
    writingSessionID: String!
  }
  input UpdateCompleteWritingSessionRequest {
    writingSessionID: String!
    title: String!
  }
  extend type Mutation {
    updateWritingSession(
      request: UpdateWritingSessionRequest!
    ): Void
    updateCompleteWritingSession(
      request: UpdateCompleteWritingSessionRequest!
    ): Void
    createWritingSession(
      request: CreateWritingSessionRequest!
    ): WritingSessionCreateResponse!
    completeWritingSession(
      request: CompleteWritingSessionRequest!
    ): Void
    deleteWritingSession(
      request: DeleteWritingSessionRequest!
    ): Void
  }
`;

async function updateWritingSession(
  _parent: any,
  { request }: { request: UpdateWritingSessionRequest },
  { user }: { user: UserDB }
) {
  const updated = await prisma.writingSession.updateMany({
    where: {
      writingSessionID: request.writingSessionID,
      inProgress: true,
      userID: user.userID
    },
    data: {
      wordsAdded: {
        increment: request.wordsAdded
      },
      wordsRemoved: {
        increment: request.wordsRemoved
      },
      timeSpentSeconds: {
        increment: request.timeSpentSeconds
      },
      segmentTime: {
        push: request.timeSpentSeconds
      }
    }
  });
  if (updated.count === 0) {
    throw new Error(
      'updateWritingSession: Writing session not found or is complete or not authorized to update'
    );
  }
}

async function createWritingSession(
  _parent: any,
  { request }: { request: CreateWritingSessionRequest },
  { user }: { user: UserDB }
) {
  const ws = await prisma.writingSession.create({
    data: {
      user: {
        connect: {
          userID: user.userID
        }
      },
      document: {
        connect: {
          documentID: request.documentID
        }
      },
      title: DEFAULT_WRITING_SESSION_TITLE
    }
  });
  return { writingSessionID: ws.writingSessionID };
}

async function completeWritingSession(
  _parent: any,
  { request }: { request: UpdateWritingSessionRequest },
  { user }: { user: UserDB }
) {
  const updated = await prisma.writingSession.updateMany({
    where: {
      writingSessionID: request.writingSessionID,
      inProgress: true,
      userID: user.userID
    },
    data: {
      inProgress: false
    }
  });
  if (updated.count === 0) {
    throw new Error(
      'completeWritingSession: Writing session not found or is complete or not authorized'
    );
  }
}

async function deleteWritingSession(
  _parent: any,
  { request }: { request: DeleteWritingSessionRequest },
  { user }: { user: UserDB }
) {
  const deleted = await prisma.writingSession.deleteMany({
    where: {
      writingSessionID: request.writingSessionID,
      userID: user.userID
    }
  });
  if (deleted.count === 0) {
    throw new Error('deleteWritingSession: not authorized');
  }
}

async function updateCompleteWritingSession(
  _parent: any,
  {
    request
  }: { request: UpdateCompleteWritingSessionRequest },
  { user }: { user: UserDB }
) {
  const updated = await prisma.writingSession.updateMany({
    where: {
      writingSessionID: request.writingSessionID,
      inProgress: false,
      userID: user.userID
    },
    data: {
      title: request.title
    }
  });
  if (updated.count === 0) {
    throw new Error(
      'updateCompleteWritingSession: Writing session not found or is not complete or not authorized'
    );
  }
}

const resolvers: Resolvers = {
  Mutation: {
    updateWritingSession,
    createWritingSession,
    completeWritingSession,
    deleteWritingSession,
    updateCompleteWritingSession
  }
};

export default { typeDefs, resolvers };
