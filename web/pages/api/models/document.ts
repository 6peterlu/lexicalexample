import { GraphQLError } from 'graphql';
import {
  Prisma,
  Document as pr_Document,
  DocumentVersion as pr_DocumentVersion,
  UserDocumentPermission as pr_UserDocumentPermission,
  UserDocumentAttributes as pr_UserDocumentAttributes,
  User as pr_User
} from '../../../generated/prisma';
import {
  CreateDocumentResponse,
  DocumentMetadata,
  GetDocumentResponse,
  GetDocumentsResponse
} from '../../../generated/types/graphql';
import prisma from '../../../utils/prisma';
import {
  DocumentVersion,
  DocumentVersionDB
} from './documentVersion';
import { UserDB } from './user';
import { UserDocumentAttributesDB } from './userDocumentAttributes';
import {
  UserDocumentPermission,
  UserDocumentPermissionDB
} from './userDocumentPermission';
import { getAllPermissionsFromTypedRoles } from '../../../utils/permissions';

export class Document {
  title: string;
  documentVersions: DocumentVersion[];
  userDocumentPermissions: UserDocumentPermissionDB[];
  userDocumentAttributes: UserDocumentAttributesDB[];

  constructor(arg: {
    title: string;
    documentVersions: DocumentVersion[];
    userDocumentPermissions: UserDocumentPermissionDB[];
    userDocumentAttributes: UserDocumentAttributesDB[];
  }) {
    this.title = arg.title;
    this.documentVersions = arg.documentVersions;
    this.userDocumentPermissions =
      arg.userDocumentPermissions;
    this.userDocumentAttributes =
      arg.userDocumentAttributes;
  }
  toPrismaCreate(): Prisma.DocumentCreateInput {
    return {
      title: this.title,
      documentVersions: {
        create: this.documentVersions.map((dv) =>
          dv.toPrismaCreateInsideDocument()
        )
      }
    };
  }
}

export class DocumentDB extends Document {
  documentID: string;
  updatedAt: Date;
  documentVersions: DocumentVersionDB[];

  constructor(arg: {
    title: string;
    documentVersions: DocumentVersionDB[];
    documentID: string;
    updatedAt: Date;
    userDocumentPermissions: UserDocumentPermissionDB[];
    userDocumentAttributes: UserDocumentAttributesDB[];
  }) {
    super(arg);
    this.documentID = arg.documentID;
    this.updatedAt = arg.updatedAt;
    this.documentVersions = arg.documentVersions;
  }
  toCreateDocumentGraphQLResponse(): CreateDocumentResponse {
    return { documentID: this.documentID };
  }
  static fromPrisma(
    // this typing is insane and if it gets worse we should reconsider how we do types
    doc: pr_Document & {
      documentVersions: (pr_DocumentVersion & {
        userDocumentPermissions: (pr_UserDocumentPermission & {
          user: pr_User;
        })[];
      })[];
      userDocumentPermissions: (pr_UserDocumentPermission & {
        user: pr_User;
      })[];
      userDocumentAttributes: pr_UserDocumentAttributes[];
    }
  ) {
    return new this({
      documentID: doc.documentID,
      title: doc.title,
      updatedAt: doc.updatedAt,
      documentVersions: doc.documentVersions.map((dv) =>
        DocumentVersionDB.fromPrisma(dv)
      ),
      userDocumentPermissions:
        doc.userDocumentPermissions.map((udp) =>
          UserDocumentPermissionDB.fromPrisma(udp)
        ),
      userDocumentAttributes:
        doc.userDocumentAttributes.map((uda) =>
          UserDocumentAttributesDB.fromPrisma(uda)
        )
    });
  }

