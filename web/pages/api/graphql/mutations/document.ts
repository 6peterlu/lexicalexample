import {
  DocumentNode,
  gql,
  Resolvers
} from '@apollo/client';
import {
  CreateDocumentResponse,
  DeleteDocumentForUserRequest,
  SaveDocumentContentRequest,
  SaveDocumentTitleRequest,
  ShareDocumentRequest,
  ShareDocumentResponse
} from '../../../../generated/types/graphql';
import { GraphQLError } from 'graphql';
import { DocumentVersionDB } from '../../models/documentVersion';

import prisma from '../../../../utils/prisma';
import { UserDB } from '../../models/user';
import { DocumentDB } from '../../models/document';
import {
  UserDocumentPermission,
  UserDocumentPermissionDB
} from '../../models/userDocumentPermission';
import { canShareDocument } from '../../utils/permissions';
import { Role } from '../../../../generated/prisma';
import { DailyStatUnitDB } from '../../models/dailyStatUnit';
import { extractCommentIDsFromEditorState } from '../../../../utils/lexical';
import { getCommentsForDocumentHelper } from '../queries/comment';
import { getAllPermissionsForTypedRole } from '../../../../utils/permissions';

const typeDefs: DocumentNode = gql`
  input SaveDocumentContentRequest {
    documentID: String!
    versionName: String
    content: String!
    wordCount: Int!
    date: Date!
  }
  type CreateDocumentResponse {
    documentID: String!
  }
  input SaveDocumentTitleRequest {
    documentID: String!
    title: String!
  }
  input DeleteDocumentRequest {
    documentID: String!
  }
  input ShareDocumentRequest {
    documentID: String!
    username: String!
    role: EditableRole!
  }
  type ShareDocumentResponse {
    userDocumentPermission: UserDocumentPermissionMetadata!
  }
  input DeleteDocumentForUserRequest {
    documentID: String!
  }
  type SaveDocumentContentResponse {
    comments: [Comment!]!
  }
  extend type Mutation {
    saveDocumentContent(
      request: SaveDocumentContentRequest!
    ): SaveDocumentContentResponse
    createDocument: CreateDocumentResponse
    saveDocumentTitle(
      request: SaveDocumentTitleRequest!
    ): Void
    deleteDocument(request: DeleteDocumentRequest!): Void
    shareDocument(
      request: ShareDocumentRequest!
    ): ShareDocumentResponse
    deleteDocumentForUser(
      request: DeleteDocumentForUserRequest!
    ): Void
  }
`;

async function saveDocumentContent(
  _parent: any,
  { request }: { request: SaveDocumentContentRequest },
  context: { user: UserDB }
) {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  const documentVersionToEdit =
    await DocumentVersionDB.fromDocumentIDAndVersionName({
      query: {
        documentID: request.documentID,
        versionName: request.versionName
      },
      user: context.user
    });
  if (!documentVersionToEdit) {
    throw new GraphQLError(
      'Not authorized to edit document'
    );
  }
  const documentToEdit = await DocumentDB.fromDocumentID(
    context.user,
    request.documentID
  );
  documentVersionToEdit.content = JSON.parse(
    request.content
  );
  // update parent document updated at timestamp for any document version update
  documentToEdit.updatedAt = new Date();

  const wordsDelta =
    request.wordCount - documentVersionToEdit.wordCount;

  // update document version with new word count
  documentVersionToEdit.wordCount = request.wordCount;

  // comments
  const commentIDsInEditorState =
    extractCommentIDsFromEditorState(
      JSON.parse(request.content)
    );
  const commentIDsInDB = await prisma.comment.findMany({
    where: {
      documentVersionID:
        documentVersionToEdit.documentVersionID
    },
    select: {
      commentID: true
    }
  });

  const commentIDsToRemove = commentIDsInDB
    .filter(
      (comment) =>
        !commentIDsInEditorState.includes(comment.commentID)
    )
    .map((c) => c.commentID);

  const updateClause =
    await DailyStatUnitDB.createOrUpdateStatsForDocumentVersion(
      {
        userID: context.user.userID,
        documentVersionID:
          documentVersionToEdit.documentVersionID,
        wordsAdded: wordsDelta > 0 ? wordsDelta : 0,
        wordsRemoved: wordsDelta < 0 ? -wordsDelta : 0,
        timeSpentSeconds: 0,
        date: request.date
      }
    );

  // TODO: stronger typing for prisma txns
  let prismaTransactions: any[] = [
    prisma.documentVersion.update(
      documentVersionToEdit.toPrismaUpdate()
    ),
    prisma.document.update(documentToEdit.toPrismaUpdate()),
    prisma.dailyStatUnit.update(updateClause),
    prisma.comment.deleteMany({
      where: {
        commentID: {
          in: commentIDsToRemove
        }
      }
    })
  ];

  await prisma.$transaction(prismaTransactions);

  const comments = await getCommentsForDocumentHelper({
    user: context.user,
    documentVersion: documentVersionToEdit
  });
  return { comments: comments.map((c) => c.toGraphQL()) };
}

