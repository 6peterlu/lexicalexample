import {
  EditorState,
  LexicalNode,
  RangeSelection
} from 'lexical';
import {
  CreateCommentRequest,
  Comment as gql_Comment,
  CreateCommentResponse
} from '../generated/types/graphql';
import * as t from 'io-ts';
import { UserDB } from './user';

// this utility function can be used to turn a TypeScript enum into a io-ts codec.
// copied from https://github.com/gcanti/io-ts/issues/216#issuecomment-599020040
export function fromEnum<EnumType extends string>(
  enumName: string,
  theEnum: Record<string, EnumType>
): t.Type<EnumType, EnumType, unknown> {
  const isEnumValue = (input: unknown): input is EnumType =>
    Object.values<unknown>(theEnum).includes(input);

  return new t.Type<EnumType>(
    enumName,
    isEnumValue,
    (input, context) =>
      isEnumValue(input)
        ? t.success(input)
        : t.failure(input, context),
    t.identity
  );
}

// export type CommentLocation = {
//   focus: { offset: number; type: string };
//   anchor: { offset: number; type: string };
//   isBackward: boolean;
//   format: number;
// };

export enum CommentType {
  TEXT = 'text'
}

const CommentTypeV = fromEnum('CommentType', CommentType);
interface CommentData {
  type: CommentType;
}

export interface TextCommentData extends CommentData {
  text: string;
}

export const TextCommentDataChecker = t.type({
  text: t.string,
  type: CommentTypeV
});

export class Comment {
  commentData: any;
  documentID?: string;
  resolved: boolean;
  selectedText: string;

  constructor(arg: {
    commentData: any;
    documentID?: string;
    resolved: boolean;
    selectedText: string;
  }) {
    this.commentData = arg.commentData;
    this.documentID = arg.documentID;
    this.resolved = arg.resolved;
    this.selectedText = arg.selectedText;
  }
}

export class CommentDB extends Comment {
  commentID: string;
  user: UserDB;

  constructor(arg: {
    commentData: any;
    documentID?: string;
    commentID: string;
    user: UserDB;
    resolved: boolean;
    selectedText: string;
  }) {
    super(arg);
    this.commentID = arg.commentID;
    this.user = arg.user;
  }
  toGraphQL(): gql_Comment {
    return {
      commentData: JSON.stringify(this.commentData),
      commentID: this.commentID
    };
  }
  static fromGraphQLResponse(arg: {
    response: gql_Comment;
  }): CommentDB {
    return new this({
      commentID: arg.response.commentID,
      commentData: JSON.parse(arg.response.commentData),
      user: UserDB.fromGraphQL(arg.response.user),
      resolved: arg.response.resolved,
      selectedText: arg.response.selectedText
    });
  }
}
