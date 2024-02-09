import {
  gql,
  Resolvers,
  TypedDocumentNode
} from '@apollo/client';
import { GraphQLError } from 'graphql';
import { Role } from '../../../../generated/prisma';
import {
  ActionPermission,
  CreateDocumentVersionRequest,
  DeleteDocumentVersionRequest,
  DocumentVersionMetadata as gql_DocumentVersionMetadata,
  PublishDocumentVersionRequest,
  RemoveUserFromDocumentVersionRequest,
  RenameDocumentVersionRequest,
  ShareDocumentVersionRequest,
  ShareDocumentVersionResponse
} from '../../../../generated/types/graphql';
import { DocumentVersionMetadata } from '../../../../models/document';
import {
  getAllPermissionsForTypedRole,
  getAllPermissionsFromTypedRoles,
  hasPermission,
  listHasPermission,
  PermissionRole,
  RoleType
} from '../../../../utils/permissions';
import prisma from '../../../../utils/prisma';
import { DocumentDB } from '../../models/document';
import {
  DocumentVersion,
  DocumentVersionDB
} from '../../models/documentVersion';
import { UserDB } from '../../models/user';
import {
  UserDocumentPermission,
  UserDocumentPermissionDB
} from '../../models/userDocumentPermission';
import {
  canRemoveRole,
  canShareDocumentVersion
} from '../../utils/permissions';

// Editable role used for any role modification graphql requests
// Role used to read role data back to client
const typeDefs: TypedDocumentNode = gql`
  enum EditableRole {
    ADMIN
    EDITOR
    LEAD_REVIEWER
    REVIEWER
  }
  enum Role {
    OWNER
    ADMIN
    EDITOR
    LEAD_REVIEWER
    REVIEWER
  }
  input CreateDocumentVersionRequest {
    versionName: String!
    sourceDocumentVersionID: String!
  }
  type DocumentVersionMetadata {
    createdAt: DateTime!
    versionName: String
    documentVersionID: String!
  }
  input ShareDocumentVersionRequest {
    documentID: String!
    versionName: String
    username: String!
    role: EditableRole!
  }
  type ShareDocumentVersionResponse {
    userDocumentPermission: UserDocumentPermissionMetadata!
  }
  input RemoveUserFromDocumentVersionRequest {
    userID: String!
    documentVersionID: String!
  }
  input DeleteDocumentVersionRequest {
    documentVersionID: String!
  }
  input RenameDocumentVersionRequest {
    documentVersionID: String!
    versionName: String!
  }
  input PublishDocumentVersionRequest {
    documentVersionID: String!
    title: String!
    subtitle: String
    url: String!
    content: String
  }
  extend type Mutation {
    createDocumentVersion(
      request: CreateDocumentVersionRequest!
    ): DocumentVersionMetadata!
    shareDocumentVersion(
      request: ShareDocumentVersionRequest!
    ): ShareDocumentVersionResponse!
    unshareDocumentVersion(
      request: RemoveUserFromDocumentVersionRequest!
    ): Void
    deleteDocumentVersion(
      request: DeleteDocumentVersionRequest!
    ): Void
    renameDocumentVersion(
      request: RenameDocumentVersionRequest!
    ): Void
    publishDocumentVersion(
      request: PublishDocumentVersionRequest!
    ): Void
  }
`;

async function createDocumentVersion(
  _parent: any,
  { request }: { request: CreateDocumentVersionRequest },
  context: any
): Promise<gql_DocumentVersionMetadata> {
  if (!request.versionName) {
    throw new Error(
      'createDocumentVersion: version name cannot be empty'
    );
  }
  const documentVersionToClone =
    await DocumentVersionDB.fromDocumentVersionID(
      request.sourceDocumentVersionID,
      context.user
    );
  if (!documentVersionToClone) {
    throw new GraphQLError(
      'createDocumentVersion: User not authorized to access source document version'
    );
  }
  const createdDocumentVersion =
    await documentVersionToClone.clone({
      newName: request.versionName
    });
  return createdDocumentVersion.toDocumentVersionMetadata();
}

