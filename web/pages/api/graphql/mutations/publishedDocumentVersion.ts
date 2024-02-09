import {
  DocumentNode,
  Resolvers,
  gql
} from '@apollo/client';
import {
  ToggleLikePublishedDocumentVersionRequest,
  UnpublishDocumentVersionRequest
} from '../../../../generated/types/graphql';
import { UserDB } from '../../models/user';
import prisma from '../../../../utils/prisma';

const typeDefs: DocumentNode = gql`
  input UnpublishDocumentVersionRequest {
    documentID: String!
  }
  input ToggleLikePublishedDocumentVersionRequest {
    publishedDocumentID: String!
  }
  extend type Mutation {
    unpublishDocumentVersion(
      request: UnpublishDocumentVersionRequest!
    ): Void
    toggleLikePublishedDocumentVersion(
      request: ToggleLikePublishedDocumentVersionRequest!
    ): Void
  }
`;

async function unpublishDocumentVersion(
  _parent: any,
  { request }: { request: UnpublishDocumentVersionRequest },
  { user }: { user: UserDB }
) {
  await prisma.publishedDocument.delete({
    where: {
      documentID_userID: {
        documentID: request.documentID,
        userID: user.userID
      }
    }
  });
}

async function toggleLikePublishedDocumentVersion(
  _parent: any,
  {
    request
  }: { request: ToggleLikePublishedDocumentVersionRequest },
  { user }: { user: UserDB }
) {
  const existingLike =
    await prisma.publishedDocument.findMany({
      where: {
        publishedDocumentID: request.publishedDocumentID,
        likingUsers: {
          some: {
            userID: user.userID
          }
        }
      }
    });
  if (existingLike.length > 0) {
    // already liked, unlike
    await prisma.publishedDocument.update({
      where: {
        publishedDocumentID: request.publishedDocumentID
      },
      data: {
        likingUsers: {
          disconnect: {
            userID: user.userID
          }
        }
      }
    });
  } else {
    // not liked yet, like
    await prisma.publishedDocument.update({
      where: {
        publishedDocumentID: request.publishedDocumentID
      },
      data: {
        likingUsers: {
          connect: {
            userID: user.userID
          }
        }
      }
    });
  }
}

const resolvers: Resolvers = {
  Mutation: {
    unpublishDocumentVersion,
    toggleLikePublishedDocumentVersion
  }
};

export default { typeDefs, resolvers };
