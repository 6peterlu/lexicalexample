import {
  DocumentNode,
  Resolvers,
  gql
} from '@apollo/client';
import {
  CreateCommentRequest,
  CreateCommentResponse,
  ResolveCommentRequest
} from '../../../../generated/types/graphql';
import { UserDB } from '../../models/user';
import { GraphQLError } from 'graphql';
import { DocumentVersionDB } from '../../models/documentVersion';
import prisma from '../../../../utils/prisma';
import { CommentDB } from '../../models/comment';
import {
  Comment as pr_Comment,
  User as pr_User
} from '../../../../generated/prisma';
import { UserDocumentPermissionDB } from '../../models/userDocumentPermission';
import { getAllPermissionsFromTypedRoles } from '../../../../utils/permissions';

const typeDefs: DocumentNode = gql`
  type Comment {
    commentData: String
    commentID: String
    user: User
    resolved: Boolean
    selectedText: String
  }
  input CreateCommentRequest {
    documentID: String!
    versionName: String
    commentData: String!
    selectedText: String!
  }
  type CreateCommentResponse {
    createdComment: Comment!
  }
  input ResolveCommentRequest {
    commentID: String!
    userDocumentPermissionID: String!
  }

  extend type Mutation {
    createComment(
      request: CreateCommentRequest!
    ): CreateCommentResponse!
    resolveComment(request: ResolveCommentRequest!): Void
  }
`;

async function createComment(
  _parent: any,
  { request }: { request: CreateCommentRequest },
  context: { user: UserDB }
): Promise<CreateCommentResponse> {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  const documentVersion =
    await DocumentVersionDB.fromDocumentIDAndVersionName({
      query: {
        documentID: request.documentID,
        versionName: request.versionName
      },
      user: context.user
    });
  if (!documentVersion) {
    throw new GraphQLError(
      'Do not have permissions to add comment to document'
    );
  }
  const userDocumentPermissions =
    await UserDocumentPermissionDB.fromDocumentVersion({
      documentVersion,
      user: context.user
    });

  if (
    !getAllPermissionsFromTypedRoles(
      userDocumentPermissions.map((udp) =>
        udp.toTypedRole()
      )
    )
  ) {
    throw new GraphQLError(
      'createComment: invalid user document permission'
    );
  }
  const commentDataJSON = JSON.parse(request.commentData);

  // TODO: validate on input to avoid malformed DB entries
  // if (!validateCommentData(commentDataJSON)) {
  //   throw new Error('Comment is of invalid format.');
  // }
  const commentRecord = await prisma.comment.create({
    data: {
      commentData: commentDataJSON,
      authorID: context.user.userID,
      documentVersionID: documentVersion.documentVersionID,
      private: false,
      selectedText: request.selectedText
    },
    include: {
      author: true
    }
  });
  const comment = CommentDB.fromPrisma(
    commentRecord as pr_Comment & { author: pr_User }
  );
  return { createdComment: comment.toGraphQL() };
}

async function resolveComment(
  _parent: any,
  { request }: { request: ResolveCommentRequest },
  context: { user: UserDB }
): Promise<void> {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  const comment = await CommentDB.fromCommentID(
    request.commentID
  );
  const udpModel =
    await UserDocumentPermissionDB.fromUserDocumentPermissionID(
      request.userDocumentPermissionID,
      context.user
    );
  const userDocumentVersion =
    await DocumentVersionDB.uncheckedFromDocumentVersionID(
      comment.documentVersionID
    );
  if (
    !userDocumentVersion.userDocumentPermissionIsValid(
      udpModel
    )
  ) {
    throw new GraphQLError(
      'resolveCommentRequest: userDocumentPermissionID provided does not authorize on this document version'
    );
  }

  if (udpModel.userID !== context.user.userID) {
    throw new GraphQLError(
      'resolveCommentRequest: Invalid user document permission provided.'
    );
  }
  if (comment.resolved) {
    // needed because editing is firing the resolve endpoint dozens of times
    return;
  }
  await prisma.comment.update(
    comment.resolveCommentPrisma()
  );
}

const resolvers: Resolvers = {
  Mutation: {
    createComment,
    resolveComment
  }
};

export default { typeDefs, resolvers };
