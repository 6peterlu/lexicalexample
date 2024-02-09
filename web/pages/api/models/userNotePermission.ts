import {
  NoteRole,
  UserNotePermission as pr_UserNotePermission,
  User as pr_User,
  Prisma
} from '../../../generated/prisma';
import prisma from '../../../utils/prisma';
import {
  CreateNoteRequest,
  UserNotePermission as gql_UserNotePermission,
  NoteRole as gql_NoteRole,
  ActionPermission
} from '../../../generated/types/graphql';
import { User, UserDB } from './user';

import { fromEnum } from '../../../models/comment';
import {
  hasPermission,
  RoleType,
  TypedRole
} from '../../../utils/permissions';

const NoteRoleTypeV = fromEnum('Role', NoteRole);

function createNoteRoleEnumFromString(
  input: string
): NoteRole {
  if (NoteRoleTypeV.is(input)) {
    return NoteRole[input];
  }
  throw new Error(
    'Invalid string provided to createNoteRoleEnumFromString'
  );
}

export class UserNotePermission {
  userID: string;
  noteID?: string;
  role: NoteRole;
  constructor(arg: {
    role: NoteRole;
    userID: string;
    noteID?: string;
  }) {
    this.userID = arg.userID;
    this.role = arg.role;
    this.noteID = arg.noteID;
  }
  toPrismaCreate(): Prisma.UserNotePermissionUncheckedCreateInput {
    return {
      userID: this.userID,
      noteID: this.noteID,
      role: this.role
    };
  }
  static fromCreateNoteRequest({ user }: { user: UserDB }) {
    return new this({
      userID: user.userID,
      role: NoteRole.OWNER
    });
  }
}

export class UserNotePermissionDB extends UserNotePermission {
  userNotePermissionID: string;
  user?: UserDB;
  constructor(arg: {
    role: NoteRole;
    userID: string;
    noteID: string;
    userNotePermissionID: string;
    user?: UserDB;
  }) {
    super(arg);
    this.userNotePermissionID = arg.userNotePermissionID;
    this.user = arg.user;
  }
  static fromPrisma(noteObj: pr_UserNotePermission) {
    return new this({
      role: noteObj.role,
      noteID: noteObj.noteID,
      userNotePermissionID: noteObj.userNotePermissionID,
      userID: noteObj.userID
    });
  }
  static fromPrismaWithUser(
    noteObj: pr_UserNotePermission & { user: pr_User }
  ) {
    return new this({
      role: noteObj.role,
      noteID: noteObj.noteID,
      userNotePermissionID: noteObj.userNotePermissionID,
      userID: noteObj.user.userID,
      user: UserDB.fromPrisma(noteObj.user)
    });
  }
  static async fromNoteIDUserID({
    noteID,
    userID
  }: {
    noteID: string;
    userID: string;
  }) {
    const userNotePermission =
      await prisma.userNotePermission.findFirst({
        where: { userID, noteID },
        include: { user: true }
      });
    return this.fromPrismaWithUser(userNotePermission);
  }
  static async fromUserNotePermissionID({
    userNotePermissionID
  }: {
    userNotePermissionID: string;
  }) {
    const userNotePermission =
      await prisma.userNotePermission.findUnique({
        where: { userNotePermissionID }
      });
    return this.fromPrisma(userNotePermission);
  }
  toGraphQL(): gql_UserNotePermission {
    return {
      noteID: this.noteID,
      userID: this.userID,
      role: this.role as gql_NoteRole,
      username: this.user?.username,
      userNotePermissionID: this.userNotePermissionID
    };
  }
  canShareNote(): boolean {
    // needed variable for typing
    // TODO: migrate to ABAC
    const shareableRoles: NoteRole[] = [
      NoteRole.OWNER,
      NoteRole.ADMIN
    ];
    return shareableRoles.includes(this.role);
  }
  toTypedRole(): TypedRole {
    return {
      roleType: RoleType.Note,
      role: this.role
    };
  }
  canDeleteNote(): boolean {
    return hasPermission(
      this.toTypedRole(),
      ActionPermission.DeleteNoteForAll
    );
  }
}
