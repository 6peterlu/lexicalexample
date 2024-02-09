import {
  DocumentVersion,
  GetDocumentResponse,
  Role
} from '../generated/types/graphql';

export class UserDocumentPermission {
  userID: string;
  role: Role;
  documentID?: string;
  documentVersionID?: string;
  userDocumentPermissionID: string;
  constructor(arg: {
    userID: string;
    role: Role;
    documentID?: string;
    documentVersionID?: string;
    userDocumentPermissionID: string;
  }) {
    this.documentID = arg.documentID;
    this.role = arg.role;
    this.documentID = arg.documentID;
    this.documentVersionID = arg.documentVersionID;
    this.userDocumentPermissionID =
      arg.userDocumentPermissionID;
  }
  static matches(
    permission1: UserDocumentPermission,
    permission2: UserDocumentPermission
  ): boolean {
    if (!permission1 || !permission2) {
      return false;
    }
    return (
      permission1.documentID === permission2.documentID &&
      permission1.documentVersionID ===
        permission2.documentVersionID &&
      permission1.role === permission2.role &&
      permission1.userID === permission2.userID
    );
  }
}
