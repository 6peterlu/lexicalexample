import {
  DailyStatUnit as pr_DailyStatUnit,
  Prisma
} from '../../../generated/prisma';
import { DocumentVersionDB } from './documentVersion';
import prisma from '../../../utils/prisma';
import { Stat as gql_DailyStatUnit } from '../../../generated/types/graphql';
import { DailyChallengeResponseDB } from './dailyChallengeResponse';

export class DailyStatUnitAggregate {
  date: Date;
  timeSpentSeconds: number;
  wordsAdded: number;
  wordsRemoved: number;
  constructor(arg: {
    date: Date;
    timeSpentSeconds: number;
    wordsAdded: number;
    wordsRemoved: number;
  }) {
    this.date = arg.date;
    this.timeSpentSeconds = arg.timeSpentSeconds;
    this.wordsAdded = arg.wordsAdded;
    this.wordsRemoved = arg.wordsRemoved;
  }
  toGraphQL(): gql_DailyStatUnit {
    return {
      wordsChanged: this.wordsAdded + this.wordsRemoved,
      timeSpentSeconds: this.timeSpentSeconds,
      date: this.date
    };
  }
  static fromDailyStatUnits(stats: DailyStatUnitDB[]) {
    // create DailyStatUnitAggregate from array of DailyStatUnitDB and aggregate by date
    const aggregate: DailyStatUnitAggregate[] = [];
    stats.forEach((stat) => {
      const existing = aggregate.find(
        (a) => a.date.getTime() === stat.date.getTime()
      );
      if (existing) {
        existing.timeSpentSeconds += stat.timeSpentSeconds;
        existing.wordsAdded += stat.wordsAdded;
        existing.wordsRemoved += stat.wordsRemoved;
      } else {
        aggregate.push(
          new DailyStatUnitAggregate({
            date: stat.date,
            timeSpentSeconds: stat.timeSpentSeconds,
            wordsAdded: stat.wordsAdded,
            wordsRemoved: stat.wordsRemoved
          })
        );
      }
    });
    return aggregate;
  }
}

export class DailyStatUnitDB {
  userID: string;
  date: Date;
  timeSpentSeconds: number;
  wordsAdded: number;
  wordsRemoved: number;
  dailyStatUnitID: string;
  documentVersionID?: string;
  documentID?: string;

  constructor(arg: {
    userID: string;
    dailyStatUnitID: string;
    date: Date;
    timeSpentSeconds: number;
    wordsAdded: number;
    wordsRemoved: number;
    documentVersionID?: string;
    documentID?: string;
  }) {
    this.userID = arg.userID;
    this.date = arg.date;
    this.timeSpentSeconds = arg.timeSpentSeconds;
    this.wordsAdded = arg.wordsAdded;
    this.wordsRemoved = arg.wordsRemoved;
    this.documentVersionID = arg.documentVersionID;
    this.documentID = arg.documentID;
    this.dailyStatUnitID = arg.dailyStatUnitID;
  }
  static fromPrisma(prismaRecord: pr_DailyStatUnit) {
    return new this({
      userID: prismaRecord.userID,
      date: prismaRecord.date,
      timeSpentSeconds: prismaRecord.timeSpentSeconds,
      wordsAdded: prismaRecord.wordsAdded,
      wordsRemoved: prismaRecord.wordsRemoved,
      documentVersionID: prismaRecord.documentVersionID,
      documentID: prismaRecord.documentID,
      dailyStatUnitID: prismaRecord.dailyStatUnitID
    });
  }

