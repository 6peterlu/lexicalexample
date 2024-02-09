export type Maybe<T> = T | null;
export type InputMaybe<T> = Maybe<T>;
export type Exact<T extends { [key: string]: unknown }> = { [K in keyof T]: T[K] };
export type MakeOptional<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]?: Maybe<T[SubKey]> };
export type MakeMaybe<T, K extends keyof T> = Omit<T, K> & { [SubKey in K]: Maybe<T[SubKey]> };
/** All built-in and custom scalars, mapped to their actual values */
export type Scalars = {
  ID: string;
  String: string;
  Boolean: boolean;
  Int: number;
  Float: number;
  Date: any;
  DateTime: any;
  JSON: any;
  Void: any;
};

export enum ActionPermission {
  CreateCommentOnDocumentVersion = 'CreateCommentOnDocumentVersion',
  DeleteDocumentVersionForAll = 'DeleteDocumentVersionForAll',
  DeleteNoteForAll = 'DeleteNoteForAll',
  EditDocumentVersionContent = 'EditDocumentVersionContent',
  PublishDocumentVersion = 'PublishDocumentVersion',
  RemoveCollaboratorFromDocumentVersion = 'RemoveCollaboratorFromDocumentVersion',
  RenameDocumentVersion = 'RenameDocumentVersion',
  ShareDocument = 'ShareDocument',
  ShareDocumentVersion = 'ShareDocumentVersion'
}

export type Comment = {
  __typename?: 'Comment';
  commentData?: Maybe<Scalars['String']>;
  commentID?: Maybe<Scalars['String']>;
  resolved?: Maybe<Scalars['Boolean']>;
  selectedText?: Maybe<Scalars['String']>;
  user?: Maybe<User>;
};

export type CompleteWritingSessionRequest = {
  writingSessionID: Scalars['String'];
};

export type ContinueChatConversationRequest = {
  chatMessage: Scalars['String'];
  enhancedDocumentID: Scalars['String'];
  threadID: Scalars['String'];
};

export type ContinueChatConversationResponse = {
  __typename?: 'ContinueChatConversationResponse';
  responseMessage: Scalars['String'];
};

export type CreateCommentRequest = {
  commentData: Scalars['String'];
  documentID: Scalars['String'];
  selectedText: Scalars['String'];
  versionName?: InputMaybe<Scalars['String']>;
};

export type CreateCommentResponse = {
  __typename?: 'CreateCommentResponse';
  createdComment: Comment;
};

export type CreateDocumentResponse = {
  __typename?: 'CreateDocumentResponse';
  documentID: Scalars['String'];
};

export type CreateDocumentVersionRequest = {
  sourceDocumentVersionID: Scalars['String'];
  versionName: Scalars['String'];
};

export type CreateNoteRequest = {
  documentID: Scalars['String'];
};

export type CreateWritingSessionRequest = {
  documentID: Scalars['String'];
};

export type DailyChallenge = {
  __typename?: 'DailyChallenge';
  content: Scalars['String'];
  date: Scalars['Date'];
  id: Scalars['Int'];
};

export type DailyChallengeResponse = {
  __typename?: 'DailyChallengeResponse';
  content?: Maybe<Scalars['String']>;
  dailyChallengeID: Scalars['Int'];
  dailyChallengeResponseID?: Maybe<Scalars['String']>;
  likes: Array<Scalars['String']>;
  postedOn?: Maybe<Scalars['DateTime']>;
  userID?: Maybe<Scalars['String']>;
};

export type DailyChallengeStatus = {
  __typename?: 'DailyChallengeStatus';
  completedOnTime: Scalars['Boolean'];
  date: Scalars['Date'];
  status: Scalars['Int'];
};

export type DeleteDocumentForUserRequest = {
  documentID: Scalars['String'];
};

export type DeleteDocumentRequest = {
  documentID: Scalars['String'];
};

export type DeleteDocumentVersionRequest = {
  documentVersionID: Scalars['String'];
};

export type DeleteEnhancedDocumentRequest = {
  enhancedDocumentID: Scalars['String'];
};

export type DeleteNoteRequest = {
  noteID: Scalars['String'];
};

export type DeleteWritingSessionRequest = {
  writingSessionID: Scalars['String'];
};

export type DocumentMetadata = {
  __typename?: 'DocumentMetadata';
  documentID: Scalars['String'];
  documentVersions: Array<DocumentVersionMetadata>;
  lastOpenedDocumentVersionID?: Maybe<Scalars['String']>;
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
  userDocumentPermissions: Array<UserDocumentPermissionMetadata>;
};