  // TODO: slim down the required query here, we don't need all of this data
  static async fromDocumentID(
    user: UserDB,
    documentID: string
  ) {
    const documentRecord = await prisma.document.findUnique(
      {
        where: { documentID: documentID },
        include: {
          documentVersions: {
            include: {
              userDocumentPermissions: {
                include: { user: true }
              }
            },
            orderBy: [
              {
                // this ordering mechanism will likely need to be revisited later
                createdAt: 'desc'
              }
            ]
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
      }
    );
    const documentModel =
      DocumentDB.fromPrisma(documentRecord);
    if (documentModel.userHasAccess(user)) {
      return documentModel;
    } else {
      throw new GraphQLError(
        'User does not have access to requested document'
      );
    }
  }

  // TODO: slim down the required query here, we don't need all of this data
  // NOTE: only loads this version name
  static async fromDocumentIDAndVersionName(
    user: UserDB,
    documentID: string,
    versionName?: string
  ) {
    const documentRecord = await prisma.document.findUnique(
      {
        where: { documentID: documentID },
        include: {
          documentVersions: {
            where: {
              // if versionname is undefined, pass null
              versionName: versionName ?? null
            },
            include: {
              userDocumentPermissions: {
                include: { user: true }
              }
            },
            orderBy: [
              {
                createdAt: 'desc'
              }
            ]
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
      }
    );
    const documentModel =
      DocumentDB.fromPrisma(documentRecord);
    if (documentModel.userHasAccess(user)) {
      return documentModel;
    } else {
      throw new GraphQLError(
        'User does not have access to requested document'
      );
    }
  }

  static async fromGetDocumentQuery({
    documentID,
    user
  }: {
    documentID: string;
    user: UserDB;
  }) {
    // NOTE: document content is requested separately.
    const userDocumentPermission =
      await prisma.userDocumentPermission.findFirst({
        where: { documentID, userID: user.userID }
      });
    // only filter document versions if the user has no document level permission
    const documentVersionQueryClause =
      userDocumentPermission
        ? {}
        : {
            where: {
              // get all versions that the user has access to.
              userDocumentPermissions: {
                some: {
                  userID: user.userID
                }
              }
            }
          };
    const documentRecord = await prisma.document.findUnique(
      {
        where: { documentID },
        include: {
          documentVersions: {
            ...documentVersionQueryClause,
            // select non content fields
            // TODO: deselect non important fields.
            select: {
              documentVersionID: true,
              updatedAt: true, // TODO: not needed
              createdAt: true, // TODO: not needed
              content: true, // TODO: not needed
              documentID: true, // TODO: not needed
              versionName: true,
              userDocumentPermissions: {
                include: {
                  user: true
                }
              },
              wordCount: true
            },
            orderBy: [{ createdAt: 'desc' }]
          },
          userDocumentPermissions: {
            include: {
              user: true
            }
          },
          userDocumentAttributes: {
            where: {
              userID: user.userID
            }
          }
        }
      }
    );

    const documentModel =
      DocumentDB.fromPrisma(documentRecord);
    if (documentModel.userHasAccess(user)) {
      return documentModel;
    } else {
      return null;
    }
  }
  toGraphQLGetDocumentResponse(
    user: UserDB
  ): GetDocumentResponse {
    const udpList = this.userDocumentPermissions.map(
      (udp) => udp.toGraphQLMetadata()
    );

    return {
      title: this.title,
      documentVersionMetadataList:
        this.documentVersions.map((dv) =>
          dv.toDocumentVersionMetadata()
        ),
      userDocumentPermissions: udpList,
      documentID: this.documentID,
      actionPermissions: getAllPermissionsFromTypedRoles(
        this.userDocumentPermissions.map((udp) =>
          udp.toTypedRole()
        )
      )
    };
  }
  toGraphQLDocumentMetadata(): DocumentMetadata {
    return {
      documentID: this.documentID,
      title: this.title,
      updatedAt: this.updatedAt,
      userDocumentPermissions:
        this.userDocumentPermissions.map((udp) =>
          udp.toGraphQLMetadata()
        ),
      documentVersions: this.documentVersions.map((dv) =>
        dv.toDocumentVersionMetadata()
      ),
      lastOpenedDocumentVersionID:
        // NOTE: this relies on only one udp being used at a time per document,
        // which is true currently but can change in the future
        this.userDocumentAttributes[0]?.lastOpenedDocumentID
    };
  }
  toPrismaUpdate(): Prisma.DocumentUpdateArgs {
    return {
      where: {
        documentID: this.documentID
      },
      data: {
        title: this.title,
        updatedAt: this.updatedAt
      }
    };
  }

  userHasAccessToDocument(user: UserDB) {
    return this.userDocumentPermissions.some(
      (udp) => udp.userID === user.userID
    );
  }

  // gets all perms on a document object and sees if any contain the desired userID
  userHasAccess(user: UserDB) {
    const allDocumentPermissions = [
      ...this.userDocumentPermissions
    ];
    for (const dv of this.documentVersions) {
      allDocumentPermissions.push(
        ...dv.userDocumentPermissions
      );
    }
    return allDocumentPermissions.some(
      (udp) => udp.userID === user.userID
    );
  }
  userHasAccessToDocumentVersion(
    documentVersionID: string,
    user: UserDB
  ) {
    const documentPermissions =
      this.userDocumentPermissions;
    const documentVersionPerms =
      this.documentVersions.filter(
        (dv) => dv.documentVersionID === documentVersionID
      )[0].userDocumentPermissions;
    documentPermissions.push(...documentVersionPerms);
    return documentPermissions.some(
      (udp) => udp.userID === user.userID
    );
  }

  // gets both document and document version permissions for document
  getAllLoadedPermissions() {
    const allDocumentPermissions = [
      ...this.userDocumentPermissions
    ];
    for (const dv of this.documentVersions) {
      allDocumentPermissions.push(
        ...dv.userDocumentPermissions
      );
    }
    return allDocumentPermissions;
  }
}
