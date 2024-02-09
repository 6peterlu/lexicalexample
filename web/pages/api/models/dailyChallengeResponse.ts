import { GraphQLError } from 'graphql';
import {
  DailyChallengeResponse as pr_DailyChallengeResponse,
  DailyChallengeResponseLikes as pr_DailyChallengeResponseLikes
} from '../../../generated/prisma';
import { DailyChallengeResponse as gql_DailyChallengeResponse } from '../../../generated/types/graphql';
import prisma from '../../../utils/prisma';

export class DailyChallengeResponseDB {
  dailyChallengeResponseID: string;
  dailyChallengeID: number;
  userID: string;
  content: any;
  postedOn: Date;
  likes: string[];
  wordCount: number;
  completedOnTime: boolean;
  constructor({
    dailyChallengeResponseID,
    dailyChallengeID,
    userID,
    content,
    postedOn,
    likes,
    wordCount,
    completedOnTime
  }: {
    dailyChallengeResponseID: string;
    dailyChallengeID: number;
    userID: string;
    content: any;
    postedOn: Date;
    likes: string[];
    wordCount: number;
    completedOnTime: boolean;
  }) {
    this.dailyChallengeID = dailyChallengeID;
    this.dailyChallengeResponseID =
      dailyChallengeResponseID;
    this.userID = userID;
    this.content = content;
    this.postedOn = postedOn;
    this.likes = likes;
    this.wordCount = wordCount;
    this.completedOnTime = completedOnTime;
  }
  static fromPrisma(
    dcr: pr_DailyChallengeResponse & {
      likes: pr_DailyChallengeResponseLikes[];
    }
  ) {
    return new this({
      dailyChallengeID: dcr.dailyChallengeID,
      dailyChallengeResponseID:
        dcr.dailyChallengeResponseID,
      userID: dcr.userID,
      content: dcr.content,
      postedOn: dcr.postedOn,
      likes: dcr.likes.map((l) => l.userID),
      wordCount: dcr.wordCount,
      completedOnTime: dcr.completedOnTime
    });
  }
  static async fromDailyChallengeIDAndUserID({
    dailyChallengeID,
    userID
  }: {
    dailyChallengeID: number;
    userID: string;
  }) {
    let prRecord =
      await prisma.dailyChallengeResponse.findUnique({
        where: {
          userID_dailyChallengeID: {
            userID,
            dailyChallengeID
          }
        },
        include: {
          likes: true
        }
      });
    if (!prRecord) {
      prRecord = await prisma.dailyChallengeResponse.create(
        {
          data: {
            userID: userID,
            dailyChallengeID: dailyChallengeID
          },
          include: {
            likes: true
          }
        }
      );
    }
    return DailyChallengeResponseDB.fromPrisma(prRecord);
  }

  static async fromDailyChallengeResponseIDAndUserID({
    dailyChallengeResponseID,
    userID
  }: {
    dailyChallengeResponseID: string;
    userID: string;
  }): Promise<DailyChallengeResponseDB> {
    let prRecord =
      await prisma.dailyChallengeResponse.findUniqueOrThrow(
        {
          where: {
            dailyChallengeResponseID
          },
          include: { likes: true }
        }
      );
    if (prRecord.userID !== userID) {
      throw new GraphQLError(
        'fromDailyChallengeResponseIDAndUserID: user does not have access to this response'
      );
    }
    return DailyChallengeResponseDB.fromPrisma(prRecord);
  }

  static async uncheckedFromDailyChallengeResponseID({
    dailyChallengeResponseID
  }: {
    dailyChallengeResponseID: string;
  }): Promise<DailyChallengeResponseDB> {
    let prRecord =
      await prisma.dailyChallengeResponse.findUniqueOrThrow(
        {
          where: {
            dailyChallengeResponseID
          },
          include: { likes: true }
        }
      );
    return DailyChallengeResponseDB.fromPrisma(prRecord);
  }

  toGraphQL(): gql_DailyChallengeResponse {
    return {
      dailyChallengeID: this.dailyChallengeID,
      dailyChallengeResponseID:
        this.dailyChallengeResponseID,
      userID: this.userID,
      content: this.content
        ? JSON.stringify(this.content)
        : null,
      likes: this.likes,
      postedOn: this.postedOn
    };
  }
}
