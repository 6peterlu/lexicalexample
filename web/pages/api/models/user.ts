import { GraphQLError } from 'graphql';
import { v4 } from 'uuid';
import {
  Prisma,
  Role,
  User as pr_User
} from '../../../generated/prisma';
import {
  User as gql_User,
  UserProfileData as gql_UserProfileData,
  UserDocumentPermissionMetadata as gql_UserDocumentPermissionMetadata,
  Role as gql_Role,
  UpdateBasicUserInfoRequest
} from '../../../generated/types/graphql';
import prisma from '../../../utils/prisma';
import {
  validateName,
  validateUsername
} from '../../../utils/string';
import { generateTitle } from '../utils/string';
import { DocumentDB } from './document';
import { DocumentVersionDB } from './documentVersion';
import { UserDocumentPermissionDB } from './userDocumentPermission';
import { generateDocumentVersionInitialEditorState } from '../../../utils/lexical';

export class User {
  appDrawerNoteIDs?: string[];
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  bio?: string;
  website?: string;
  city?: string;
  country?: string;
  twitter?: string;
  instagram?: string;

  constructor(arg: {
    appDrawerNoteIDs?: string[];
    username?: string;
    firstName?: string;
    lastName?: string;
    email?: string;
    bio?: string;
    website?: string;
    city?: string;
    country?: string;
    twitter?: string;
    instagram?: string;
  }) {
    this.appDrawerNoteIDs = arg.appDrawerNoteIDs;
    this.username = arg.username;
    this.firstName = arg.firstName;
    this.lastName = arg.lastName;
    this.email = arg.email;
    this.bio = arg.bio;
    this.website = arg.website;
    this.city = arg.city;
    this.country = arg.country;
    this.twitter = arg.twitter;
    this.instagram = arg.instagram;
  }
  toPrismaCreate(): Prisma.UserCreateArgs {
    return {
      data: {
        username: this.username,
        email: this.email
      }
    };
  }
}

export class UserMetadataDB {
  userID: string;
  username: string;
  role: Role | undefined;
  userDocumentPermissionID: string;
  constructor(arg: {
    userID: string;
    username: string;
    role?: Role;
    userDocumentPermissionID: string;
  }) {
    this.userID = arg.userID;
    this.username = arg.username;
    this.role = arg.role;
    this.userDocumentPermissionID =
      arg.userDocumentPermissionID;
  }
  toGraphQL(): gql_UserDocumentPermissionMetadata {
    return {
      userID: this.userID,
      username: this.username,
      role: this.role as gql_Role,
      userDocumentPermissionID:
        this.userDocumentPermissionID
    };
  }
  static async fromUserIDList(
    uds: UserDocumentPermissionDB[]
  ): Promise<UserMetadataDB[]> {
    const userList = await prisma.user.findMany({
      where: { userID: { in: uds.map((ud) => ud.userID) } }
    });
    const userMetadataList: UserMetadataDB[] = [];
    userList.forEach((u, idx) => {
      const userMetadataObj = new this({
        userID: u.userID,
        username: u.username,
        role: uds[idx].role,
        userDocumentPermissionID:
          uds[idx].userDocumentPermissionID
      });
      userMetadataList.push(userMetadataObj);
    });
    return userMetadataList;
  }
}

export class UserDB extends User {
  userID: string;
  createdAt?: Date;
  constructor(arg: {
    userID: string;
    email?: string;
    appDrawerNoteIDs?: string[];
    username?: string;
    firstName?: string;
    lastName?: string;
    bio?: string;
    website?: string;
    city?: string;
    country?: string;
    twitter?: string;
    instagram?: string;
    createdAt?: Date;
  }) {
    super(arg);
    this.userID = arg.userID;
    this.createdAt = arg.createdAt;
  }
  static fromPrisma(user: pr_User) {
    return new this({
      userID: user.userID,
      appDrawerNoteIDs: user.appDrawerNoteIDs,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      bio: user.bio,
      website: user.website,
      city: user.city,
      country: user.country,
      twitter: user.twitter,
      instagram: user.instagram,
      createdAt: user.createdAt
    });
  }

  async getPermissionForDocumentVersion(
    documentVersion: DocumentVersionDB
  ): Promise<UserDocumentPermissionDB> {
    const ud =
      await prisma.userDocumentPermission.findFirst({
        where: {
          userID: this.userID,
          documentVersionID:
            documentVersion.documentVersionID
        },
        include: { user: true }
      });
    return UserDocumentPermissionDB.fromPrisma(ud);
  }

  async getDocuments(): Promise<DocumentDB[]> {
    const documents = await prisma.document.findMany({
      where: {
        userDocumentPermissions: {
          some: {
            userID: { equals: this.userID },
            role: Role.OWNER
          }
        }
      },
      include: {
        documentVersions: {
          include: {
            userDocumentPermissions: {
              include: {
                user: true
              }
            }
          }
        },
        userDocumentPermissions: {
          include: {
            user: true
          }
        },
        userDocumentAttributes: {
          where: {
            userID: this.userID
          }
        }
      },
      orderBy: {
        updatedAt: 'desc'
      }
    });
    const documentModels = documents.map((d) =>
      DocumentDB.fromPrisma(d)
    );
    return documentModels;
  }