export type DocumentVersion = {
  __typename?: 'DocumentVersion';
  actionPermissions: Array<ActionPermission>;
  content?: Maybe<Scalars['String']>;
  documentVersionID: Scalars['String'];
  userDocumentPermissions: Array<UserDocumentPermissionMetadata>;
  versionName: Scalars['String'];
};

export type DocumentVersionMetadata = {
  __typename?: 'DocumentVersionMetadata';
  createdAt: Scalars['DateTime'];
  documentVersionID: Scalars['String'];
  versionName?: Maybe<Scalars['String']>;
};

export enum EditableNoteRole {
  Admin = 'ADMIN',
  Editor = 'EDITOR'
}

export enum EditableRole {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  LeadReviewer = 'LEAD_REVIEWER',
  Reviewer = 'REVIEWER'
}

export type EmbeddingCallInput = {
  nodeID: Scalars['String'];
  text: Scalars['String'];
};

export type EnhancedDocument = {
  __typename?: 'EnhancedDocument';
  draftCollapsed: Scalars['Boolean'];
  draftContent?: Maybe<Scalars['String']>;
  embeddingsByNodeID: Scalars['String'];
  enhancedDocumentID: Scalars['String'];
  ideas: Array<Scalars['String']>;
  notesContent: Scalars['String'];
  title: Scalars['String'];
};

export type EnhancedDocumentMetadata = {
  __typename?: 'EnhancedDocumentMetadata';
  enhancedDocumentID: Scalars['String'];
  title: Scalars['String'];
  updatedAt: Scalars['DateTime'];
};

export type ExtrapolateIdeaInContextRequest = {
  enhancedDocumentID: Scalars['String'];
  followingText: Scalars['String'];
  idea: Scalars['String'];
  precedingText: Scalars['String'];
};

export type ExtrapolateIdeaInContextResponse = {
  __typename?: 'ExtrapolateIdeaInContextResponse';
  extrapolatedIdea: Scalars['String'];
};

export type FeedItem = {
  __typename?: 'FeedItem';
  date: Scalars['DateTime'];
  feedItemType: FeedItemType;
  serializedData: Scalars['String'];
};

export enum FeedItemType {
  WritingSession = 'WritingSession'
}

export type FollowUserRequest = {
  userID: Scalars['String'];
};

export type GenerateDraftRequest = {
  document: Scalars['String'];
  enhancedDocumentID: Scalars['String'];
};

export type GenerateDraftResponse = {
  __typename?: 'GenerateDraftResponse';
  draft: Scalars['String'];
};

export type GetAllPublishedDocumentVersionsForUserInput = {
  username: Scalars['String'];
};

export type GetCommentsForDocumentRequest = {
  documentID: Scalars['String'];
  resolved: Scalars['Boolean'];
  versionName?: InputMaybe<Scalars['String']>;
};

export type GetCommentsForDocumentResponse = {
  __typename?: 'GetCommentsForDocumentResponse';
  comments: Array<Comment>;
};

export type GetContentForScratchpadEntriesRequest = {
  dates: Array<Scalars['Date']>;
};

export type GetDailyChallengeForDateRequest = {
  date: Scalars['Date'];
};

export type GetDailyChallengeForDateResponse = {
  __typename?: 'GetDailyChallengeForDateResponse';
  prompt: DailyChallenge;
  response?: Maybe<DailyChallengeResponse>;
};

export type GetDailyChallengeStatusesForTrackingPageRequest = {
  endDate: Scalars['Date'];
  startDate: Scalars['Date'];
};

export type GetDocumentRequest = {
  documentID: Scalars['String'];
};

export type GetDocumentResponse = {
  __typename?: 'GetDocumentResponse';
  actionPermissions: Array<ActionPermission>;
  documentID: Scalars['String'];
  documentVersionMetadataList: Array<DocumentVersionMetadata>;
  title: Scalars['String'];
  userDocumentPermissions: Array<UserDocumentPermissionMetadata>;
};

export type GetDocumentVersionFromVersionNameRequest = {
  documentID: Scalars['String'];
  versionName?: InputMaybe<Scalars['String']>;
};

export type GetDocumentVersionRequest = {
  documentVersionID: Scalars['String'];
};

export type GetDocumentsResponse = {
  __typename?: 'GetDocumentsResponse';
  documents: Array<DocumentMetadata>;
};

export type GetEmbeddingInput = {
  allNodeIDs: Array<Scalars['String']>;
  embeddingID: Scalars['String'];
  embeddingInputs: Array<EmbeddingCallInput>;
  enhancedDocumentID: Scalars['String'];
};

