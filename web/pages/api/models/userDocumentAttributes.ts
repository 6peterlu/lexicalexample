import { UserDocumentAttributes as pr_UserDocumentAttributes } from '../../../generated/prisma';

export class UserDocumentAttributesDB {
  documentID: string;
  userID: string;
  lastOpenedDocumentID: string;
  constructor({
    documentID,
    userID,
    lastOpenedDocumentID
  }: {
    documentID: string;
    userID: string;
    lastOpenedDocumentID: string;
  }) {
    this.documentID = documentID;
    this.userID = userID;
    this.lastOpenedDocumentID = lastOpenedDocumentID;
  }
  static fromPrisma(
    record: pr_UserDocumentAttributes
  ): UserDocumentAttributesDB {
    return new this({
      documentID: record.documentID,
      userID: record.userID,
      lastOpenedDocumentID:
        record.lastOpenedDocumentVersionID
    });
  }
}
