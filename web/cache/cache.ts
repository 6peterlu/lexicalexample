import { InMemoryCache, makeVar } from '@apollo/client';
import { EditorState, LexicalEditor } from 'lexical';
import { EditorModes } from '../components/EditorModeMenu';
import { Note } from '../generated/types/graphql';
import { CommentDB as CommentDBModel } from '../models/comment';
import {
  Document,
  DocumentMetadata
} from '../models/document';
import { DocumentVersionDualID } from '../models/documentVersion';
import { NoteDB } from '../models/note';
import { UserDB } from '../models/user';
import { ChallengeResponseData } from '../pages/challenge/[date]';

// TODO: probably don't need this anymore
export const cache: InMemoryCache = new InMemoryCache({
  typePolicies: {
    Query: {
      fields: {
        notes: {
          read() {
            return notesVar();
          }
        },
        notesLoading: {
          read(): boolean {
            return notesLoadingVar();
          }
        }
      }
    }
  }
});

export enum Role {
  ADMIN = 'admin',
  EDITOR = 'editor',
  PRINCIPAL_REVIEWER = 'principalReviewer',
  REVIEWER_1 = 'reviewer1',
  REVIEWER_2 = 'reviewer2'
}

// Create the initial value
const notesInitialValue: Note[] = [];

export const notesVar = makeVar<Note[]>(notesInitialValue);

export const appDrawerNotesVar = makeVar<Note[]>([]);

export const currentNoteVar = makeVar<NoteDB>(null);

export const commentsVar = makeVar<CommentDBModel[]>([]);

export const selectedCommentVar = makeVar<
  string | undefined
>(undefined);

export const roleVar = makeVar<Role>(Role.ADMIN);

export const notesLoadingVar = makeVar<boolean>(false);

// used to render documents selector screen
export const documentsVar =
  makeVar<DocumentMetadata[]>(null);

// used to render shared documents screen
export const sharedDocumentsVar =
  makeVar<DocumentMetadata[]>(null);

// used to render document versions
export const currentDocumentVar = makeVar<Document>(null);

// used to share version name and document ID
export const currentDocumentVersionIDVar =
  makeVar<DocumentVersionDualID>(null);

// used to change editor overlays
export const currentEditorModeVar = makeVar<EditorModes[]>(
  []
);

export const markNodeMapVar = makeVar<{
  [key: string]: {
    commentID: string;
    verticalOffset: number;
  };
}>({});

export const headerHeightsVar = makeVar<{
  [key: string]: number;
}>({});

export const selectedDocumentIDVar = makeVar<string>(null);

// used to render analytics highlight layer
export const analyticsLayerStateVar = makeVar<
  EditorState | string
>(null);

export const wordCounterStateVar = makeVar<number>(null);

export const userInfoVar = makeVar<UserDB>(null);

export const notesListVar = makeVar<NoteDB[]>([]);

export const showResolvedCommentsVar =
  makeVar<boolean>(false);

export const commentIDsAlreadyRenderedVar = makeVar<
  string[]
>([]);
export const timeSpentSecondsTrackerVar = makeVar<{
  timeStartMillis: number[];
  timeEndMillis: number[];
}>({ timeStartMillis: [], timeEndMillis: [] });

export const challengeResponseVar =
  makeVar<ChallengeResponseData>(null);

export const textContentVar = makeVar<string>(null);

export const currentDocumentVersionContentVar =
  makeVar<EditorState>(null);

export const currentWritingSessionIDVar =
  makeVar<string>(null);

export type OutlineState = {
  key: string;
  title: string;
  description: string[];
};

export const currentEditorHeaderIDsVar = makeVar<string[]>(
  []
);

export const activeEditorVar = makeVar<LexicalEditor>(null);

export const outlinePanelOpenVar = makeVar<boolean>(false);
export const activeDocumentHeaderVar =
  makeVar<string>(null);

export const chatWindowOpenVar = makeVar<boolean>(false);

export const draftEditorContextVar =
  makeVar<LexicalEditor>(null);