export type GetEmbeddingOutput = {
  __typename?: 'GetEmbeddingOutput';
  embeddingID: Scalars['String'];
  linkageExplainer: Scalars['String'];
  nodeList: Array<Scalars['String']>;
  similarityMatrix: Array<Array<Scalars['Float']>>;
};

export type GetEnhancedDocumentRequest = {
  enhancedDocumentID: Scalars['String'];
};

export type GetIdeasRequest = {
  enhancedDocumentID?: InputMaybe<Scalars['String']>;
  text: Scalars['String'];
};

export type GetIdeasResponse = {
  __typename?: 'GetIdeasResponse';
  ideas: Array<Scalars['String']>;
};

export type GetLikesForPublishedDocumentVersionRequest = {
  publishedDocumentID: Scalars['String'];
};

export type GetNoteRequest = {
  noteID: Scalars['String'];
};

export type GetNotesForDocumentRequest = {
  documentID: Scalars['String'];
};

export type GetNotesForDocumentResponse = {
  __typename?: 'GetNotesForDocumentResponse';
  noteList: Array<NoteMetadata>;
};

export type GetOthersDailyChallengeResponsesRequest = {
  dailyChallengeID: Scalars['Int'];
  responseString?: InputMaybe<Scalars['String']>;
};

export type GetPublishedDocumentVersionInput = {
  documentID?: InputMaybe<Scalars['String']>;
  slug?: InputMaybe<Scalars['String']>;
  userID?: InputMaybe<Scalars['String']>;
  username?: InputMaybe<Scalars['String']>;
};

export type GetScratchpadEntriesForUserRequest = {
  date: Scalars['Date'];
};

export type GetSharedWithRequest = {
  documentID: Scalars['String'];
  versionName?: InputMaybe<Scalars['String']>;
};

export type GetSharedWithResponse = {
  __typename?: 'GetSharedWithResponse';
  sharedOnDocument: Array<UserDocumentPermissionMetadata>;
  sharedOnDocumentVersion: Array<UserDocumentPermissionMetadata>;
};

export type GetStatSegmentRequest = {
  endDate: Scalars['Date'];
  startDate: Scalars['Date'];
  username?: InputMaybe<Scalars['String']>;
};

export type GetUserProfileDataRequest = {
  username: Scalars['String'];
};

export type GetUserResponse = {
  __typename?: 'GetUserResponse';
  redirectURL?: Maybe<Scalars['String']>;
  user?: Maybe<User>;
};

export type GetWritingSessionForDocumentRequest = {
  documentID: Scalars['String'];
};

export type GetWritingSessionsForUserRequest = {
  username: Scalars['String'];
};

export type IncrementDailyStatUnitForWritingChallengeRequest = {
  dailyChallengeResponseID: Scalars['String'];
  date: Scalars['Date'];
  timeSpentSeconds: Scalars['Int'];
};

export type IncrementDailyStatUnitRequest = {
  date: Scalars['Date'];
  documentVersionID?: InputMaybe<Scalars['String']>;
  timeSpentSeconds: Scalars['Int'];
};

export type InviteUserToDocumentRequest = {
  documentVersionID: Scalars['String'];
  role: Scalars['String'];
  username: Scalars['String'];
};

