import {
  Prisma,
  Role,
  UserDocumentPermission as pr_UserDocumentPermission,
  User as pr_User
} from '../../../generated/prisma';
import {
  CreateCommentRequest,
  InviteUserToDocumentRequest,
  UserDocumentPermission as gql_UserDocumentPermission,
  UserDocumentPermissionMetadata as gql_UserDocumentPermissionMetadata,
  Role as gql_Role
} from '../../../generated/types/graphql';
import prisma from '../../../utils/prisma';
import { CommentDB } from './comment';
import { DocumentVersionDB } from './documentVersion';
import { UserDB } from './user';
import * as t from 'io-ts';
import { DocumentDB } from './document';
import {
  RoleType,
  TypedRole
} from '../../../utils/permissions';
import { GraphQLError } from 'graphql';

const SEE_ALL_PUBLIC_COMMENTS: Role[] = [
  Role.OWNER,
  Role.ADMIN,
  Role.EDITOR,
  Role.LEAD_REVIEWER
];

// this utility function can be used to turn a TypeScript enum into a io-ts codec.
// copied from https://github.com/gcanti/io-ts/issues/216#issuecomment-599020040
export function fromEnum<EnumType extends string>(
  enumName: string,
  theEnum: Record<string, EnumType>
): t.Type<EnumType, EnumType, unknown> {
  const isEnumValue = (input: unknown): input is EnumType =>
    Object.values<unknown>(theEnum).includes(input);

  return new t.Type<EnumType>(
    enumName,
    isEnumValue,
    (input, context) =>
      isEnumValue(input)
        ? t.success(input)
        : t.failure(input, context),
    t.identity
  );
}

const RoleTypeV = fromEnum('Role', Role);

function createRoleEnumFromString(input: string): Role {
  if (RoleTypeV.is(input)) {
    return Role[input];
  }
  throw new Error(
    'Invalid string provided to createRoleEnumFromString'
  );
}

export class UserDocumentPermission {
  // only one of these two fields will be not null for any given object
  documentVersionID?: string;
  documentID?: string;
  userID: string;
  role: Role;
  username?: string;

  constructor(arg: {
    role: Role;
    userID: string;
    documentVersionID?: string;
    documentID?: string;
    username?: string;
  }) {
    this.userID = arg.userID;
    this.role = arg.role;
    this.documentVersionID = arg.documentVersionID;
    this.documentID = arg.documentID;
    this.username = arg.username;
  }

  // used for sharing
  static fromDocumentVersionAndRole({
    documentVersion,
    user,
    role
  }: {
    documentVersion: DocumentVersionDB;
    user: UserDB;
    role: Role;
  }) {
    // TODO: make this a database level constraint
    if (documentVersion.userHasAccess(user)) {
      throw new GraphQLError('User already has access');
    }
    return new this({
      role,
      userID: user.userID,
      username: user.username,
      documentVersionID: documentVersion.documentVersionID
    });
  }

  // used for sharing
  static fromDocument({
    document,
    user,
    role
  }: {
    document: DocumentDB;
    user: UserDB;
    role: Role;
  }) {
    // TODO: make this a database level constraint
    if (document.userHasAccessToDocument(user)) {
      throw new GraphQLError('User already has access');
    }
    return new this({
      role,
      userID: user.userID,
      username: user.username,
      documentID: document.documentID
    });
  }

  static fromGraphQL(
    request: InviteUserToDocumentRequest,
    user: UserDB
  ) {
    return new this({
      userID: user.userID,
      documentVersionID: request.documentVersionID,
      role: createRoleEnumFromString(request.role)
    });
  }
  toPrismaCreate(): Prisma.UserDocumentPermissionUncheckedCreateInput {
    return {
      userID: this.userID,
      documentVersionID: this.documentVersionID,
      documentID: this.documentID,
      role: this.role
    };
  }
}

// UserDocumentPermission has no non DB class because no indexes are generated
// on DB insert
export class UserDocumentPermissionDB extends UserDocumentPermission {
  userDocumentPermissionID: string;

  constructor(arg: {
    role: Role;
    userID: string;
    documentVersionID?: string;
    documentID?: string;
    username?: string;
    userDocumentPermissionID: string;
  }) {
    super(arg);
    this.userDocumentPermissionID =
      arg.userDocumentPermissionID;
  }
  toPrismaDelete(): Prisma.UserDocumentPermissionDeleteArgs {
    return {
      where: {
        userDocumentPermissionID:
          this.userDocumentPermissionID
      }
    };
  }

