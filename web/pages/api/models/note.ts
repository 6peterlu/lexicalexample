import {
  Note as pr_Note,
  UserNotePermission as pr_UserNotePermission,
  User as pr_User,
  NoteRole,
  Prisma
} from '../../../generated/prisma';
import prisma from '../../../utils/prisma';
import { UserDB } from './user';

import { GraphQLError } from 'graphql';
import {
  UserNotePermission,
  UserNotePermissionDB
} from './userNotePermission';
import { DocumentDB } from './document';
import {
  CreateNoteRequest,
  Note as gql_Note,
  NoteMetadata as gql_NoteMetadata
} from '../../../generated/types/graphql';
import { fromEnum } from '../../../models/comment';

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
export class Note {
  title?: string;
  content: any;
  userNotePermissions: UserNotePermission[];
  documentID: string;
  personal: boolean = false;

  constructor(arg: {
    title?: string;
    content: any;
    userNotePermissions: UserNotePermission[];
    documentID: string;
    personal?: boolean;
  }) {
    if (arg.title) {
      this.title = arg.title;
    }
    this.content = arg.content;
    this.userNotePermissions = arg.userNotePermissions;
    this.documentID = arg.documentID;
    if (arg.personal) {
      this.personal = arg.personal;
    }
  }
  toPrismaCreate(): Prisma.NoteUncheckedCreateInput {
    return {
      title: this.title ?? undefined,
      content: this.content ?? undefined,
      documentID: this.documentID,
      userNotePermissions: {
        createMany: {
          data: this.userNotePermissions.map((unp) =>
            unp.toPrismaCreate()
          )
        }
      },
      personal: this.personal
    };
  }
  static fromGraphQL({
    request,
    user
  }: {
    request: CreateNoteRequest;
    user: UserDB;
  }) {
    return new this({
      userNotePermissions: [
        UserNotePermission.fromCreateNoteRequest({
          user
        })
      ],
      content: null,
      documentID: request.documentID
    });
  }
}

export class NoteDB extends Note {
  noteID: string;
  userNotePermissions: UserNotePermissionDB[];
  constructor(arg: {
    title: string;
    content: any;
    userNotePermissions: UserNotePermissionDB[];
    documentID: string;
    noteID: string;
    personal?: boolean;
  }) {
    super(arg);
    this.noteID = arg.noteID;
    this.userNotePermissions = arg.userNotePermissions;
  }
  static fromPrisma(
    note: pr_Note & {
      userNotePermissions: (pr_UserNotePermission & {
        user: pr_User;
      })[];
    }
  ) {
    return new this({
      title: note.title,
      content: note.content,
      noteID: note.noteID,
      documentID: note.documentID,
      userNotePermissions: note.userNotePermissions.map(
        (unp) =>
          UserNotePermissionDB.fromPrismaWithUser(unp)
      ),
      personal: note.personal
    });
  }
  static async fromDocumentAndUser({
    document,
    user
  }: {
    document: DocumentDB;
    user: UserDB;
  }): Promise<NoteDB[]> {
    if (!document.userHasAccess(user)) {
      throw new GraphQLError(
        'fromDocumentAndUser: fromDocumentAndUser: user does not have access'
      );
    }
    let notes = await prisma.note.findMany({
      where: {
        documentID: document.documentID,
        userNotePermissions: {
          some: {
            userID: user.userID
          }
        }
      },
      include: {
        userNotePermissions: { include: { user: true } }
      }
    });
    return notes.map((n) => NoteDB.fromPrisma(n));
  }
  static async fromNoteIDAndUser({
    noteID,
    user
  }: {
    noteID: string;
    user: UserDB;
  }) {
    const permissionCount =
      await prisma.userNotePermission.count({
        where: {
          userID: user.userID,
          noteID
        }
      });
    if (permissionCount === 0) {
      throw new GraphQLError(
        'fromNoteIDAndUser: user is not authorized to access note'
      );
    }
    const noteRecord = await prisma.note.findUnique({
      where: { noteID },
      include: {
        userNotePermissions: { include: { user: true } }
      }
    });
    return NoteDB.fromPrisma(noteRecord);
  }
  toPrismaUpdate(): Prisma.NoteUpdateArgs {
    return {
      where: { noteID: this.noteID },
      data: {
        title: this.title,
        content: this.content ?? undefined
      }
    };
  }
  toGraphQL(): gql_Note {
    return {
      noteID: this.noteID,
      content: this.content
        ? JSON.stringify(this.content)
        : null,
      title: this.title,
      userNotePermissions: this.userNotePermissions.map(
        (unp) => unp.toGraphQL()
      ),
      personal: this.personal
    };
  }
  toGraphQLMetadata(): gql_NoteMetadata {
    return {
      noteID: this.noteID,
      title: this.title,
      userNotePermissions: this.userNotePermissions.map(
        (unp) => unp.toGraphQL()
      ),
      personal: this.personal
    };
  }
}