export type Mutation = {
  __typename?: 'Mutation';
  completeWritingSession?: Maybe<Scalars['Void']>;
  continueChatConversation: ContinueChatConversationResponse;
  createComment: CreateCommentResponse;
  createDocument?: Maybe<CreateDocumentResponse>;
  createDocumentVersion: DocumentVersionMetadata;
  createEnhancedDocument: EnhancedDocumentMetadata;
  createNote: Note;
  createWritingSession: WritingSessionCreateResponse;
  deleteDocument?: Maybe<Scalars['Void']>;
  deleteDocumentForUser?: Maybe<Scalars['Void']>;
  deleteDocumentVersion?: Maybe<Scalars['Void']>;
  deleteEnhancedDocument?: Maybe<Scalars['Void']>;
  deleteNote?: Maybe<Scalars['Void']>;
  deleteWritingSession?: Maybe<Scalars['Void']>;
  extrapolateIdeaInContext: ExtrapolateIdeaInContextResponse;
  followUser?: Maybe<Scalars['Void']>;
  generateDraft: GenerateDraftResponse;
  getEmbedding: GetEmbeddingOutput;
  getIdeas: GetIdeasResponse;
  getNotesForDocument?: Maybe<Array<Maybe<Note>>>;
  incrementDailyStatUnit?: Maybe<Scalars['Void']>;
  incrementDailyStatUnitForWritingChallenge?: Maybe<Scalars['Void']>;
  inviteUserToDocument?: Maybe<Scalars['Void']>;
  notLoggedInPostDailyChallenge?: Maybe<Scalars['Void']>;
  postDailyChallengeResponse?: Maybe<Scalars['Void']>;
  publishDocumentVersion?: Maybe<Scalars['Void']>;
  renameDocumentVersion?: Maybe<Scalars['Void']>;
  resolveComment?: Maybe<Scalars['Void']>;
  saveDocumentContent?: Maybe<SaveDocumentContentResponse>;
  saveDocumentTitle?: Maybe<Scalars['Void']>;
  saveEnhancedDocumentNotesContent?: Maybe<Scalars['Void']>;
  saveNote?: Maybe<Scalars['Void']>;
  saveNoteTitle?: Maybe<Scalars['Void']>;
  setDraftCollapsed?: Maybe<Scalars['Void']>;
  setPinnedIdeas?: Maybe<Scalars['Void']>;
  shareDocument?: Maybe<ShareDocumentResponse>;
  shareDocumentVersion: ShareDocumentVersionResponse;
  shareNote: UserNotePermission;
  startChatConversation: StartChatConversationResponse;
  submitPromptSuggestion?: Maybe<Scalars['Void']>;
  toggleLikeDailyChallengeResponse?: Maybe<Scalars['Void']>;
  toggleLikePublishedDocumentVersion?: Maybe<Scalars['Void']>;
  unfollowUser?: Maybe<Scalars['Void']>;
  unpostDailyChallengeResponse?: Maybe<Scalars['Void']>;
  unpublishDocumentVersion?: Maybe<Scalars['Void']>;
  unshareDocumentVersion?: Maybe<Scalars['Void']>;
  unshareNote?: Maybe<Scalars['Void']>;
  updateBasicUserInfo?: Maybe<Scalars['Void']>;
  updateCompleteWritingSession?: Maybe<Scalars['Void']>;
  updateDailyChallengeResponseContent?: Maybe<Scalars['Void']>;
  updateDraft?: Maybe<Scalars['Void']>;
  updateProfileData?: Maybe<Scalars['Void']>;
  updateScratchpadEntryContent?: Maybe<Scalars['Void']>;
  updateTitle?: Maybe<Scalars['Void']>;
  updateWritingSession?: Maybe<Scalars['Void']>;
};


export type MutationCompleteWritingSessionArgs = {
  request: CompleteWritingSessionRequest;
};


export type MutationContinueChatConversationArgs = {
  request: ContinueChatConversationRequest;
};


export type MutationCreateCommentArgs = {
  request: CreateCommentRequest;
};


export type MutationCreateDocumentVersionArgs = {
  request: CreateDocumentVersionRequest;
};


export type MutationCreateNoteArgs = {
  request: CreateNoteRequest;
};


export type MutationCreateWritingSessionArgs = {
  request: CreateWritingSessionRequest;
};


export type MutationDeleteDocumentArgs = {
  request: DeleteDocumentRequest;
};


export type MutationDeleteDocumentForUserArgs = {
  request: DeleteDocumentForUserRequest;
};


export type MutationDeleteDocumentVersionArgs = {
  request: DeleteDocumentVersionRequest;
};


export type MutationDeleteEnhancedDocumentArgs = {
  request: DeleteEnhancedDocumentRequest;
};


export type MutationDeleteNoteArgs = {
  request: DeleteNoteRequest;
};


export type MutationDeleteWritingSessionArgs = {
  request: DeleteWritingSessionRequest;
};


export type MutationExtrapolateIdeaInContextArgs = {
  request: ExtrapolateIdeaInContextRequest;
};


export type MutationFollowUserArgs = {
  request: FollowUserRequest;
};


export type MutationGenerateDraftArgs = {
  request: GenerateDraftRequest;
};


export type MutationGetEmbeddingArgs = {
  request: GetEmbeddingInput;
};


export type MutationGetIdeasArgs = {
  request: GetIdeasRequest;
};


export type MutationGetNotesForDocumentArgs = {
  request?: InputMaybe<GetNotesForDocumentRequest>;
};


export type MutationIncrementDailyStatUnitArgs = {
  request: IncrementDailyStatUnitRequest;
};


export type MutationIncrementDailyStatUnitForWritingChallengeArgs = {
  request: IncrementDailyStatUnitForWritingChallengeRequest;
};


export type MutationInviteUserToDocumentArgs = {
  request: InviteUserToDocumentRequest;
};


