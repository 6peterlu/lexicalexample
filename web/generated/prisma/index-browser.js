
Object.defineProperty(exports, "__esModule", { value: true });

const {
  Decimal,
  objectEnumValues,
  makeStrictEnum,
  Public,
} = require('./runtime/index-browser')


const Prisma = {}

exports.Prisma = Prisma

/**
 * Prisma Client JS version: 4.16.0
 * Query Engine version: b20ead4d3ab9e78ac112966e242ded703f4a052c
 */
Prisma.prismaVersion = {
  client: "4.16.0",
  engine: "b20ead4d3ab9e78ac112966e242ded703f4a052c"
}

Prisma.PrismaClientKnownRequestError = () => {
  throw new Error(`PrismaClientKnownRequestError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)};
Prisma.PrismaClientUnknownRequestError = () => {
  throw new Error(`PrismaClientUnknownRequestError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientRustPanicError = () => {
  throw new Error(`PrismaClientRustPanicError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientInitializationError = () => {
  throw new Error(`PrismaClientInitializationError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.PrismaClientValidationError = () => {
  throw new Error(`PrismaClientValidationError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.NotFoundError = () => {
  throw new Error(`NotFoundError is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.Decimal = Decimal

/**
 * Re-export of sql-template-tag
 */
Prisma.sql = () => {
  throw new Error(`sqltag is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.empty = () => {
  throw new Error(`empty is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.join = () => {
  throw new Error(`join is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.raw = () => {
  throw new Error(`raw is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.validator = Public.validator

/**
* Extensions
*/
Prisma.getExtensionContext = () => {
  throw new Error(`Extensions.getExtensionContext is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}
Prisma.defineExtension = () => {
  throw new Error(`Extensions.defineExtension is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
)}

/**
 * Shorthand utilities for JSON filtering
 */
Prisma.DbNull = objectEnumValues.instances.DbNull
Prisma.JsonNull = objectEnumValues.instances.JsonNull
Prisma.AnyNull = objectEnumValues.instances.AnyNull

Prisma.NullTypes = {
  DbNull: objectEnumValues.classes.DbNull,
  JsonNull: objectEnumValues.classes.JsonNull,
  AnyNull: objectEnumValues.classes.AnyNull
}

/**
 * Enums
 */

exports.Prisma.TransactionIsolationLevel = makeStrictEnum({
  ReadUncommitted: 'ReadUncommitted',
  ReadCommitted: 'ReadCommitted',
  RepeatableRead: 'RepeatableRead',
  Serializable: 'Serializable'
});

exports.Prisma.UserScalarFieldEnum = {
  userID: 'userID',
  username: 'username',
  appDrawerNoteIDs: 'appDrawerNoteIDs',
  firstName: 'firstName',
  lastName: 'lastName',
  email: 'email',
  longestStreak: 'longestStreak',
  bio: 'bio',
  city: 'city',
  country: 'country',
  website: 'website',
  twitter: 'twitter',
  instagram: 'instagram',
  createdAt: 'createdAt',
  openAIAPICalls: 'openAIAPICalls'
};

exports.Prisma.FollowsScalarFieldEnum = {
  followerID: 'followerID',
  followingID: 'followingID'
};

exports.Prisma.NoteScalarFieldEnum = {
  noteID: 'noteID',
  title: 'title',
  content: 'content',
  icon: 'icon',
  updatedAt: 'updatedAt',
  documentID: 'documentID',
  personal: 'personal'
};

exports.Prisma.DocumentVersionScalarFieldEnum = {
  documentVersionID: 'documentVersionID',
  content: 'content',
  updatedAt: 'updatedAt',
  createdAt: 'createdAt',
  documentID: 'documentID',
  versionName: 'versionName',
  wordCount: 'wordCount'
};

exports.Prisma.DocumentScalarFieldEnum = {
  documentID: 'documentID',
  title: 'title',
  updatedAt: 'updatedAt'
};

exports.Prisma.UserEnhancedDocumentPermissionsScalarFieldEnum = {
  userID: 'userID',
  enhancedDocumentID: 'enhancedDocumentID',
  role: 'role'
};

exports.Prisma.EnhancedDocumentScalarFieldEnum = {
  enhancedDocumentID: 'enhancedDocumentID',
  notesContent: 'notesContent',
  embeddingsByNodeID: 'embeddingsByNodeID',
  title: 'title',
  updatedAt: 'updatedAt',
  draftContent: 'draftContent',
  draftCollapsed: 'draftCollapsed',
  ideas: 'ideas'
};

exports.Prisma.ThreadAttributesScalarFieldEnum = {
  threadID: 'threadID',
  userID: 'userID',
  createdAt: 'createdAt',
  updatedAt: 'updatedAt',
  archivedAt: 'archivedAt',
  enhancedDocumentID: 'enhancedDocumentID',
  sectionData: 'sectionData'
};

exports.Prisma.ChatMessageScalarFieldEnum = {
  chatMessageID: 'chatMessageID',
  content: 'content',
  author: 'author',
  createdAt: 'createdAt',
  threadID: 'threadID'
};

exports.Prisma.PublishedDocumentScalarFieldEnum = {
  publishedDocumentID: 'publishedDocumentID',
  documentID: 'documentID',
  content: 'content',
  url: 'url',
  userID: 'userID',
  publishedAt: 'publishedAt',
  updatedAt: 'updatedAt',
  title: 'title',
  subtitle: 'subtitle'
};

exports.Prisma.ScratchpadEntryScalarFieldEnum = {
  scratchpadEntryID: 'scratchpadEntryID',
  content: 'content',
  date: 'date',
  userID: 'userID'
};

exports.Prisma.CommentScalarFieldEnum = {
  commentID: 'commentID',
  commentData: 'commentData',
  authorID: 'authorID',
  documentVersionID: 'documentVersionID',
  updatedAt: 'updatedAt',
  private: 'private',
  resolved: 'resolved',
  selectedText: 'selectedText'
};

exports.Prisma.UserDocumentPermissionScalarFieldEnum = {
  userDocumentPermissionID: 'userDocumentPermissionID',
  userID: 'userID',
  documentVersionID: 'documentVersionID',
  role: 'role',
  documentID: 'documentID'
};

exports.Prisma.UserNotePermissionScalarFieldEnum = {
  userNotePermissionID: 'userNotePermissionID',
  userID: 'userID',
  role: 'role',
  noteID: 'noteID'
};

exports.Prisma.UserDocumentAttributesScalarFieldEnum = {
  documentID: 'documentID',
  userID: 'userID',
  lastOpenedDocumentVersionID: 'lastOpenedDocumentVersionID'
};

exports.Prisma.DailyStatUnitScalarFieldEnum = {
  dailyStatUnitID: 'dailyStatUnitID',
  userID: 'userID',
  documentVersionID: 'documentVersionID',
  documentID: 'documentID',
  dailyChallengeResponseID: 'dailyChallengeResponseID',
  date: 'date',
  timeSpentSeconds: 'timeSpentSeconds',
  wordsAdded: 'wordsAdded',
  wordsRemoved: 'wordsRemoved'
};

exports.Prisma.WritingSessionScalarFieldEnum = {
  writingSessionID: 'writingSessionID',
  userID: 'userID',
  segmentTime: 'segmentTime',
  wordsAdded: 'wordsAdded',
  wordsRemoved: 'wordsRemoved',
  timeSpentSeconds: 'timeSpentSeconds',
  startDateTime: 'startDateTime',
  title: 'title',
  documentID: 'documentID',
  inProgress: 'inProgress',
  updatedAt: 'updatedAt'
};

exports.Prisma.DailyChallengeScalarFieldEnum = {
  prompt: 'prompt',
  date: 'date',
  id: 'id'
};

exports.Prisma.DailyChallengeResponseLikesScalarFieldEnum = {
  userID: 'userID',
  dailyChallengeResponseID: 'dailyChallengeResponseID',
  likeID: 'likeID'
};

exports.Prisma.DailyChallengeResponseScalarFieldEnum = {
  userID: 'userID',
  dailyChallengeID: 'dailyChallengeID',
  dailyChallengeResponseID: 'dailyChallengeResponseID',
  content: 'content',
  postedOn: 'postedOn',
  wordCount: 'wordCount',
  completedOnTime: 'completedOnTime'
};

exports.Prisma.DailyChallengePromptSuggestionScalarFieldEnum = {
  promptSuggestionID: 'promptSuggestionID',
  prompt: 'prompt',
  userID: 'userID',
  createdAt: 'createdAt',
  usedOn: 'usedOn'
};

exports.Prisma.SortOrder = {
  asc: 'asc',
  desc: 'desc'
};

exports.Prisma.NullableJsonNullValueInput = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull
};

exports.Prisma.JsonNullValueInput = {
  JsonNull: Prisma.JsonNull
};

exports.Prisma.QueryMode = {
  default: 'default',
  insensitive: 'insensitive'
};

exports.Prisma.NullsOrder = {
  first: 'first',
  last: 'last'
};

exports.Prisma.JsonNullValueFilter = {
  DbNull: Prisma.DbNull,
  JsonNull: Prisma.JsonNull,
  AnyNull: Prisma.AnyNull
};
exports.EnhancedDocumentRole = {
  OWNER: 'OWNER'
};

exports.ChatMessageAuthor = {
  USER: 'USER',
  SYSTEM: 'SYSTEM'
};

exports.Role = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR',
  LEAD_REVIEWER: 'LEAD_REVIEWER',
  REVIEWER: 'REVIEWER'
};

exports.NoteRole = {
  OWNER: 'OWNER',
  ADMIN: 'ADMIN',
  EDITOR: 'EDITOR'
};

exports.Prisma.ModelName = {
  User: 'User',
  Follows: 'Follows',
  Note: 'Note',
  DocumentVersion: 'DocumentVersion',
  Document: 'Document',
  UserEnhancedDocumentPermissions: 'UserEnhancedDocumentPermissions',
  EnhancedDocument: 'EnhancedDocument',
  ThreadAttributes: 'ThreadAttributes',
  ChatMessage: 'ChatMessage',
  PublishedDocument: 'PublishedDocument',
  ScratchpadEntry: 'ScratchpadEntry',
  Comment: 'Comment',
  UserDocumentPermission: 'UserDocumentPermission',
  UserNotePermission: 'UserNotePermission',
  UserDocumentAttributes: 'UserDocumentAttributes',
  DailyStatUnit: 'DailyStatUnit',
  WritingSession: 'WritingSession',
  DailyChallenge: 'DailyChallenge',
  DailyChallengeResponseLikes: 'DailyChallengeResponseLikes',
  DailyChallengeResponse: 'DailyChallengeResponse',
  DailyChallengePromptSuggestion: 'DailyChallengePromptSuggestion'
};

/**
 * Create the Client
 */
class PrismaClient {
  constructor() {
    throw new Error(
      `PrismaClient is unable to be run in the browser.
In case this error is unexpected for you, please report it in https://github.com/prisma/prisma/issues`,
    )
  }
}
exports.PrismaClient = PrismaClient

Object.assign(exports, Prisma)
