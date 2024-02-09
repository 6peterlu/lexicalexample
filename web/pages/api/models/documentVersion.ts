import { GraphQLError } from 'graphql';
import {
  DocumentVersion as pr_DocumentVersion,
  UserDocumentPermission as pr_UserDocumentPermission,
  User as pr_User,
  Prisma,
  Role
} from '../../../generated/prisma';
import {
  DocumentMetadata as gql_DocumentMetadata,
  DocumentVersionMetadata,
  DocumentVersion as gql_DocumentVersion,
  GetDocumentVersionFromVersionNameRequest
} from '../../../generated/types/graphql';
import prisma from '../../../utils/prisma';
import { DocumentDB } from './document';
import { UserDB } from './user';
import { UserDocumentPermissionDB } from './userDocumentPermission';
import { getAllPermissionsForTypedRole } from '../../../utils/permissions';

export class DocumentVersion {
  content: any;
  userDocumentPermissions: UserDocumentPermissionDB[];
  versionName?: string;
  documentID: string;
  wordCount: number;

  constructor(arg: {
    content: any;
    userDocumentPermissions: UserDocumentPermissionDB[];
    versionName?: string;
    documentID: string;
    wordCount: number;
  }) {
    this.content = arg.content;
    this.userDocumentPermissions =
      arg.userDocumentPermissions;
    this.versionName = arg.versionName;
    this.documentID = arg.documentID;
    this.wordCount = arg.wordCount;
  }

  // during create, we verify that only one userdocumentpermission is present
  toPrismaCreateInsideDocument(): Prisma.DocumentVersionCreateWithoutDocumentInput {
    if (this.userDocumentPermissions.length !== 1) {
      throw new Error(
        'cannot call toPrismaCreate on document with != 1 user document permissions attached.'
      );
    }
    return {
      content: this.content ? this.content : undefined,
      userDocumentPermissions: {
        create:
          this.userDocumentPermissions[0].toPrismaCreate()
      },
      versionName: this.versionName
        ? this.versionName
        : undefined
    };
  }

  toPrismaCreateUnchecked(): Prisma.DocumentVersionUncheckedCreateInput {
    return {
      documentID: this.documentID,
      content: this.content,
      userDocumentPermissions: {
        createMany: {
          data: this.userDocumentPermissions.map((udp) =>
            udp.toPrismaCreate()
          )
        }
      },
      versionName: this.versionName
        ? this.versionName
        : undefined
    };
  }
}

export class DocumentVersionDB extends DocumentVersion {
  documentVersionID: string;
  createdAt: Date;

  constructor(arg: {
    content: any;
    documentVersionID: string;
    userDocumentPermissions: UserDocumentPermissionDB[];
    createdAt: Date;
    versionName: string;
    documentID: string;
    wordCount: number;
  }) {
    super(arg);
    this.documentVersionID = arg.documentVersionID;
    this.createdAt = arg.createdAt;
  }

  // TODO: this is not a complete way of checking access, we need to check the document too
  userHasAccess(user: UserDB): boolean {
    return this.userDocumentPermissions.some(
      (udp) => udp.userID === user.userID
    );
  }
  userCanShare(user: UserDB): boolean {
    return this.userDocumentPermissions.some(
      (udp) =>
        udp.userID === user.userID &&
        udp.role === Role.ADMIN
    );
  }

  static fromPrisma(
    documentVersion: pr_DocumentVersion & {
      userDocumentPermissions: (pr_UserDocumentPermission & {
        user: pr_User;
      })[];
    }
  ) {
    return new this({
      content: documentVersion.content
        ? documentVersion.content
        : undefined,
      documentVersionID: documentVersion.documentVersionID,
      userDocumentPermissions:
        documentVersion.userDocumentPermissions.map((ud) =>
          UserDocumentPermissionDB.fromPrisma(ud)
        ),
      createdAt: documentVersion.createdAt,
      versionName: documentVersion.versionName,
      documentID: documentVersion.documentID,
      wordCount: documentVersion.wordCount
    });
  }

  static async uncheckedFromDocumentVersionID(
    documentVersionID: string
  ) {
    const documentVersionRecord =
      await prisma.documentVersion.findUnique({
        where: { documentVersionID: documentVersionID },
        include: {
          userDocumentPermissions: {
            include: { user: true }
          }
        }
      });
    return this.fromPrisma(documentVersionRecord);
  }

