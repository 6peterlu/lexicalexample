import {
  DocumentNode,
  Resolvers,
  gql
} from '@apollo/client';
import {
  GetAllPublishedDocumentVersionsForUserInput,
  GetLikesForPublishedDocumentVersionRequest,
  GetPublishedDocumentVersionInput
} from '../../../../generated/types/graphql';
import { UserDB } from '../../models/user';
import { PublishedDocumentDB } from '../../models/publishedDocument';
import { GraphQLError } from 'graphql';
import prisma from '../../../../utils/prisma';

const typeDefs: DocumentNode = gql`
  input GetPublishedDocumentVersionInput {
    username: String
    slug: String
    documentID: String
    userID: String
  }
  input GetAllPublishedDocumentVersionsForUserInput {
    username: String!
  }
  input GetLikesForPublishedDocumentVersionRequest {
    publishedDocumentID: String!
  }
  type PublishedDocumentVersion {
    content: String
    publishedDocumentID: String!
    title: String!
    subtitle: String
    publishedAt: Date!
    updatedAt: Date!
    userID: String!
    documentID: String!
    url: String!
    user: User
    likingUsers: [String!]!
  }
  type PublishedDocumentVersionMetadata {
    title: String!
    publishedAt: Date!
    url: String!
  }
  extend type Query {
    getPublishedDocumentVersion(
      args: GetPublishedDocumentVersionInput!
    ): PublishedDocumentVersion!
    getAllPublishedDocumentVersionsForUser(
      args: GetAllPublishedDocumentVersionsForUserInput!
    ): [PublishedDocumentVersion!]!
    getLikesForPublishedDocumentVersion(
      args: GetLikesForPublishedDocumentVersionRequest!
    ): [User!]!
  }
`;

async function getPublishedDocumentVersion(
  _parent: any,
  { args }: { args: GetPublishedDocumentVersionInput },
  _context: any
) {
  if (args.username && args.slug) {
    const publishedDocument =
      await PublishedDocumentDB.fromUsernameAndSlug({
        username: args.username,
        slug: args.slug
      });
    return await publishedDocument.toGraphQL();
  } else if (args.documentID && args.userID) {
    const publishedDocument =
      await PublishedDocumentDB.fromDocumentIDAndUserID({
        documentID: args.documentID,
        userID: args.userID
      });
    return await publishedDocument.toGraphQL();
  }
  throw new GraphQLError(
    'getPublishedDocumentVersion: must provide either username and slug or documentID and userID'
  );
}

async function getAllPublishedDocumentVersionsForUser(
  _parent: any,
  {
    args
  }: { args: GetAllPublishedDocumentVersionsForUserInput },
  { user }: { user: UserDB }
) {
  const publishedDocuments =
    await PublishedDocumentDB.fromUsername({
      username: args.username
    });
  return publishedDocuments.map(
    async (publishedDocument) => {
      return publishedDocument.toGraphQLMetadata();
    }
  );
}

async function getLikesForPublishedDocumentVersion(
  _parent: any,
  {
    args
  }: { args: GetLikesForPublishedDocumentVersionRequest },
  { user }: { user: UserDB }
) {
  const publishedDocumentData =
    await prisma.publishedDocument.findUniqueOrThrow({
      where: {
        publishedDocumentID: args.publishedDocumentID
      },
      include: {
        likingUsers: {
          select: {
            userID: true
          }
        }
      }
    });
  return publishedDocumentData.likingUsers.map(
    (l) => l.userID
  );
}

const resolvers: Resolvers = {
  Query: {
    getPublishedDocumentVersion,
    getAllPublishedDocumentVersionsForUser,
    getLikesForPublishedDocumentVersion
  }
};

export default { typeDefs, resolvers };
