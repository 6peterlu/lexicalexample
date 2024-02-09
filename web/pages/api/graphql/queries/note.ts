import {
  DocumentNode,
  gql,
  Resolvers
} from '@apollo/client';
import {
  GetNoteRequest,
  GetNotesForDocumentRequest,
  GetNotesForDocumentResponse,
  Note as gql_Note
} from '../../../../generated/types/graphql';
import { DocumentDB } from '../../models/document';
import { UserDB } from '../../models/user';
import { NoteDB } from '../../models/note';

const typeDefs: DocumentNode = gql`
  input GetNotesForDocumentRequest {
    documentID: String!
  }
  type GetNotesForDocumentResponse {
    noteList: [NoteMetadata!]!
  }
  input GetNoteRequest {
    noteID: String!
  }
  extend type Query {
    getNotesForDocument(
      args: GetNotesForDocumentRequest!
    ): GetNotesForDocumentResponse!
    getNote(args: GetNoteRequest): Note!
  }
`;

async function getNotesForDocument(
  _parent: any,
  { args }: { args: GetNotesForDocumentRequest },
  context: { user: UserDB }
): Promise<GetNotesForDocumentResponse> {
  const document = await DocumentDB.fromDocumentID(
    context.user,
    args.documentID
  );
  const notes = await NoteDB.fromDocumentAndUser({
    document,
    user: context.user
  });
  return {
    noteList: notes.map((n) => n.toGraphQLMetadata())
  };
}

async function getNote(
  _parent: any,
  { args }: { args: GetNoteRequest },
  context: { user: UserDB }
): Promise<gql_Note> {
  console;
  const note = await NoteDB.fromNoteIDAndUser({
    noteID: args.noteID,
    user: context.user
  });
  return note.toGraphQL();
}

const resolvers: Resolvers = {
  Query: {
    getNotesForDocument,
    getNote
  }
};

export default { typeDefs, resolvers };