  // TODO: update to make permissioning real
  createComment(arg: {
    document: DocumentVersionDB;
    request: CreateCommentRequest;
  }): Prisma.CommentCreateArgs {
    if (
      arg.document.documentVersionID !==
        this.documentVersionID &&
      arg.document.documentID !== this.documentID
    ) {
      throw new GraphQLError(
        'Not authorized to create comments on this document.'
      );
    }
    const commentDataJSON = JSON.parse(
      arg.request.commentData
    );

    // TODO: validate on input to avoid malformed DB entries
    // if (!validateCommentData(commentDataJSON)) {
    //   throw new Error('Comment is of invalid format.');
    // }
    return {
      data: {
        commentData: commentDataJSON,
        authorID: this.userID,
        documentVersionID: arg.document.documentVersionID,
        private: false,
        selectedText: arg.request.selectedText
      },
      include: {
        author: true
      }
    };
  }
  toGraphQL(): gql_UserDocumentPermission {
    return {
      userID: this.userID,
      documentVersionID: this.documentVersionID,
      role: this.role
    };
  }
  toGraphQLMetadata(): gql_UserDocumentPermissionMetadata {
    return {
      role: this.role as gql_Role,
      userID: this.userID,
      username: this.username,
      userDocumentPermissionID:
        this.userDocumentPermissionID,
      documentID: this.documentID,
      documentVersionID: this.documentVersionID
    };
  }
  static fromPrisma(
    ud: pr_UserDocumentPermission & { user: pr_User }
  ) {
    return new this({
      role: ud.role,
      documentVersionID: ud.documentVersionID,
      documentID: ud.documentID,
      userID: ud.userID,
      username: ud.user.username,
      userDocumentPermissionID: ud.userDocumentPermissionID
    });
  }
  static fromPrismaAndUser(
    ud: pr_UserDocumentPermission,
    user: UserDB
  ) {
    return new this({
      role: ud.role,
      documentVersionID: ud.documentVersionID,
      documentID: ud.documentID,
      userID: ud.userID,
      username: user.username,
      userDocumentPermissionID: ud.userDocumentPermissionID
    });
  }

  static async fromUserDocumentPermissionID(
    id: string,
    user: UserDB
  ) {
    const userDocumentPermissionPrismaRecord =
      await prisma.userDocumentPermission.findUnique({
        where: { userDocumentPermissionID: id }
      });
    if (
      userDocumentPermissionPrismaRecord.userID !==
      user.userID
    ) {
      throw new GraphQLError(
        'Permission ID/User mismatch. Permission provided is invalid.'
      );
    }
    return this.fromPrismaAndUser(
      userDocumentPermissionPrismaRecord,
      user
    );
  }

  static async fromDocumentVersionWithoutUser(
    documentVersion: DocumentVersionDB
  ) {
    const udpRecords =
      await prisma.userDocumentPermission.findMany({
        where: {
          OR: [
            {
              documentID: documentVersion.documentID
            },
            {
              documentVersionID:
                documentVersion.documentVersionID
            }
          ]
        },
        include: {
          user: true
        }
      });
    return udpRecords.map((udp) =>
      UserDocumentPermissionDB.fromPrisma(udp)
    );
  }

  static async fromDocumentVersion({
    documentVersion,
    user
  }: {
    documentVersion: DocumentVersionDB;
    user: UserDB;
  }): Promise<UserDocumentPermissionDB[]> {
    const udpRecords =
      await prisma.userDocumentPermission.findMany({
        where: {
          userID: user.userID,
          OR: [
            {
              documentID: documentVersion.documentID
            },
            {
              documentVersionID:
                documentVersion.documentVersionID
            }
          ]
        }
      });
    return udpRecords.map((udp) =>
      UserDocumentPermissionDB.fromPrismaAndUser(udp, user)
    );
  }

  // check if a particular udp can view a comment
  async canViewComment(arg: { comment: CommentDB }) {
    if (arg.comment.authorID === this.userID) {
      // users should always be allowed to view comments they authored
      return true;
    }
    if (
      SEE_ALL_PUBLIC_COMMENTS.includes(this.role) &&
      !arg.comment.private
    ) {
      // if users can see all public comments, and the comment is public, they can view
      return true;
    }
    return false;
  }

  async getCommentsFromDocument(arg: {
    document: DocumentVersionDB;
  }): Promise<CommentDB[]> {
    const comments: CommentDB[] = [];
    const canSeeAllPublicComments =
      SEE_ALL_PUBLIC_COMMENTS.includes(this.role);
    if (canSeeAllPublicComments) {
      const publicComments = await prisma.comment.findMany({
        where: {
          documentVersionID: arg.document.documentVersionID,
          private: false
        },
        include: { author: true }
      });
      comments.push(
        ...publicComments.map((pc) =>
          CommentDB.fromPrisma(pc)
        )
      );
    } else {
      const selfWrittenComments =
        await prisma.comment.findMany({
          where: {
            documentVersionID:
              arg.document.documentVersionID,
            private: false,
            authorID: this.userID
          },
          include: { author: true }
        });
      comments.push(
        ...selfWrittenComments.map((pc) =>
          CommentDB.fromPrisma(pc)
        )
      );
    }
    const selfWrittenPrivateComments =
      await prisma.comment.findMany({
        where: {
          documentVersionID: arg.document.documentVersionID,
          private: true,
          authorID: this.userID
        },
        include: { author: true }
      });
    comments.push(
      ...selfWrittenPrivateComments.map((pc) =>
        CommentDB.fromPrisma(pc)
      )
    );
    return comments;
  }

  toTypedRole(): TypedRole {
    if (this.documentID) {
      return {
        roleType: RoleType.Document,
        role: this.role
      };
    } else {
      return {
        roleType: RoleType.DocumentVersion,
        role: this.role
      };
    }
  }
}
