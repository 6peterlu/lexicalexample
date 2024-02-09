import { currentDocumentVar } from '../cache/cache';
import {
  DocumentMetadata as gql_DocumentMetadata,
  DocumentVersionMetadata as gql_DocumentVersionMetadata,
  GetDocumentResponse
} from '../generated/types/graphql';

export class DocumentMetadata {
  title: string;
  updatedAt: Date;
  documentID: string;
  documentVersions: DocumentVersionMetadata[];
  lastOpenedDocumentVersionID: string;

  constructor(arg: {
    title: string;
    updatedAt: Date;
    documentID: string;
    documentVersions: DocumentVersionMetadata[];
    lastOpenedDocumentVersionID: string;
  }) {
    this.title = arg.title;
    this.updatedAt = arg.updatedAt;
    this.documentID = arg.documentID;
    this.documentVersions = arg.documentVersions;
    this.lastOpenedDocumentVersionID =
      arg.lastOpenedDocumentVersionID;
  }

  static fromGraphQL(
    documentMetadata: gql_DocumentMetadata
  ) {
    return new this({
      title: documentMetadata.title,
      updatedAt: new Date(documentMetadata.updatedAt),
      documentID: documentMetadata.documentID,
      documentVersions:
        documentMetadata.documentVersions.map((udp) =>
          DocumentVersionMetadata.fromGraphQL(udp)
        ),
      lastOpenedDocumentVersionID:
        documentMetadata.lastOpenedDocumentVersionID
    });
  }
}

export class DocumentVersionMetadata {
  versionName: string;
  createdAt: Date;
  documentVersionID: string;

  constructor(arg: {
    versionName: string;
    createdAt: Date;
    documentVersionID: string;
  }) {
    this.versionName = arg.versionName;
    this.createdAt = arg.createdAt;
    this.documentVersionID = arg.documentVersionID;
  }
  static fromGraphQL(
    documentVersionMetadata: gql_DocumentVersionMetadata
  ) {
    return new this({
      versionName: documentVersionMetadata.versionName,
      createdAt: new Date(
        documentVersionMetadata.createdAt
      ),
      documentVersionID:
        documentVersionMetadata.documentVersionID
    });
  }
}

// class to store data related to current document
export class Document {
  documentVersions: DocumentVersionMetadata[];
  title: string;
  // stringified version of the content, lexical will call JSON.parse.
  // calling it ourselves seems to result in bugs
  content: string;
  documentID: string;

  constructor(arg: {
    documentVersions: DocumentVersionMetadata[];
    title: string;
    documentID: string;
  }) {
    this.documentVersions = arg.documentVersions;
    this.title = arg.title;
    this.documentID = arg.documentID;
  }
  static fromGraphQL(
    documentResponse: GetDocumentResponse
  ) {
    return new this({
      documentVersions:
        documentResponse.documentVersionMetadataList.map(
          (dvm) => DocumentVersionMetadata.fromGraphQL(dvm)
        ),
      title: documentResponse.title,
      documentID: documentResponse.documentID
    });
  }
  clone() {
    return new Document({
      documentVersions: this.documentVersions,
      title: this.title,
      documentID: this.documentID
    });
  }
  updateDocumentVersionMetadata(
    documentResponse: GetDocumentResponse
  ) {
    const clone = this.clone();
    clone.documentVersions =
      documentResponse.documentVersionMetadataList.map(
        (dvm) => DocumentVersionMetadata.fromGraphQL(dvm)
      );
    currentDocumentVar(clone);
  }
  updateTitle(title: string) {
    // NOTE: potential garbage collecting implications here?
    const clone = this.clone();
    clone.title = title;
    currentDocumentVar(clone);
  }
  updateContent(content: string) {
    // NOTE: potential garbage collecting implications here?
    const clone = this.clone();
    clone.content = content;
    currentDocumentVar(clone);
  }
}
