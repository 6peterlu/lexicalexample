import {
  NoteRole,
  UserNotePermission as gql_UserNotePermission
} from '../generated/types/graphql';

export class UserNotePermissionDB {
  userID: string;
  noteID: string;
  role: NoteRole;
  username: string;
  constructor(arg: {
    userID: string;
    noteID: string;
    role: NoteRole;
    username: string;
  }) {
    this.userID = arg.userID;
    this.noteID = arg.noteID;
    this.role = arg.role;
    this.username = arg.username
  }
  static fromGraphQL(res: gql_UserNotePermission) {
    return new this({
      userID: res.userID,
      noteID: res.noteID,
      role: res.role,
      username: res.username
    });
  }
}
