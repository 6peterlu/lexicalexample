import { Resolvers, gql } from '@apollo/client';
import prisma from '../../../../utils/prisma';
import { GraphQLError } from 'graphql';
import {
  Note as NoteModel,
  NoteDB,
  NoteDB as NoteDBModel
} from '../../models/note';
import {
  CreateNoteRequest,
  DeleteNoteRequest,
  GetNotesForDocumentRequest,
  SaveNoteRequest,
  SaveNoteTitleRequest,
  ShareNoteRequest,
  UnshareNoteRequest
} from '../../../../generated/types/graphql';
import { UserDB } from '../../models/user';
import { DocumentDB } from '../../models/document';
import { UserNotePermissionDB } from '../../models/userNotePermission';

const typeDefs = gql`
  enum NoteRole {
    OWNER
    ADMIN
    EDITOR
  }
  enum EditableNoteRole {
    ADMIN
    EDITOR
  }
  type UserNotePermission {
    userID: String!
    noteID: String!
    role: NoteRole!
    username: String!
    userNotePermissionID: String!
  }
  type Note {
    title: String
    noteID: String!
    content: String
    userNotePermissions: [UserNotePermission!]!
    personal: Boolean!
  }
  type NoteMetadata {
    title: String
    noteID: String!
    userNotePermissions: [UserNotePermission!]!
    personal: Boolean!
  }
  input SaveNoteRequest {
    noteID: String!
    content: String!
  }
  input SaveNoteTitleRequest {
    noteID: String!
    title: String!
  }
  input CreateNoteRequest {
    documentID: String!
  }
  input GetNotesForDocumentRequest {
    documentID: String!
  }
  input ShareNoteRequest {
    noteID: String!
    username: String!
    role: EditableNoteRole!
  }
  input DeleteNoteRequest {
    noteID: String!
  }
  input UnshareNoteRequest {
    userNotePermissionID: String!
  }
  extend type Mutation {
    saveNoteTitle(request: SaveNoteTitleRequest!): Void
    createNote(request: CreateNoteRequest!): Note!
    saveNote(request: SaveNoteRequest!): Void
    getNotesForDocument(
      request: GetNotesForDocumentRequest
    ): [Note]
    shareNote(
      request: ShareNoteRequest!
    ): UserNotePermission!
    deleteNote(request: DeleteNoteRequest!): Void
    unshareNote(request: UnshareNoteRequest!): Void
  }
`;

async function saveNoteTitle(
  _parent: any,
  { request }: { request: SaveNoteTitleRequest },
  context: any
) {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  const noteToEdit = await NoteDB.fromNoteIDAndUser({
    user: context.user,
    noteID: request.noteID
  });
  if (!noteToEdit) {
    throw new GraphQLError(
      'Not authorized to edit note'
    );
  }
  noteToEdit.title = request.title;
  await prisma.note.update(noteToEdit.toPrismaUpdate());
}

async function saveNote(
  _parent: any,
  { request }: { request: SaveNoteRequest },
  context: any
) {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  const noteToEdit = await NoteDB.fromNoteIDAndUser({
    user: context.user,
    noteID: request.noteID
  });
  if (!noteToEdit) {
    throw new GraphQLError(
      'Not authorized to edit note'
    );
  }
  noteToEdit.content = JSON.parse(request.content);
  await prisma.note.update(noteToEdit.toPrismaUpdate());
}

async function createNote(
  _parent: any,
  { request }: { request: CreateNoteRequest },
  context: any
) {
  if (!context.user) {
    throw new Error('Not authenticated');
  }
  const noteModel = NoteModel.fromGraphQL({
    request,
    user: context.user
  });

  const note = await prisma.note.create({
    data: noteModel.toPrismaCreate(),
    include: {
      userNotePermissions: { include: { user: true } }
    }
  });

  const createdNote = NoteDBModel.fromPrisma(note);

  return createdNote.toGraphQL();
}

async function getNotesForDocument(
  _parent: any,
  { request }: { request: GetNotesForDocumentRequest },
  context: { user: UserDB }
) {
  const document = await DocumentDB.fromDocumentID(
    context.user,
    request.documentID
  );
  const notes = await NoteDB.fromDocumentAndUser({
    document,
    user: context.user
  });
  return notes.map((n) => n.toGraphQL());
}

async function shareNote(
  _parent: any,
  { request }: { request: ShareNoteRequest },
  context: { user: UserDB }
) {
  const note = await NoteDB.fromNoteIDAndUser({
    noteID: request.noteID,
    user: context.user
  });
  const document = await DocumentDB.fromDocumentID(
    context.user,
    note.documentID
  );
  const userToShareWith = await UserDB.fromUsername(
    request.username
  );
  const sharingPermission =
    await UserNotePermissionDB.fromNoteIDUserID({
      noteID: request.noteID,
      userID: context.user.userID
    });
  
  // allow any user who can see any document version to be shared on note
  // TODO: only allow users to share with collaborators they can actually see on the document
  if (!document.userHasAccess(userToShareWith)) {
    throw new GraphQLError(
      'shareNote: User is not shared on document'
    );
  }
  if (!sharingPermission.canShareNote()) {
    throw new GraphQLError(
      'shareNote: User has insufficient perms to share note'
    );
  }
  const newPermission =
    await prisma.userNotePermission.create({
      data: {
        noteID: request.noteID,
        userID: userToShareWith.userID,
        role: request.role
      },
      include: { user: true }
    });
  return UserNotePermissionDB.fromPrismaWithUser(
    newPermission
  ).toGraphQL();
}

async function deleteNote(
  _parent: any,
  { request }: { request: DeleteNoteRequest },
  context: { user: UserDB }
) {
  const notePermission =
    await UserNotePermissionDB.fromNoteIDUserID({
      noteID: request.noteID,
      userID: context.user.userID
    });
  if (notePermission.canDeleteNote()) {
    // delete the note for everyone
    await prisma.note.delete({
      where: { noteID: request.noteID }
    });
  } else {
    // unshare self
    await prisma.userNotePermission.delete({
      where: {
        userNotePermissionID:
          notePermission.userNotePermissionID
      }
    });
  }
}

async function unshareNote(
  _parent: any,
  { request }: { request: UnshareNoteRequest },
  context: { user: UserDB }
) {
  const notePermission =
    await UserNotePermissionDB.fromUserNotePermissionID({
      userNotePermissionID: request.userNotePermissionID
    });
  const callerPermission =
    await UserNotePermissionDB.fromNoteIDUserID({
      noteID: notePermission.noteID,
      userID: context.user.userID
    });
  if (
    !callerPermission.canShareNote() ||
    callerPermission.noteID !== notePermission.noteID
  ) {
    throw new GraphQLError(
      'shareNote: User has insufficient perms to unshare note'
    );
  }
  await prisma.userNotePermission.delete({
    where: {
      userNotePermissionID:
        notePermission.userNotePermissionID
    }
  });
}

const resolvers: Resolvers = {
  Mutation: {
    saveNoteTitle,
    saveNote,
    createNote,
    getNotesForDocument,
    shareNote,
    deleteNote,
    unshareNote
  }
};

export default { typeDefs, resolvers };