  /**
   * Get the documents where you're not admin.
   * This includes documents where you are admin on a version but not the whole document
   * @returns
   */
  async getSharedDocuments(): Promise<DocumentDB[]> {
    const sharedOnAllVersionsDocuments =
      await prisma.document.findMany({
        where: {
          userDocumentPermissions: {
            none: {
              userID: { equals: this.userID },
              role: Role.OWNER
            },
            some: { userID: { equals: this.userID } }
          }
        },
        include: {
          // include all document versions if user has document level perms
          documentVersions: {
            include: {
              userDocumentPermissions: {
                include: {
                  user: true
                }
              }
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
              userID: this.userID
            }
          }
        }
      });
    const sharedOnCertainVersionsDocuments =
      await prisma.document.findMany({
        where: {
          // user not shared on document AND user shared on at least one DV
          AND: [
            {
              userDocumentPermissions: {
                none: {
                  userID: { equals: this.userID }
                }
              }
            },
            {
              documentVersions: {
                some: {
                  userDocumentPermissions: {
                    some: {
                      userID: { equals: this.userID }
                    }
                  }
                }
              }
            }
          ]
        },
        include: {
          // include only dvs the user has access to
          documentVersions: {
            where: {
              userDocumentPermissions: {
                some: {
                  userID: { equals: this.userID }
                }
              }
            },
            include: {
              userDocumentPermissions: {
                include: {
                  user: true
                }
              }
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
              userID: this.userID
            }
          }
        }
      });

    const allDocuments = [
      ...sharedOnAllVersionsDocuments,
      ...sharedOnCertainVersionsDocuments
    ]
      .map((d) => DocumentDB.fromPrisma(d))
      // sort in reverse date order
      .sort(
        (a, b) =>
          // valueOf() required to make TS happy:
          // https://stackoverflow.com/questions/36560806/the-left-hand-side-of-an-arithmetic-operation-must-be-of-type-any-number-or
          b.updatedAt.valueOf() - a.updatedAt.valueOf()
      );

    return allDocuments;
  }

  createDocumentWithGeneratedTitle(): Prisma.DocumentCreateInput {
    // create new document with document version and generated title
    const documentVersionUUID = v4();
    return {
      title: generateTitle(),
      documentVersions: {
        create: {
          content:
            generateDocumentVersionInitialEditorState(),
          versionName: 'draft zero',
          documentVersionID: documentVersionUUID
        }
      },
      userDocumentPermissions: {
        create: {
          role: Role.OWNER,
          userID: this.userID
        }
      },
      userDocumentAttributes: {
        create: {
          userID: this.userID,
          lastOpenedDocumentVersionID: documentVersionUUID
        }
      }
    };
  }

  updateBasicUserInfo(request: UpdateBasicUserInfoRequest) {
    const { firstName, lastName, username } = request;
    if (!this.username) {
      // username is not set, request must include username and first name
      if (!username || !firstName) {
        throw new GraphQLError(
          `updateBasicUserInfo: username and first name must be supplied.`
        );
      }
    }
    if (
      !validateName(firstName) ||
      (lastName && !validateName(lastName))
    ) {
      throw new GraphQLError(
        `updateUsername: invalid first or last name supplied. Check VALID_NAME_REGEX for rules.`
      );
    }
    if (!validateUsername(username)) {
      throw new GraphQLError(
        `updateUsername: invalid username ${username} supplied. Check VALID_USERNAME_REGEX for rules.`
      );
    }
    return {
      where: {
        userID: this.userID
      },
      data: {
        firstName,
        lastName,
        username
      }
    };
  }

  toGraphQL(): gql_User {
    return {
      userID: this.userID,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName
    };
  }

  async toGraphQLProfileData(
    requestingUser?: UserDB
  ): Promise<gql_UserProfileData> {
    const followingCount = await prisma.follows.count({
      where: {
        followerID: this.userID
      }
    });
    const followerCount = await prisma.follows.count({
      where: {
        followingID: this.userID
      }
    });
    let isFollowing = false;
    if (requestingUser) {
      const followingRecordCount =
        await prisma.follows.count({
          where: {
            followerID: requestingUser.userID,
            followingID: this.userID
          }
        });
      isFollowing = followingRecordCount > 0;
    }
    return {
      userID: this.userID,
      username: this.username,
      firstName: this.firstName,
      lastName: this.lastName,
      following: isFollowing,
      followingCount,
      followerCount,
      city: this.city,
      country: this.country,
      bio: this.bio,
      website: this.website,
      twitter: this.twitter,
      instagram: this.instagram,
      createdAt: this.createdAt
    };
  }
  static fromGraphQL(user: gql_User): UserDB {
    return new this({ userID: user.userID });
  }
  static async fromUsername(
    username: string
  ): Promise<UserDB> {
    const userRecord = await prisma.user.findUniqueOrThrow({
      where: { username }
    });
    return UserDB.fromPrisma(userRecord);
  }
  static async fromUserID(userID: string): Promise<UserDB> {
    const userRecord = await prisma.user.findUnique({
      where: { userID }
    });
    return UserDB.fromPrisma(userRecord);
  }
}