export type MutationNotLoggedInPostDailyChallengeArgs = {
  request: NotLoggedInPostDailyChallengeRequest;
};


export type MutationPostDailyChallengeResponseArgs = {
  request?: InputMaybe<PostDailyChallengeRequest>;
};


export type MutationPublishDocumentVersionArgs = {
  request: PublishDocumentVersionRequest;
};


export type MutationRenameDocumentVersionArgs = {
  request: RenameDocumentVersionRequest;
};


export type MutationResolveCommentArgs = {
  request: ResolveCommentRequest;
};


export type MutationSaveDocumentContentArgs = {
  request: SaveDocumentContentRequest;
};


export type MutationSaveDocumentTitleArgs = {
  request: SaveDocumentTitleRequest;
};


export type MutationSaveEnhancedDocumentNotesContentArgs = {
  request: SaveEnhancedDocumentNotesContentRequest;
};


export type MutationSaveNoteArgs = {
  request: SaveNoteRequest;
};


export type MutationSaveNoteTitleArgs = {
  request: SaveNoteTitleRequest;
};


export type MutationSetDraftCollapsedArgs = {
  request: SetDraftCollapsedRequest;
};


export type MutationSetPinnedIdeasArgs = {
  request: SetPinnedIdeasRequest;
};


export type MutationShareDocumentArgs = {
  request: ShareDocumentRequest;
};


export type MutationShareDocumentVersionArgs = {
  request: ShareDocumentVersionRequest;
};


export type MutationShareNoteArgs = {
  request: ShareNoteRequest;
};


export type MutationStartChatConversationArgs = {
  request: StartChatConversationRequest;
};


export type MutationSubmitPromptSuggestionArgs = {
  request: SubmitPromptSuggestionRequest;
};


export type MutationToggleLikeDailyChallengeResponseArgs = {
  request: ToggleLikeDailyChallengeResponseRequest;
};


export type MutationToggleLikePublishedDocumentVersionArgs = {
  request: ToggleLikePublishedDocumentVersionRequest;
};


export type MutationUnfollowUserArgs = {
  request: UnfollowUserRequest;
};


export type MutationUnpostDailyChallengeResponseArgs = {
  request: UnpostDailyChallengeRequest;
};


export type MutationUnpublishDocumentVersionArgs = {
  request: UnpublishDocumentVersionRequest;
};


export type MutationUnshareDocumentVersionArgs = {
  request: RemoveUserFromDocumentVersionRequest;
};


export type MutationUnshareNoteArgs = {
  request: UnshareNoteRequest;
};


export type MutationUpdateBasicUserInfoArgs = {
  request?: InputMaybe<UpdateBasicUserInfoRequest>;
};


export type MutationUpdateCompleteWritingSessionArgs = {
  request: UpdateCompleteWritingSessionRequest;
};


export type MutationUpdateDailyChallengeResponseContentArgs = {
  request: UpdateDailyChallengeResponseContentRequest;
};


export type MutationUpdateDraftArgs = {
  request: UpdateDraftRequest;
};


export type MutationUpdateProfileDataArgs = {
  request: UpdateProfileDataRequest;
};


export type MutationUpdateScratchpadEntryContentArgs = {
  request?: InputMaybe<UpdateScratchpadEntryContentRequest>;
};


export type MutationUpdateTitleArgs = {
  request: UpdateTitleRequest;
};


export type MutationUpdateWritingSessionArgs = {
  request: UpdateWritingSessionRequest;
};

export type NotLoggedInPostDailyChallengeRequest = {
  content: Scalars['String'];
  dailyChallengeID: Scalars['Int'];
};

export type Note = {
  __typename?: 'Note';
  content?: Maybe<Scalars['String']>;
  noteID: Scalars['String'];
  personal: Scalars['Boolean'];
  title?: Maybe<Scalars['String']>;
  userNotePermissions: Array<UserNotePermission>;
};

export type NoteMetadata = {
  __typename?: 'NoteMetadata';
  noteID: Scalars['String'];
  personal: Scalars['Boolean'];
  title?: Maybe<Scalars['String']>;
  userNotePermissions: Array<UserNotePermission>;
};

export enum NoteRole {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  Owner = 'OWNER'
}

export type PostDailyChallengeRequest = {
  dailyChallengeResponseID: Scalars['String'];
};

export type PublishDocumentVersionRequest = {
  content?: InputMaybe<Scalars['String']>;
  documentVersionID: Scalars['String'];
  subtitle?: InputMaybe<Scalars['String']>;
  title: Scalars['String'];
  url: Scalars['String'];
};

