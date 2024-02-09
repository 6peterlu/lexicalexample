import {
  ActionPermission,
  DocumentVersion,
  GetDocumentResponse,
  Role
} from '../generated/types/graphql';
import { UserDocumentPermission } from './userDocumentPermission';

export class DocumentVersionDualID {
  documentID: string;
  versionName: string;
  documentVersionID: string;
  actionPermissions: ActionPermission[];
  constructor(arg: {
    documentID: string;
    versionName?: string;
    documentVersionID?: string;
    actionPermissions?: ActionPermission[];
  }) {
    this.documentID = arg.documentID;
    this.versionName = arg.versionName;
    this.documentVersionID = arg.documentVersionID;
    this.actionPermissions = arg.actionPermissions ?? [];
  }

  hasPermission(permission: ActionPermission) {
    return this.actionPermissions.includes(permission);
  }

  static fromURL({
    documentID,
    versionName
  }: {
    documentID: string;
    versionName?: string;
  }) {
    return new this({
      documentID,
      versionName,
      actionPermissions: []
    });
  }
  static updateDocumentNameAndVersionName({
    documentID,
    versionName,
    documentVersionDualID
  }: {
    documentID: string;
    versionName?: string;
    documentVersionDualID: DocumentVersionDualID;
  }) {
    return new DocumentVersionDualID({
      ...documentVersionDualID,
      documentID,
      versionName
    });
  }
  static updateDocumentVersionIDAndActionPermissions({
    documentVersionID,
    documentVersionDualID,
    actionPermissions
  }: {
    documentVersionID: string;
    documentVersionDualID: DocumentVersionDualID;
    actionPermissions: ActionPermission[];
  }) {
    return new DocumentVersionDualID({
      ...documentVersionDualID,
      documentVersionID,
      actionPermissions: actionPermissions
    });
  }
  static updateFields({
    fields,
    documentVersionDualID
  }: {
    fields: any;
    documentVersionDualID: DocumentVersionDualID;
  }) {
    return new DocumentVersionDualID({
      ...documentVersionDualID,
      ...fields
    });
  }
}
