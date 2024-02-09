import { PublishedDocument as pr_PublishedDocument } from '../../../generated/prisma';
import prisma from '../../../utils/prisma';
import {
  PublishedDocumentVersion as gql_PublishedDocumentVersion,
  PublishedDocumentVersionMetadata as gql_PublishedDocumentVersionMetadata
} from '../../../generated/types/graphql';
import { UserDB } from './user';

export class PublishedDocument {
  userID: string;
  content: string; // stored as string since we never parse it on the backend
  title: string;
  documentID: string;
  url: string;
  subtitle: string;
  likingUsers: string[];

  constructor({
    userID,
    content,
    title,
    documentID,
    url,
    subtitle,
    likingUsers
  }: {
    userID: string;
    content: string;
    title: string;
    documentID: string;
    url: string;
    subtitle: string;
    likingUsers: string[];
  }) {
    this.userID = userID;
    this.content = content;
    this.title = title;
    this.documentID = documentID;
    this.url = url;
    this.subtitle = subtitle;
    this.likingUsers = likingUsers;
  }
}

export class PublishedDocumentDB extends PublishedDocument {
  publishedAt: Date;
  updatedAt: Date;
  publishedDocumentID: string;

  constructor({
    userID,
    content,
    title,
    publishedAt,
    updatedAt,
    documentID,
    url,
    subtitle,
    likingUsers,
    publishedDocumentID
  }: {
    userID: string;
    content: string;
    title: string;
    publishedAt: Date;
    updatedAt: Date;
    documentID: string;
    url: string;
    subtitle: string;
    likingUsers: string[];
    publishedDocumentID: string;
  }) {
    super({
      userID,
      content,
      title,
      documentID,
      url,
      subtitle,
      likingUsers
    });
    this.publishedAt = publishedAt;
    this.updatedAt = updatedAt;
    this.publishedDocumentID = publishedDocumentID;
  }
  static fromPrisma(
    prRecord: pr_PublishedDocument & {
      likingUsers: { userID: string }[];
    }
  ) {
    return new PublishedDocumentDB({
      userID: prRecord.userID,
      content: JSON.stringify(prRecord.content),
      title: prRecord.title,
      publishedAt: prRecord.publishedAt,
      updatedAt: prRecord.updatedAt,
      documentID: prRecord.documentID,
      url: prRecord.url,
      subtitle: prRecord.subtitle,
      likingUsers: prRecord.likingUsers.map(
        (u) => u.userID
      ),
      publishedDocumentID: prRecord.publishedDocumentID
    });
  }

  static async fromUsernameAndSlug({
    username,
    slug
  }: {
    username: string;
    slug: string;
  }) {
    const user = await prisma.user.findUnique({
      where: {
        username
      }
    });
    const publishedDocumentRecord =
      await prisma.publishedDocument.findUnique({
        where: {
          userID_url: {
            userID: user.userID,
            url: slug
          }
        },
        include: {
          likingUsers: {
            select: {
              userID: true
            }
          }
        }
      });
    return PublishedDocumentDB.fromPrisma(
      publishedDocumentRecord
    );
  }
  static async fromUsername({
    username
  }: {
    username: string;
  }): Promise<PublishedDocumentDB[]> {
    const user = await prisma.user.findUnique({
      where: {
        username
      }
    });
    const publishedDocumentRecords =
      await prisma.publishedDocument.findMany({
        where: {
          userID: user.userID
        },
        include: {
          likingUsers: {
            select: {
              userID: true
            }
          }
        }
      });
    return publishedDocumentRecords.map(
      (publishedDocumentRecord) => {
        return PublishedDocumentDB.fromPrisma(
          publishedDocumentRecord
        );
      }
    );
  }
  static async fromDocumentIDAndUserID({
    documentID,
    userID
  }: {
    documentID: string;
    userID: string;
  }) {
    const publishedDocumentRecord =
      await prisma.publishedDocument.findUnique({
        where: {
          documentID_userID: {
            userID,
            documentID
          }
        },
        include: {
          likingUsers: {
            select: {
              userID: true
            }
          }
        }
      });
    return PublishedDocumentDB.fromPrisma(
      publishedDocumentRecord
    );
  }
  async toGraphQL(
    user?: UserDB
  ): Promise<gql_PublishedDocumentVersion> {
    let userData = user
      ? {
          username: user.username,
          firstName: user.firstName,
          lastName: user.lastName
        }
      : null;
    if (!userData) {
      userData = await prisma.user.findUnique({
        where: {
          userID: this.userID
        },
        select: {
          username: true,
          userID: true,
          firstName: true,
          lastName: true
        }
      });
    }
    return {
      content: this.content,
      title: this.title,
      subtitle: this.subtitle,
      publishedAt: this.publishedAt,
      updatedAt: this.updatedAt,
      documentID: this.documentID,
      userID: this.userID,
      url: this.url,
      user: {
        userID: this.userID,
        username: userData.username,
        firstName: userData.firstName,
        lastName: userData.lastName
      },
      likingUsers: this.likingUsers,
      publishedDocumentID: this.publishedDocumentID
    };
  }

  toGraphQLMetadata(): gql_PublishedDocumentVersionMetadata {
    return {
      title: this.title,
      publishedAt: this.publishedAt,
      url: this.url
    };
  }
}