  // TODO: this perms checking logic is horrendous
  static async fromDocumentVersionID(
    documentVersionID: string,
    user: UserDB
  ) {
    const documentVersionRecord =
      await prisma.documentVersion.findUnique({
        where: { documentVersionID: documentVersionID },
        include: {
          userDocumentPermissions: {
            include: { user: true }
          },
          comments: { include: { author: true } }
        }
      });
    const documentRecord = await DocumentDB.fromDocumentID(
      user,
      documentVersionRecord.documentID
    );
    const documentVersionModel = this.fromPrisma(
      documentVersionRecord
    );
    if (
      documentVersionModel.userHasAccess(user) ||
      documentRecord.userHasAccess(user)
    ) {
      return documentVersionModel;
    } else {
      throw new GraphQLError(
        'fromDocumentVersionID: User does not have access to requested document version'
      );
    }
  }
  static async fromDocumentIDAndVersionName({
    query,
    user,
    getAllPermissions = false
  }: {
    query: GetDocumentVersionFromVersionNameRequest;
    user: UserDB;
    getAllPermissions?: boolean;
  }) {
    const documentVersionRecord =
      await prisma.documentVersion.findFirst({
        where: {
          documentID: query.documentID,
          versionName: query.versionName
            ? query.versionName
            : null
        },
        include: {
          userDocumentPermissions: {
            include: { user: true }
          },
          comments: { include: { author: true } }
        }
      });
    if (!documentVersionRecord) {
      return null;
    }
    const documentVersionModel = this.fromPrisma(
      documentVersionRecord
    );
    let userDocumentPermissions: UserDocumentPermissionDB[] =
      [];
    if (getAllPermissions) {
      userDocumentPermissions =
        await UserDocumentPermissionDB.fromDocumentVersionWithoutUser(
          documentVersionModel
        );
    } else {
      userDocumentPermissions =
        await UserDocumentPermissionDB.fromDocumentVersion({
          documentVersion: documentVersionModel,
          user: user
        });
    }

    documentVersionModel.userDocumentPermissions =
      userDocumentPermissions;
    const documentModel = await DocumentDB.fromDocumentID(
      user,
      documentVersionModel.documentID
    );

    if (
      documentModel.userHasAccessToDocumentVersion(
        documentVersionRecord.documentVersionID,
        user
      )
    ) {
      return documentVersionModel;
    } else {
      throw new GraphQLError(
        'fromDocumentIDAndVersionName: User does not have access to requested document version'
      );
    }
  }
  static async fromDualIDs({
    query,
    user
  }: {
    query: {
      documentID: string;
      documentVersionID: string;
    };
    user: UserDB;
  }) {
    const documentVersionRecord =
      await prisma.documentVersion.findFirst({
        where: {
          documentID: query.documentID,
          documentVersionID: query.documentVersionID
            ? query.documentVersionID
            : null
        },
        include: {
          userDocumentPermissions: {
            include: { user: true }
          },
          comments: { include: { author: true } }
        }
      });
    if (!documentVersionRecord) {
      return null;
    }
    const documentVersionModel = this.fromPrisma(
      documentVersionRecord
    );
    if (documentVersionModel.userHasAccess(user)) {
      return documentVersionModel;
    } else {
      throw new GraphQLError(
        'User does not have access to requested document version'
      );
    }
  }
  toPrismaUpdate(): Prisma.DocumentVersionUpdateArgs {
    return {
      where: { documentVersionID: this.documentVersionID },
      data: {
        content: this.content ? this.content : undefined,
        wordCount: this.wordCount
      }
    };
  }
  toDocumentVersionMetadata(): DocumentVersionMetadata {
    return {
      createdAt: this.createdAt,
      versionName: this.versionName,
      documentVersionID: this.documentVersionID
    };
  }
  toGraphQL(user: UserDB): gql_DocumentVersion {
    return {
      content: JSON.stringify(this.content),
      documentVersionID: this.documentVersionID,
      versionName: this.versionName,
      userDocumentPermissions:
        this.userDocumentPermissions.map((udp) =>
          udp.toGraphQLMetadata()
        ),
      actionPermissions: [
        ...new Set(
          this.userDocumentPermissions.flatMap((udp) =>
            getAllPermissionsForTypedRole(udp.toTypedRole())
          )
        )
      ]
    };
  }
  userDocumentPermissionIsValid(
    udp: UserDocumentPermissionDB
  ) {
    if (udp.documentVersionID) {
      return (
        udp.documentVersionID === this.documentVersionID
      );
    } else {
      return udp.documentID === this.documentID;
    }
  }
  async clone({ newName }: { newName: string }) {
    const existingNameDVCount =
      await prisma.documentVersion.count({
        where: {
          documentID: this.documentID,
          versionName: newName
        }
      });
    if (existingNameDVCount > 0) {
      throw new Error(
        'DocumentVersion.clone: cannot reuse name'
      );
    }
    const dvToCreate = new DocumentVersion({
      versionName: newName,
      userDocumentPermissions: [],
      content: this.content,
      documentID: this.documentID,
      wordCount: this.wordCount
    });
    const prRecord = await prisma.documentVersion.create({
      data: dvToCreate.toPrismaCreateUnchecked(),
      include: {
        userDocumentPermissions: { include: { user: true } }
      }
    });
    return DocumentVersionDB.fromPrisma(prRecord);
  }
}