  static async fromDocumentVersionID(
    documentVersionID: string,
    userID: string,
    date: Date
  ): Promise<DailyStatUnitDB> {
    const prismaRecord =
      await prisma.dailyStatUnit.findUnique({
        where: {
          userID_date_documentVersionID: {
            userID,
            date,
            documentVersionID
          }
        }
      });
    let dailyStatUnit;
    if (!prismaRecord) {
      const documentVersion =
        await DocumentVersionDB.uncheckedFromDocumentVersionID(
          documentVersionID
        );
      if (!documentVersion) {
        throw Error(
          'DailyStatUnit.fromDocumentVersionID: invalid document version ID provided'
        );
      }
      const newPrismaRecord =
        await prisma.dailyStatUnit.create({
          data: {
            documentVersionID:
              documentVersion.documentVersionID,
            documentID: documentVersion.documentID,
            date: date,
            userID
          }
        });
      dailyStatUnit =
        DailyStatUnitDB.fromPrisma(newPrismaRecord);
    } else {
      dailyStatUnit =
        DailyStatUnitDB.fromPrisma(prismaRecord);
    }
    return dailyStatUnit;
  }

  static async fromDailyChallengeResponseID(
    dailyChallengeResponseID: string,
    date: Date
  ): Promise<DailyStatUnitDB> {
    const prismaRecord =
      await prisma.dailyStatUnit.findUnique({
        where: {
          date_dailyChallengeResponseID: {
            date,
            dailyChallengeResponseID
          }
        }
      });
    let dailyStatUnit;
    if (!prismaRecord) {
      const dailyChallengeResponse =
        await DailyChallengeResponseDB.uncheckedFromDailyChallengeResponseID(
          { dailyChallengeResponseID }
        );
      if (!dailyChallengeResponse) {
        throw Error(
          'DailyStatUnit.fromDailyChallengeResponseID: invalid dailyChallengeResponseID provided'
        );
      }
      const newPrismaRecord =
        await prisma.dailyStatUnit.create({
          data: {
            dailyChallengeResponseID,
            date,
            userID: dailyChallengeResponse.userID
          }
        });
      dailyStatUnit =
        DailyStatUnitDB.fromPrisma(newPrismaRecord);
    } else {
      dailyStatUnit =
        DailyStatUnitDB.fromPrisma(prismaRecord);
    }
    return dailyStatUnit;
  }

  static async createOrUpdateStatsForDocumentVersion({
    userID,
    documentVersionID,
    wordsAdded,
    wordsRemoved,
    timeSpentSeconds,
    date
  }: {
    userID: string;
    documentVersionID: string;
    wordsAdded: number;
    wordsRemoved: number;
    timeSpentSeconds: number;
    date: Date;
  }) {
    const dailyStatUnit =
      await DailyStatUnitDB.fromDocumentVersionID(
        documentVersionID,
        userID,
        date
      );
    dailyStatUnit.timeSpentSeconds += timeSpentSeconds;
    dailyStatUnit.wordsAdded += wordsAdded;
    dailyStatUnit.wordsRemoved += wordsRemoved;
    return dailyStatUnit.toPrismaUpdateBody();
  }
  toGraphQL(): gql_DailyStatUnit {
    return {
      wordsChanged: this.wordsAdded + this.wordsRemoved,
      timeSpentSeconds: this.timeSpentSeconds,
      date: this.date
    };
  }

  static async createOrUpdateStatsForDailyChallengeResponse({
    wordsAdded,
    wordsRemoved,
    timeSpentSeconds,
    date,
    dailyChallengeResponseID
  }: {
    userID: string;
    wordsAdded: number;
    wordsRemoved: number;
    timeSpentSeconds: number;
    date: Date;
    dailyChallengeResponseID: string;
  }) {
    const dailyStatUnit =
      await DailyStatUnitDB.fromDailyChallengeResponseID(
        dailyChallengeResponseID,
        date
      );
    dailyStatUnit.timeSpentSeconds += timeSpentSeconds;
    dailyStatUnit.wordsAdded += wordsAdded;
    dailyStatUnit.wordsRemoved += wordsRemoved;
    dailyStatUnit.date = date;
    return dailyStatUnit.toPrismaUpdateBody();
  }

  toPrismaUpdateBody(): Prisma.DailyStatUnitUpdateArgs {
    return {
      where: { dailyStatUnitID: this.dailyStatUnitID },
      data: {
        timeSpentSeconds: this.timeSpentSeconds,
        wordsAdded: this.wordsAdded,
        wordsRemoved: this.wordsRemoved
      }
    };
  }
}
