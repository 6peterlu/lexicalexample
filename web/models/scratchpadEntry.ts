import { ScratchpadEntry as gql_ScratchpadEntry } from '../generated/types/graphql';

export class ScratchpadEntry {
  scratchpadEntryID: string;
  content: string; // stringified JSON
  date: Date;
  userID: string;
  constructor({
    scratchpadEntryID,
    content,
    date,
    userID
  }: {
    scratchpadEntryID: string;
    content: string;
    date: Date;
    userID: string;
  }) {
    this.scratchpadEntryID = scratchpadEntryID;
    this.content = content;
    this.date = date;
    this.userID = userID;
  }

  static fromGraphQL(
    gqlScratchpadEntry: gql_ScratchpadEntry
  ): ScratchpadEntry {
    return new this({
      scratchpadEntryID:
        gqlScratchpadEntry.scratchpadEntryID,
      content: gqlScratchpadEntry.content,
      date: new Date(gqlScratchpadEntry.date),
      userID: gqlScratchpadEntry.userID
    });
  }
}
