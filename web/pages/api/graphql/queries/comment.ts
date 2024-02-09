import {
  Resolvers,
  DocumentNode,
  gql
} from '@apollo/client';
import {
  GetCommentsForDocumentRequest,
  GetCommentsForDocumentResponse,
  Note as gql_Note
} from '../../../../generated/types/graphql';
import { NoteDB } from '../../models/note';
import { UserDB } from '../../models/user';
import { GraphQLError } from 'graphql';
import { DocumentVersionDB } from '../../models/documentVersion';
import { UserDocumentPermissionDB } from '../../models/userDocumentPermission';
import { CommentDB } from '../../models/comment';
import prisma from '../../../../utils/prisma';

const typeDefs: DocumentNode = gql`
  input GetCommentsForDocumentRequest {
    documentID: String!
    versionName: String
    resolved: Boolean!
  }
  type GetCommentsForDocumentResponse {
    comments: [Comment!]!
  }
  extend type Query {
    getCommentsForDocument(
      args: GetCommentsForDocumentRequest!
    ): GetCommentsForDocumentResponse!
  }
`;

export async function getCommentsForDocumentHelper({
  user,
  documentVersion
}: {
  user: UserDB;
  documentVersion: DocumentVersionDB;
}) {
  // TODO: redo comment permissions
  const comments = (
    await prisma.comment.findMany({
      where: {
        documentVersionID:
          documentVersion.documentVersionID,
        resolved: false
      },
      include: {
        author: true
      }
    })
  ).map((c) => CommentDB.fromPrisma(c));
  return comments;
}

async function getCommentsForDocument(
  _parent: any,
  { args }: { args: GetCommentsForDocumentRequest },
  context: { user: UserDB }
): Promise<GetCommentsForDocumentResponse> {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }

  const documentVersion =
    await DocumentVersionDB.fromDocumentIDAndVersionName({
      query: args,
      user: context.user
    });
  const comments = await getCommentsForDocumentHelper({
    user: context.user,
    documentVersion
  });
  return {
    comments: comments.map((c) => c.toGraphQL())
  };
}

const resolvers: Resolvers = {
  Query: {
    getCommentsForDocument
  }
};

export default { typeDefs, resolvers };