async function shareDocumentVersion(
  _parent: any,
  { request }: { request: ShareDocumentVersionRequest },
  context: any
): Promise<ShareDocumentVersionResponse> {
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
    throw new GraphQLError(
      'Document version share unauthorized'
    );
  }
  const documentVersion =
    await DocumentVersionDB.fromDocumentIDAndVersionName({
      query: {
        documentID: request.documentID,
        versionName: request.versionName
      },
      user: context.user
    });

  const userToShare = await UserDB.fromUsername(
    request.username
  );
  const userDocumentPermission =
    UserDocumentPermission.fromDocumentVersionAndRole({
      documentVersion,
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

// TODO: duplicate for unshare document
async function unshareDocumentVersion(
  _parent: any,
  {
    request
  }: { request: RemoveUserFromDocumentVersionRequest },
  context: { user: UserDB }
) {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }

  const documentVersion =
    await DocumentVersionDB.fromDocumentVersionID(
      request.documentVersionID,
      context.user
    );

  const userDocumentPermissionToRemove =
    UserDocumentPermissionDB.fromPrisma(
      await prisma.userDocumentPermission.findFirstOrThrow({
        where: {
          userID: request.userID,
          documentVersionID: request.documentVersionID
        },
        include: { user: true }
      })
    );
  const userDocumentPermissions =
    await UserDocumentPermissionDB.fromDocumentVersion({
      documentVersion,
      user: context.user
    });
  if (
    getAllPermissionsFromTypedRoles(
      userDocumentPermissions.map((udp) =>
        udp.toTypedRole()
      )
    ).includes(
      ActionPermission.RemoveCollaboratorFromDocumentVersion
    )
  ) {
    await prisma.userDocumentPermission.delete(
      userDocumentPermissionToRemove.toPrismaDelete()
    );
  } else {
    throw new GraphQLError(
      `User with id ${context.user.userID} cannot remove collaborator from document version with id ${request.userID}`
    );
  }
}

async function deleteDocumentVersion(
  _parent: any,
  { request }: { request: DeleteDocumentVersionRequest },
  context: { user: UserDB }
) {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }

  const documentVersion =
    await DocumentVersionDB.uncheckedFromDocumentVersionID(
      request.documentVersionID
    );
  const userDocumentPermissions =
    await UserDocumentPermissionDB.fromDocumentVersion({
      documentVersion,
      user: context.user
    });
  const permissions = getAllPermissionsFromTypedRoles(
    userDocumentPermissions.map((udp) => udp.toTypedRole())
  );
  if (
    permissions.includes(
      ActionPermission.DeleteDocumentVersionForAll
    )
  ) {
    // delete document version for all
    await prisma.documentVersion.delete({
      where: {
        documentVersionID: request.documentVersionID
      }
    });
  } else {
    // delete only self permission
    await prisma.userDocumentPermission.deleteMany({
      where: {
        userID: context.user.userID,
        documentVersionID: request.documentVersionID
      }
    });
  }
}

async function renameDocumentVersion(
  _parent: any,
  { request }: { request: RenameDocumentVersionRequest },
  { user }: { user: UserDB }
) {
  const documentVersion =
    await DocumentVersionDB.fromDocumentVersionID(
      request.documentVersionID,
      user
    );
  const userDocumentPermissions =
    await UserDocumentPermissionDB.fromDocumentVersion({
      documentVersion,
      user
    });
  if (
    listHasPermission(
      userDocumentPermissions.map((udp) =>
        udp.toTypedRole()
      ),
      ActionPermission.RenameDocumentVersion
    )
  ) {
    await prisma.documentVersion.update({
      where: {
        documentVersionID: documentVersion.documentVersionID
      },
      data: { versionName: request.versionName }
    });
  } else {
    throw new GraphQLError(
      'renameDocumentVersion: user does not have access'
    );
  }
}

async function publishDocumentVersion(
  _parent: any,
  { request }: { request: PublishDocumentVersionRequest },
  { user }: { user: UserDB }
) {
  const documentVersion =
    await DocumentVersionDB.fromDocumentVersionID(
      request.documentVersionID,
      user
    );
  const userDocumentPermissions =
    await UserDocumentPermissionDB.fromDocumentVersion({
      documentVersion,
      user
    });
  if (
    listHasPermission(
      userDocumentPermissions.map((udp) =>
        udp.toTypedRole()
      ),
      ActionPermission.PublishDocumentVersion
    )
  ) {
    await prisma.publishedDocument.upsert({
      where: {
        documentID_userID: {
          documentID: documentVersion.documentID,
          userID: user.userID
        }
      },
      update: {
        title: request.title,
        url: request.url,
        content: request.content
          ? JSON.parse(request.content)
          : undefined,
        subtitle: request.subtitle
      },
      create: {
        documentID: documentVersion.documentID,
        userID: user.userID,
        title: request.title,
        url: request.url,
        content: request.content
          ? JSON.parse(request.content)
          : undefined,
        subtitle: request.subtitle
      }
    });
  }
}

const resolvers: Resolvers = {
  Mutation: {
    createDocumentVersion,
    shareDocumentVersion,
    unshareDocumentVersion,
    deleteDocumentVersion,
    renameDocumentVersion,
    publishDocumentVersion
  }
};

export default { typeDefs, resolvers };
