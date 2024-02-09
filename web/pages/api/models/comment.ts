import {
  Comment as pr_Comment,
  Prisma,
  User as pr_User
} from '../../../generated/prisma';
import {
  CreateCommentRequest,
  Comment as gql_Comment,
  CreateCommentResponse
} from '../../../generated/types/graphql';
import { DocumentVersionDB } from './documentVersion';
import { UserDB } from '../../../pages/api/models/user';
import prisma from '../../../utils/prisma';

export class Comment {
  commentData: any;
  documentVersionID?: string;
  authorID: string;
  private: boolean;
  resolved: boolean;
  selectedText: string;

  constructor(arg: {
    commentData: any;
    documentVersionID?: string;
    authorID: string;
    private: boolean;
    resolved: boolean;
    selectedText: string;
  }) {
    this.commentData = arg.commentData;
    this.documentVersionID = arg.documentVersionID;
    this.authorID = arg.authorID;
    this.private = arg.private;
    this.resolved = arg.resolved;
    this.selectedText = arg.selectedText;
  }

  static async fromGraphQL(arg: {
    request: CreateCommentRequest;
    document: DocumentVersionDB;
    user: UserDB;
  }) {
    return new this({
      commentData: arg.request.commentData,
      documentVersionID: arg.document.documentVersionID,
      authorID: arg.user.userID,
      // TODO: allow users to create private comments
      private: false,
      resolved: false,
      selectedText: arg.request.selectedText
    });
  }
}

export class CommentDB extends Comment {
  commentID: string;
  user: UserDB;

  constructor(arg: {
    commentData: any;
    documentVersionID?: string;
    commentID: string;
    user: UserDB;
    resolved: boolean;
    private: boolean;
    selectedText: string;
  }) {
    super({ ...arg, authorID: arg.user.userID });
    this.commentID = arg.commentID;
    this.user = arg.user;
  }
  static fromPrisma(
    record: pr_Comment & { author: pr_User }
  ) {
    return new this({
      commentData: record.commentData,
      commentID: record.commentID,
      documentVersionID: record.documentVersionID,
      user: UserDB.fromPrisma(record.author),
      resolved: record.resolved,
      private: record.private,
      selectedText: record.selectedText
    });
  }
  toGraphQL(): gql_Comment {
    return {
      commentData: JSON.stringify(this.commentData),
      commentID: this.commentID,
      user: this.user.toGraphQL(),
      resolved: this.resolved,
      selectedText: this.selectedText
    };
  }
  static fromGraphQLResponse(arg: {
    response: CreateCommentResponse;
  }): CommentDB {
    return new this({
      commentID: arg.response.createdComment.commentID,
      user: UserDB.fromGraphQL(
        arg.response.createdComment.user
      ),
      commentData: JSON.parse(
        arg.response.createdComment.commentData
      ),
      private: false,
      resolved: false,
      selectedText: arg.response.createdComment.selectedText
    });
  }
  static async fromCommentID(
    commentID: string
  ): Promise<CommentDB> {
    const prismaComment =
      await prisma.comment.findUniqueOrThrow({
        where: { commentID },
        include: {
          author: true
        }
      });
    return this.fromPrisma(prismaComment);
  }
  resolveCommentPrisma(): Prisma.CommentUpdateArgs {
    if (this.resolved) {
      throw Error(
        'resolveCommentPrisma: comment is already resolved'
      );
    }
    return {
      where: {
        commentID: this.commentID
      },
      data: {
        resolved: true
      }
    };
  }
}
