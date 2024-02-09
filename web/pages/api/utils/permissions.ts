import { Role } from '../../../generated/prisma';
import { DocumentDB } from '../models/document';
import { DocumentVersionDB } from '../models/documentVersion';
import {
  UserDocumentPermission,
  UserDocumentPermissionDB
} from '../models/userDocumentPermission';

// Who's allowed to remove who.
// const ROLE_REMOVE_PERMISSIONS = {
//   [Role.ADMIN]: [
//     Role.ADMIN,
//     Role.EDITOR,
//     Role.REVIEWER,
//     Role.LEAD_REVIEWER
//   ],
//   [Role.OWNER]: [
//     Role.ADMIN,
//     Role.EDITOR,
//     Role.REVIEWER,
//     Role.LEAD_REVIEWER
//   ]
// };

// Who's allowed to share who.
// const ROLE_ADD_PERMISSIONS = {
//   [Role.ADMIN]: [
//     Role.ADMIN,
//     Role.EDITOR,
//     Role.REVIEWER,
//     Role.LEAD_REVIEWER
//   ],
//   [Role.OWNER]: [
//     Role.ADMIN,
//     Role.EDITOR,
//     Role.REVIEWER,
//     Role.LEAD_REVIEWER
//   ]
// };

// Determines whether you're allowed to remove a role
export async function canRemoveRole(
  removerPermission: UserDocumentPermissionDB,
  removeePermission: UserDocumentPermissionDB
) {
  // can't remove the owner (via this method at least)
  // owner is only removable via the delete document workflow
  if (removeePermission.role === Role.OWNER) {
    return false;
  }
  if (
    !(<Role[]>[Role.ADMIN, Role.OWNER]).includes(
      removerPermission.role
    )
  ) {
    // the provided permission has insufficient role regardless of what document its on
    // only admins and owners can remove
    return false;
  }

  if (removeePermission.documentID) {
    // removee is on the whole document and not a specific version.
    // in this case the remover must be on the whole document as well.
    return (
      removerPermission.documentID ===
      removeePermission.documentID
    );
  }

  // from here forward, removee permission does not have documentID
  // checking if the permission is on the right document/document version
  if (removerPermission.documentVersionID) {
    // the caller permission is on the document version so no further resolution is needed
    if (
      removerPermission.documentID !==
        removeePermission.documentID ||
      removerPermission.documentVersionID !==
        removeePermission.documentVersionID
    ) {
      return false;
    }
  } else {
    const documentVersion =
      await DocumentVersionDB.uncheckedFromDocumentVersionID(
        removeePermission.documentVersionID
      );
    if (
      documentVersion.documentID !==
      removerPermission.documentID
    ) {
      // remover permission is on a different document than the targeted permission
      return false;
    }
  }
  if (
    removerPermission.documentID !==
    removeePermission.documentID
  ) {
    // permission was for a different document, cannot be valid
    return false;
  }
  if (
    (removerPermission.documentVersionID &&
      removerPermission.documentID !==
        removeePermission.documentID) ||
    removerPermission.documentVersionID !==
      removeePermission.documentVersionID
  ) {
    // the permission is for the same document but a different document
    return false;
  }

  return false;
}

// This function is only used to share on document versions. another one will be used for documents
export async function canShareDocumentVersion(
  sharerDocumentPermission: UserDocumentPermissionDB,
  shareeDocumentPermission: UserDocumentPermission,
  documentVersion: DocumentVersionDB
) {
  // can't share an owner, owners are created during the create document workflow
  if (shareeDocumentPermission.role === Role.OWNER) {
    return false;
  }
  // the sharee document permission doesn't match the target document
  if (
    shareeDocumentPermission.documentVersionID !==
    documentVersion.documentVersionID
  ) {
    return false;
  }
  // only admins and owners can share
  if (
    !(<Role[]>[Role.ADMIN, Role.OWNER]).includes(
      sharerDocumentPermission.role
    )
  ) {
    return false;
  }
  if (
    !(
      documentVersion.documentVersionID ===
        sharerDocumentPermission.documentVersionID ||
      documentVersion.documentID ===
        sharerDocumentPermission.documentID
    )
  ) {
    // the permission doesn't apply to the correct document
    return false;
  }
  return true;
}

// This function is only used to share on document.
export async function canShareDocument(
  sharerDocumentPermission: UserDocumentPermissionDB,
  shareeDocumentPermission: UserDocumentPermission,
  document: DocumentDB
) {
  // can't share an owner, owners are created during the create document workflow
  if (shareeDocumentPermission.role === Role.OWNER) {
    return false;
  }
  // the sharee document permission doesn't match the target document
  if (
    shareeDocumentPermission.documentID !==
    document.documentID
  ) {
    return false;
  }
  // only admins and owners can share
  if (
    !(<Role[]>[Role.ADMIN, Role.OWNER]).includes(
      sharerDocumentPermission.role
    )
  ) {
    return false;
  }
  if (
    !(
      document.documentID ===
      sharerDocumentPermission.documentID
    )
  ) {
    // the permission doesn't apply to the correct document
    return false;
  }
  return true;
}
