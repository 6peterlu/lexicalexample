import { addDays } from 'date-fns';
import {
  DailyChallenge,
  DailyChallengeResponse
} from '../../../generated/prisma';
import { getStartAndEndOfCurrentDayPacificTime } from '../../../utils/time';

export function getCurrentStreak(
  prRecords: (DailyChallengeResponse & {
    dailyChallenge: { date: Date };
  })[]
) {
  let currentStreak = 0;
  let { startOfCurrentDay: targetDay } =
    getStartAndEndOfCurrentDayPacificTime();
  for (let i = prRecords.length - 1; i >= 0; i--) {
    const pr = prRecords[i];
    const date = pr.dailyChallenge.date;
    if (
      targetDay.toLocaleDateString('en-US') ===
      date.toLocaleDateString('en-US')
    ) {
      if (pr.completedOnTime) {
        currentStreak++;
      } else {
        break;
      }
      targetDay = addDays(targetDay, -1);
    } else {
      break;
    }
  }
  return currentStreak;
}
