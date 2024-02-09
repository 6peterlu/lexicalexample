import {
  WritingSession as pr_WritingSession,
  User as pr_User
} from '../generated/prisma';
import {
  WritingSession as gql_WritingSession,
  FeedItem as gql_FeedItem,
  FeedItemType
} from '../generated/types/graphql';
import { computeSegmentFlow } from '../pages/api/utils/writingAnalytics';

export class WritingSession {
  userID: string;
  wordsAdded: number;
  wordsRemoved: number;
  inProgress: boolean;
  segmentTime: number[];
  startDateTime: Date;
  title: string;
  timeSpentSeconds: number;

  constructor(arg: {
    userID: string;
    wordsAdded: number;
    wordsRemoved: number;
    inProgress: boolean;
    segmentTime: number[];
    startDateTime: Date;
    timeSpentSeconds: number;
    title: string;
  }) {
    this.userID = arg.userID;
    this.wordsAdded = arg.wordsAdded;
    this.wordsRemoved = arg.wordsRemoved;
    this.inProgress = arg.inProgress;
    this.segmentTime = arg.segmentTime;
    this.startDateTime = arg.startDateTime;
    this.timeSpentSeconds = arg.timeSpentSeconds;
    this.title = arg.title;
  }
}

export class WritingSessionDB extends WritingSession {
  writingSessionID: string;
  username: string;

  constructor(arg: {
    userID: string;
    wordsAdded: number;
    wordsRemoved: number;
    inProgress: boolean;
    segmentTime: number[];
    startDateTime: Date;
    writingSessionID: string;
    timeSpentSeconds: number;
    title: string;
    username: string;
  }) {
    super(arg);
    this.writingSessionID = arg.writingSessionID;
    this.username = arg.username;
  }

  static fromPrisma(
    prismaRecord: pr_WritingSession & { user: pr_User }
  ) {
    return new WritingSessionDB({
      title: prismaRecord.title,
      userID: prismaRecord.userID,
      wordsAdded: prismaRecord.wordsAdded,
      wordsRemoved: prismaRecord.wordsRemoved,
      inProgress: prismaRecord.inProgress,
      segmentTime: prismaRecord.segmentTime,
      startDateTime: prismaRecord.startDateTime,
      writingSessionID: prismaRecord.writingSessionID,
      timeSpentSeconds: prismaRecord.timeSpentSeconds,
      username: prismaRecord.user.username
    });
  }

  toGraphQL(): gql_WritingSession {
    return {
      writingSessionID: this.writingSessionID,
      wordsChanged: this.wordsAdded + this.wordsRemoved,
      timeSpentSeconds: this.timeSpentSeconds,
      startDateTime: this.startDateTime,
      title: this.title,
      segmentTime: this.segmentTime,
      flow: computeSegmentFlow(this.segmentTime),
      userID: this.userID,
      username: this.username
    };
  }
  toFeedItem(): gql_FeedItem {
    return {
      feedItemType: FeedItemType.WritingSession,
      date: this.startDateTime,
      serializedData: JSON.stringify(this.toGraphQL())
    };
  }
}