async function createDocument(
  _parent: any,
  _: any,
  { user }: { user: UserDB }
): Promise<CreateDocumentResponse> {
  // TODO: create a decorator or mixin so we don't have to put this on every line
  if (!user) {
    throw new GraphQLError('createDocument: Not logged in');
  }
  const document = user.createDocumentWithGeneratedTitle();
  const docRecord = await prisma.document.create({
    data: document,
    include: {
      documentVersions: {
        include: {
          userDocumentPermissions: {
            include: { user: true }
          }
        }
      },
      userDocumentPermissions: {
        include: { user: true }
      },
      userDocumentAttributes: {
        where: {
          userID: user.userID
        }
      }
    }
  });
  const documentModel = DocumentDB.fromPrisma(docRecord);
  return documentModel.toCreateDocumentGraphQLResponse();
}

async function saveDocumentTitle(
  _parent: any,
  { request }: { request: SaveDocumentTitleRequest },
  context: any
) {
  if (!context.user) {
    throw new GraphQLError(
      'saveDocumentTitle: Not logged in'
    );
  }
  const documentToEdit = await DocumentDB.fromDocumentID(
    context.user,
    request.documentID
  );
  if (!documentToEdit) {
    throw new GraphQLError(
      'saveDocumentTitle: Not authorized to edit note'
    );
  }
  documentToEdit.title = request.title;
  await prisma.document.update(
    documentToEdit.toPrismaUpdate()
  );
}

async function shareDocument(
  _parent: any,
  { request }: { request: ShareDocumentRequest },
  context: any
): Promise<ShareDocumentResponse> {
  const callerUserDocumentPermission =
    UserDocumentPermissionDB.fromPrisma(
      await prisma.userDocumentPermission.findFirstOrThrow({
        where: {
          userID: context.user.userID,
          documentID: request.documentID
        },
        include: {
          user: true
        }
      })
    );
  if (
    !getAllPermissionsForTypedRole(
      callerUserDocumentPermission.toTypedRole()
    )
  ) {
    throw new GraphQLError('Document share unauthorized');
  }

  const document = await DocumentDB.fromDocumentID(
    context.user,
    request.documentID
  );

  const userToShare = await UserDB.fromUsername(
    request.username
  );
  const userDocumentPermission =
    UserDocumentPermission.fromDocument({
      document,
      user: userToShare,
      role: request.role
    });
  const prismaUDP =
    await prisma.userDocumentPermission.create({
      data: userDocumentPermission.toPrismaCreate(),
      include: { user: true }
    });
  const userDocumentPermissionRecord =
    UserDocumentPermissionDB.fromPrisma(prismaUDP);
  return {
    userDocumentPermission:
      userDocumentPermissionRecord.toGraphQLMetadata()
  };
}

async function deleteDocumentForUser(
  _parent: any,
  { request }: { request: DeleteDocumentForUserRequest },
  context: any
) {
  const documentToDelete = await DocumentDB.fromDocumentID(
    context.user,
    request.documentID
  );
  if (!documentToDelete) {
    throw new GraphQLError(
      'deleteDocumentForUser: user does not have permission to delete document'
    );
  }
  const permissionsForDocument =
    documentToDelete.getAllLoadedPermissions();
  if (
    permissionsForDocument.some(
      (udp) =>
        // check if the calling user is the owner
        udp.role === Role.OWNER &&
        udp.userID === context.user.userID
    )
  ) {
    // deleting user is owner, delete entire document.
    await prisma.document.delete({
      where: { documentID: documentToDelete.documentID }
    });
  } else {
    // delete all the user permissions
    await prisma.userDocumentPermission.deleteMany({
      where: {
        userDocumentPermissionID: {
          in: permissionsForDocument
            // delete permissions associated with calling user
            .filter(
              (udp) => udp.userID === context.user.userID
            )
            .map((udp) => udp.userDocumentPermissionID)
        }
      }
    });
  }
}

const resolvers: Resolvers = {
  Mutation: {
    saveDocumentContent,
    createDocument,
    saveDocumentTitle,
    shareDocument,
    deleteDocumentForUser
  }
};

export default {
  typeDefs,
  resolvers
};
