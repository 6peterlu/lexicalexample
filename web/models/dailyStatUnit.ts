import { Stat as gql_DailyStatUnit } from '../generated/types/graphql';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);
dayjs.extend(timezone);

export class DailyStatUnit {
  date: Date;
  timeSpentSeconds: number;
  wordsChanged: number;

  constructor(arg: {
    date: Date;
    timeSpentSeconds: number;
    wordsChanged: number;
  }) {
    this.date = arg.date;
    this.timeSpentSeconds = arg.timeSpentSeconds;
    this.wordsChanged = arg.wordsChanged;
  }
  static fromGraphQL(response: gql_DailyStatUnit) {
    return new this({
      wordsChanged: response.wordsChanged,
      timeSpentSeconds: response.timeSpentSeconds,
      date: dayjs
        .tz(response.date, dayjs.tz.guess())
        .toDate()
    });
  }
}
