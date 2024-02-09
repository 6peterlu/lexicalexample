import { gql, useQuery } from '@apollo/client';
import { useEffect } from 'react';
import { notesListVar } from '../cache/cache';
import { Note as gql_Note } from '../generated/types/graphql';
import { NoteDB } from '../models/note';

const GET_NOTES_FOR_DOC = gql`
  query getNotesForDocument($documentID: String!) {
    getNotesForDocument(args: { documentID: $documentID }) {   
      noteList {
        title
        noteID
        userNotePermissions {
          noteID
          userID
          role
          username
        }
        personal
      }
    }
  }
`;

export function useNotes({
  documentID
}: {
  documentID: string;
}) {
  const {
    called: getNotesCalled,
    loading: getNotesLoading,
    error: getNotesError,
    data: getNotesQueryData
  } = useQuery(GET_NOTES_FOR_DOC, {
    fetchPolicy: 'no-cache',
    variables: {
      documentID
    }
  });
  useEffect(() => {
    if (getNotesQueryData?.getNotesForDocument) {
      const queryResponse =
        getNotesQueryData.getNotesForDocument;
      notesListVar(
        queryResponse.noteList.map((n: gql_Note) =>
          NoteDB.fromGraphQL(n)
        )
      );
    }
  }, [getNotesQueryData]);
}
