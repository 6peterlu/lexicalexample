import {
  Resolvers,
  TypedDocumentNode,
  gql
} from '@apollo/client';
import { UserDB } from '../../models/user';
import prisma from '../../../../utils/prisma';
import { GetEnhancedDocumentRequest } from '../../../../generated/types/graphql';
import { DEFAULT_STORED_EMBEDDING_TYPE } from '../mutations/enhancedDocument';

const typeDefs: TypedDocumentNode = gql`
  type EnhancedDocumentMetadata {
    enhancedDocumentID: String!
    title: String!
    updatedAt: DateTime!
  }
  input GetEnhancedDocumentRequest {
    enhancedDocumentID: String!
  }
  type EnhancedDocument {
    enhancedDocumentID: String!
    title: String!
    notesContent: String!
    embeddingsByNodeID: String!
    draftContent: String
    draftCollapsed: Boolean!
    ideas: [String!]!
  }
  extend type Query {
    getEnhancedDocumentMetadata: [EnhancedDocumentMetadata!]!
    getEnhancedDocument(
      args: GetEnhancedDocumentRequest
    ): EnhancedDocument!
  }
`;

async function getEnhancedDocumentMetadata(
  _parent: any,
  _args: any,
  { user }: { user: UserDB }
) {
  const accessibleDocuments =
    await prisma.enhancedDocument.findMany({
      where: {
        userEnhancedDocumentPermissions: {
          some: {
            userID: user.userID
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
  return accessibleDocuments.map((d) => ({
    enhancedDocumentID: d.enhancedDocumentID,
    title: d.title,
    updatedAt: d.updatedAt
  }));
}

async function getEnhancedDocument(
  _parent: any,
  { args }: { args: GetEnhancedDocumentRequest },
  { user }: { user: UserDB }
) {
  // basic permission check
  await prisma.userEnhancedDocumentPermissions.findUniqueOrThrow(
    {
      where: {
        userID_enhancedDocumentID: {
          userID: user.userID,
          enhancedDocumentID: args.enhancedDocumentID
        }
      }
    }
  );
  const document = await prisma.enhancedDocument.findUnique(
    {
      where: {
        enhancedDocumentID: args.enhancedDocumentID
      }
    }
  );
  return {
    enhancedDocumentID: document.enhancedDocumentID,
    title: document.title,
    notesContent: JSON.stringify(document.notesContent),
    embeddingsByNodeID: JSON.stringify(
      document.embeddingsByNodeID ||
        DEFAULT_STORED_EMBEDDING_TYPE
    ),
    draftContent: document.draftContent
      ? JSON.stringify(document.draftContent)
      : undefined,
    draftCollapsed: document.draftCollapsed,
    ideas: document.ideas
  };
}

const resolvers: Resolvers = {
  Query: {
    getEnhancedDocumentMetadata,
    getEnhancedDocument
  }
};

export default { typeDefs, resolvers };
