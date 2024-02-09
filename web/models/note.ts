import { Note as gql_Note } from '../generated/types/graphql';
import { UserNotePermissionDB } from './userNotePermission';

export class NoteDB {
  noteID: string;
  title: string;
  content?: any;
  userNotePermissions: UserNotePermissionDB[];
  personal: boolean;
  new?: boolean;
  constructor(arg: {
    title: string;
    noteID: string;
    content?: any;
    userNotePermissions: UserNotePermissionDB[];
    personal: boolean;
    new?: boolean;
  }) {
    this.title = arg.title;
    this.noteID = arg.noteID;
    this.content = arg.content;
    this.userNotePermissions = arg.userNotePermissions;
    this.personal = arg.personal;
    this.new = arg.new;
  }
  static fromGraphQL(res: gql_Note) {
    return new this({
      title: res.title,
      noteID: res.noteID,
      content: res.content,
      userNotePermissions: res.userNotePermissions.map(
        (unp) => UserNotePermissionDB.fromGraphQL(unp)
      ),
      personal: res.personal
    });
  }
  clone(): NoteDB {
    return new NoteDB({
      noteID: this.noteID,
      title: this.title,
      content: this.content,
      userNotePermissions: this.userNotePermissions,
      personal: this.personal
    });
  }
  userNotePermissionsPush(
    unp: UserNotePermissionDB
  ): NoteDB {
    const clone = this.clone();
    clone.userNotePermissions.push(unp);
    return clone;
  }
}
