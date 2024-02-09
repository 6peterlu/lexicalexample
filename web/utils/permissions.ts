import { Role } from '../generated/prisma';
import { ActionPermission } from '../generated/types/graphql';

export enum RoleType {
  Document,
  DocumentVersion,
  Note
}

export enum PermissionRole {
  DocumentOwner,
  DocumentAdmin,
  DocumentEditor,
  DocumentLeadReviewer,
  DocumentReviewer,
  DocumentVersionAdmin,
  DocumentVersionEditor,
  DocumentVersionLeadReviewer,
  DocumentVersionReviewer,
  NoteOwner,
  NoteEditor
}

const DocumentRoleMap: { [key: string]: PermissionRole } = {
  [Role.OWNER]: PermissionRole.DocumentOwner,
  [Role.ADMIN]: PermissionRole.DocumentAdmin,
  [Role.EDITOR]: PermissionRole.DocumentEditor,
  [Role.LEAD_REVIEWER]: PermissionRole.DocumentLeadReviewer,
  [Role.REVIEWER]: PermissionRole.DocumentReviewer
};

const DocumentVersionRoleMap: {
  [key: string]: PermissionRole;
} = {
  [Role.ADMIN]: PermissionRole.DocumentVersionAdmin,
  [Role.EDITOR]: PermissionRole.DocumentVersionEditor,
  [Role.LEAD_REVIEWER]:
    PermissionRole.DocumentVersionLeadReviewer,
  [Role.REVIEWER]: PermissionRole.DocumentVersionReviewer
};

const NoteRoleMap: {
  [key: string]: PermissionRole;
} = {
  [Role.OWNER]: PermissionRole.NoteOwner
};

const RolePermissionMap = {
  [RoleType.Document]: DocumentRoleMap,
  [RoleType.DocumentVersion]: DocumentVersionRoleMap,
  [RoleType.Note]: NoteRoleMap
};

/**
 *     DeleteNoteForAll
    DeleteDocumentVersionForAll
    RenameDocumentVersion
    PublishDocumentVersion
    EditDocumentVersionContent
    ShareDocumentVersion
    ShareDocument
    RemoveCollaboratorFromDocumentVersion
    CreateCommentOnDocumentVersion
 */
const PERMISSION_MAP: {
  [key: string]: ActionPermission[];
} = {
  [PermissionRole.DocumentOwner]: [
    ActionPermission.DeleteDocumentVersionForAll,
    ActionPermission.RenameDocumentVersion,
    ActionPermission.PublishDocumentVersion,
    ActionPermission.EditDocumentVersionContent,
    ActionPermission.ShareDocumentVersion,
    ActionPermission.ShareDocument,
    ActionPermission.RemoveCollaboratorFromDocumentVersion,
    ActionPermission.CreateCommentOnDocumentVersion
  ],
  [PermissionRole.DocumentAdmin]: [
    ActionPermission.DeleteDocumentVersionForAll,
    ActionPermission.RenameDocumentVersion,
    ActionPermission.EditDocumentVersionContent,
    ActionPermission.ShareDocumentVersion,
    ActionPermission.ShareDocument,
    ActionPermission.RemoveCollaboratorFromDocumentVersion,
    ActionPermission.CreateCommentOnDocumentVersion
  ],
  [PermissionRole.DocumentVersionAdmin]: [
    ActionPermission.DeleteDocumentVersionForAll,
    ActionPermission.RenameDocumentVersion,
    ActionPermission.EditDocumentVersionContent,
    ActionPermission.ShareDocumentVersion,
    ActionPermission.ShareDocument,
    ActionPermission.RemoveCollaboratorFromDocumentVersion,
    ActionPermission.CreateCommentOnDocumentVersion
  ],
  [PermissionRole.NoteOwner]: [
    ActionPermission.DeleteNoteForAll
  ]
};

export type TypedRole = {
  role: Role;
  roleType: RoleType;
};

function convertRoleToPermissionRole(typedRole: TypedRole) {
  return RolePermissionMap[typedRole.roleType]?.[
    typedRole.role
  ];
}

export function hasPermission(
  typedRole: TypedRole,
  action: ActionPermission
) {
  const permissionRole =
    convertRoleToPermissionRole(typedRole);
  if (permissionRole == null) {
    return false;
  }
  return PERMISSION_MAP[permissionRole].includes(action);
}

export function listHasPermission(
  permissions: TypedRole[],
  action: ActionPermission
) {
  return permissions.some((p) => hasPermission(p, action));
}

export function getAllPermissionsForTypedRole(
  typedRole: TypedRole
): ActionPermission[] {
  const permissionRole =
    convertRoleToPermissionRole(typedRole);
  if (permissionRole == null) {
    return [];
  }
  return PERMISSION_MAP[permissionRole];
}

export function getAllPermissionsFromTypedRoles(
  typedRoles: TypedRole[]
): ActionPermission[] {
  return [
    ...new Set(
      typedRoles.flatMap((typedRole) =>
        getAllPermissionsForTypedRole(typedRole)
      )
    )
  ];
}