export type PublishedDocumentVersion = {
  __typename?: 'PublishedDocumentVersion';
  content?: Maybe<Scalars['String']>;
  documentID: Scalars['String'];
  likingUsers: Array<Scalars['String']>;
  publishedAt: Scalars['Date'];
  publishedDocumentID: Scalars['String'];
  subtitle?: Maybe<Scalars['String']>;
  title: Scalars['String'];
  updatedAt: Scalars['Date'];
  url: Scalars['String'];
  user?: Maybe<User>;
  userID: Scalars['String'];
};

export type PublishedDocumentVersionMetadata = {
  __typename?: 'PublishedDocumentVersionMetadata';
  publishedAt: Scalars['Date'];
  title: Scalars['String'];
  url: Scalars['String'];
};

export type Query = {
  __typename?: 'Query';
  getAllPublishedDocumentVersionsForUser: Array<PublishedDocumentVersion>;
  getCommentsForDocument: GetCommentsForDocumentResponse;
  getContentForScratchpadEntries: Array<ScratchpadEntry>;
  getDailyChallengeForDate: GetDailyChallengeForDateResponse;
  getDocument: GetDocumentResponse;
  getDocumentVersion: DocumentVersion;
  getDocumentVersionFromVersionName: DocumentVersion;
  getDocuments: GetDocumentsResponse;
  getEnhancedDocument: EnhancedDocument;
  getEnhancedDocumentMetadata: Array<EnhancedDocumentMetadata>;
  getFeedItems: Array<FeedItem>;
  getLikesForPublishedDocumentVersion: Array<User>;
  getNote: Note;
  getNotesForDocument: GetNotesForDocumentResponse;
  getOthersDailyChallengeResponses: Array<DailyChallengeResponse>;
  getPublishedDocumentVersion: PublishedDocumentVersion;
  getScratchpadEntriesForUser: Array<Scalars['Date']>;
  getSharedDocuments: GetDocumentsResponse;
  getSharedWith: GetSharedWithResponse;
  getStatSegment: StatResponse;
  getTrackingPageData: TrackingPageData;
  getUser: GetUserResponse;
  getUserProfileData: UserProfileData;
  getWritingSessionForDocument?: Maybe<WritingSession>;
  getWritingSessionsForUser: Array<WritingSession>;
  usernameSearch: Array<UsernameSearchResult>;
};


export type QueryGetAllPublishedDocumentVersionsForUserArgs = {
  args: GetAllPublishedDocumentVersionsForUserInput;
};


export type QueryGetCommentsForDocumentArgs = {
  args: GetCommentsForDocumentRequest;
};


export type QueryGetContentForScratchpadEntriesArgs = {
  args?: InputMaybe<GetContentForScratchpadEntriesRequest>;
};


export type QueryGetDailyChallengeForDateArgs = {
  args?: InputMaybe<GetDailyChallengeForDateRequest>;
};


export type QueryGetDocumentArgs = {
  args: GetDocumentRequest;
};


export type QueryGetDocumentVersionArgs = {
  args: GetDocumentVersionRequest;
};


export type QueryGetDocumentVersionFromVersionNameArgs = {
  args: GetDocumentVersionFromVersionNameRequest;
};


export type QueryGetEnhancedDocumentArgs = {
  args?: InputMaybe<GetEnhancedDocumentRequest>;
};


export type QueryGetLikesForPublishedDocumentVersionArgs = {
  args: GetLikesForPublishedDocumentVersionRequest;
};


export type QueryGetNoteArgs = {
  args?: InputMaybe<GetNoteRequest>;
};


export type QueryGetNotesForDocumentArgs = {
  args: GetNotesForDocumentRequest;
};


export type QueryGetOthersDailyChallengeResponsesArgs = {
  args?: InputMaybe<GetOthersDailyChallengeResponsesRequest>;
};


export type QueryGetPublishedDocumentVersionArgs = {
  args: GetPublishedDocumentVersionInput;
};


export type QueryGetScratchpadEntriesForUserArgs = {
  args?: InputMaybe<GetScratchpadEntriesForUserRequest>;
};


export type QueryGetSharedWithArgs = {
  args: GetSharedWithRequest;
};


export type QueryGetStatSegmentArgs = {
  args: GetStatSegmentRequest;
};


export type QueryGetTrackingPageDataArgs = {
  args?: InputMaybe<GetDailyChallengeStatusesForTrackingPageRequest>;
};


export type QueryGetUserProfileDataArgs = {
  args?: InputMaybe<GetUserProfileDataRequest>;
};


