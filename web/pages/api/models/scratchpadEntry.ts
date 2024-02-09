import { ScratchpadEntry as pr_ScratchpadEntry } from '../../../generated/prisma';
import { ScratchpadEntry as gql_ScratchpadEntry } from '../../../generated/types/graphql';

export class ScratchpadEntryDB {
  scratchpadEntryID: string;
  content: any;
  date: Date;
  userID: string;

  constructor({
    scratchpadEntryID,
    content,
    date,
    userID
  }: {
    scratchpadEntryID: string;
    content: any;
    date: Date;
    userID: string;
  }) {
    this.scratchpadEntryID = scratchpadEntryID;
    this.content = content;
    this.date = date;
    this.userID = userID;
  }

  static fromPrisma(record: pr_ScratchpadEntry) {
    return new ScratchpadEntryDB({
      scratchpadEntryID: record.scratchpadEntryID,
      content: record.content,
      date: record.date,
      userID: record.userID
    });
  }

  toGraphQL(): gql_ScratchpadEntry {
    return {
      content: this.content ? JSON.stringify(this.content) : null,
      date: this.date,
      scratchpadEntryID: this.scratchpadEntryID,
      userID: this.userID
    };
  }
}