export type QueryGetWritingSessionForDocumentArgs = {
  args: GetWritingSessionForDocumentRequest;
};


export type QueryGetWritingSessionsForUserArgs = {
  args: GetWritingSessionsForUserRequest;
};


export type QueryUsernameSearchArgs = {
  args?: InputMaybe<UsernameSearchRequest>;
};

export type RemoveUserFromDocumentVersionRequest = {
  documentVersionID: Scalars['String'];
  userID: Scalars['String'];
};

export type RenameDocumentVersionRequest = {
  documentVersionID: Scalars['String'];
  versionName: Scalars['String'];
};

export type ResolveCommentRequest = {
  commentID: Scalars['String'];
  userDocumentPermissionID: Scalars['String'];
};

export enum Role {
  Admin = 'ADMIN',
  Editor = 'EDITOR',
  LeadReviewer = 'LEAD_REVIEWER',
  Owner = 'OWNER',
  Reviewer = 'REVIEWER'
}

export type SaveDocumentContentRequest = {
  content: Scalars['String'];
  date: Scalars['Date'];
  documentID: Scalars['String'];
  versionName?: InputMaybe<Scalars['String']>;
  wordCount: Scalars['Int'];
};

export type SaveDocumentContentResponse = {
  __typename?: 'SaveDocumentContentResponse';
  comments: Array<Comment>;
};

export type SaveDocumentTitleRequest = {
  documentID: Scalars['String'];
  title: Scalars['String'];
};

export type SaveEnhancedDocumentNotesContentRequest = {
  enhancedDocumentID: Scalars['String'];
  notesContent: Scalars['String'];
};

export type SaveNoteRequest = {
  content: Scalars['String'];
  noteID: Scalars['String'];
};

export type SaveNoteTitleRequest = {
  noteID: Scalars['String'];
  title: Scalars['String'];
};

export type ScratchpadEntry = {
  __typename?: 'ScratchpadEntry';
  content?: Maybe<Scalars['String']>;
  date: Scalars['Date'];
  scratchpadEntryID: Scalars['String'];
  userID: Scalars['String'];
};

export type SetDraftCollapsedRequest = {
  collapsed: Scalars['Boolean'];
  enhancedDocumentID: Scalars['String'];
};

export type SetPinnedIdeasRequest = {
  enhancedDocumentID: Scalars['String'];
  pinnedIdeas: Array<Scalars['String']>;
};

export type ShareDocumentRequest = {
  documentID: Scalars['String'];
  role: EditableRole;
  username: Scalars['String'];
};

export type ShareDocumentResponse = {
  __typename?: 'ShareDocumentResponse';
  userDocumentPermission: UserDocumentPermissionMetadata;
};

export type ShareDocumentVersionRequest = {
  documentID: Scalars['String'];
  role: EditableRole;
  username: Scalars['String'];
  versionName?: InputMaybe<Scalars['String']>;
};

export type ShareDocumentVersionResponse = {
  __typename?: 'ShareDocumentVersionResponse';
  userDocumentPermission: UserDocumentPermissionMetadata;
};

export type ShareNoteRequest = {
  noteID: Scalars['String'];
  role: EditableNoteRole;
  username: Scalars['String'];
};

export type StartChatConversationRequest = {
  chatMessage: Scalars['String'];
  document: Scalars['String'];
  enhancedDocumentID: Scalars['String'];
  sectionJSON: Scalars['String'];
  sectionText: Scalars['String'];
};

export type StartChatConversationResponse = {
  __typename?: 'StartChatConversationResponse';
  responseMessage: Scalars['String'];
  threadID: Scalars['String'];
};

export type Stat = {
  __typename?: 'Stat';
  date: Scalars['Date'];
  timeSpentSeconds: Scalars['Int'];
  wordsChanged: Scalars['Int'];
};

export type StatResponse = {
  __typename?: 'StatResponse';
  stats: Array<Stat>;
};

export type SubmitPromptSuggestionRequest = {
  prompt: Scalars['String'];
};

export type ToggleLikeDailyChallengeResponseRequest = {
  dailyChallengeResponseID: Scalars['String'];
};

export type ToggleLikePublishedDocumentVersionRequest = {
  publishedDocumentID: Scalars['String'];
};

export type TrackingPageData = {
  __typename?: 'TrackingPageData';
  currentStreak: Scalars['Int'];
  dailyChallengeStatuses: Array<DailyChallengeStatus>;
  longestStreak: Scalars['Int'];
};

export type UnfollowUserRequest = {
  userID: Scalars['String'];
};

export type UnpostDailyChallengeRequest = {
  dailyChallengeResponseID: Scalars['String'];
};

export type UnpublishDocumentVersionRequest = {
  documentID: Scalars['String'];
};

export type UnshareNoteRequest = {
  userNotePermissionID: Scalars['String'];
};

export type UpdateBasicUserInfoRequest = {
  firstName?: InputMaybe<Scalars['String']>;
  lastName?: InputMaybe<Scalars['String']>;
  username?: InputMaybe<Scalars['String']>;
};

export type UpdateCompleteWritingSessionRequest = {
  title: Scalars['String'];
  writingSessionID: Scalars['String'];
};

export type UpdateDailyChallengeResponseContentRequest = {
  content: Scalars['String'];
  dailyChallengeResponseID: Scalars['String'];
  date: Scalars['Date'];
  wordCount: Scalars['Int'];
};

export type UpdateDraftRequest = {
  enhancedDocumentID: Scalars['String'];
  updatedDraftContent: Scalars['String'];
};

export type UpdateNotePanelPixelSplitRequest = {
  enhancedDocumentID: Scalars['String'];
  newNotePanelPixelSplitPercentage: Scalars['Float'];
};

export type UpdateProfileDataRequest = {
  bio?: InputMaybe<Scalars['String']>;
  city?: InputMaybe<Scalars['String']>;
  country?: InputMaybe<Scalars['String']>;
  instagram?: InputMaybe<Scalars['String']>;
  twitter?: InputMaybe<Scalars['String']>;
  website?: InputMaybe<Scalars['String']>;
};

export type UpdateScratchpadEntryContentRequest = {
  content: Scalars['String'];
  scratchpadEntryID: Scalars['String'];
};

export type UpdateTitleRequest = {
  enhancedDocumentID: Scalars['String'];
  updatedTitle: Scalars['String'];
};

export type UpdateWritingSessionRequest = {
  timeSpentSeconds: Scalars['Int'];
  wordsAdded: Scalars['Int'];
  wordsRemoved: Scalars['Int'];
  writingSessionID: Scalars['String'];
};

export type User = {
  __typename?: 'User';
  firstName?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  userID: Scalars['String'];
  username: Scalars['String'];
};

export type UserDocumentPermission = {
  __typename?: 'UserDocumentPermission';
  documentVersionID: Scalars['String'];
  role?: Maybe<Scalars['String']>;
  userID: Scalars['String'];
};

export type UserDocumentPermissionMetadata = {
  __typename?: 'UserDocumentPermissionMetadata';
  documentID?: Maybe<Scalars['String']>;
  documentVersionID?: Maybe<Scalars['String']>;
  role: Role;
  userDocumentPermissionID: Scalars['String'];
  userID: Scalars['String'];
  username: Scalars['String'];
};

export type UserNotePermission = {
  __typename?: 'UserNotePermission';
  noteID: Scalars['String'];
  role: NoteRole;
  userID: Scalars['String'];
  userNotePermissionID: Scalars['String'];
  username: Scalars['String'];
};

export type UserProfileData = {
  __typename?: 'UserProfileData';
  bio?: Maybe<Scalars['String']>;
  city?: Maybe<Scalars['String']>;
  country?: Maybe<Scalars['String']>;
  createdAt: Scalars['Date'];
  firstName: Scalars['String'];
  followerCount: Scalars['Int'];
  following: Scalars['Boolean'];
  followingCount: Scalars['Int'];
  instagram?: Maybe<Scalars['String']>;
  lastName?: Maybe<Scalars['String']>;
  twitter?: Maybe<Scalars['String']>;
  userID: Scalars['String'];
  username: Scalars['String'];
  website?: Maybe<Scalars['String']>;
};

export type UsernameSearchRequest = {
  username: Scalars['String'];
};

export type UsernameSearchResult = {
  __typename?: 'UsernameSearchResult';
  userID: Scalars['String'];
  username: Scalars['String'];
};

export type WritingSession = {
  __typename?: 'WritingSession';
  flow?: Maybe<Scalars['Int']>;
  segmentTime: Array<Scalars['Int']>;
  startDateTime: Scalars['DateTime'];
  timeSpentSeconds: Scalars['Int'];
  title: Scalars['String'];
  userID: Scalars['String'];
  username?: Maybe<Scalars['String']>;
  wordsChanged: Scalars['Int'];
  writingSessionID: Scalars['String'];
};

export type WritingSessionCreateResponse = {
  __typename?: 'WritingSessionCreateResponse';
  writingSessionID: Scalars['String'];
};
