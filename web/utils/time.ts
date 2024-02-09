import { useRef, useEffect } from 'react';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import { DAILY_CHALLENGE_TIMEZONE } from './constants';

dayjs.extend(utc);
dayjs.extend(timezone);

export function getDateNDaysAgo(daysAgo: number) {
  const dateNDaysAgo = new Date(
    new Date().getTime() - daysAgo * 24 * 60 * 60 * 1000
  );
  return dateNDaysAgo;
}

export function getDateRange(
  startDate: Date,
  endDate: Date
): Date[] {
  const dates: Date[] = [];
  const date = new Date(startDate);
  while (date <= endDate) {
    dates.push(new Date(date));
    date.setDate(date.getDate() + 1);
  }
  return dates;
}

// taken from dan abramov so it must be right
// https://overreacted.io/making-setinterval-declarative-with-react-hooks/
export function useInterval(
  callback: Function,
  delay: number
) {
  const savedCallback = useRef<Function>();

  // Remember the latest callback.
  useEffect(() => {
    savedCallback.current = callback;
  }, [callback]);

  // Set up the interval.
  useEffect(() => {
    function tick() {
      savedCallback.current();
    }
    if (delay !== null) {
      let id = setInterval(tick, delay);
      return () => clearInterval(id);
    }
  }, [delay]);
}

export function secondsToHoursMinutes(seconds: number) {
  const totalMinutes = Math.floor(seconds / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  return { hours, minutes };
}

// format: 2023-02-26
export function getPacificTimezoneDateString(date: Date) {
  if (!date) return null;
  return dayjs(date.toISOString())
    .tz(DAILY_CHALLENGE_TIMEZONE)
    .format('YYYY-MM-DD');
}

export function getPacificTimeDate(date: string) {
  return dayjs(date).tz(DAILY_CHALLENGE_TIMEZONE).toDate();
}

export function getStartAndEndOfCurrentDayPacificTime() {
  // get start of current day in pacific timezone
  const startOfCurrentDay = dayjs()
    .tz(DAILY_CHALLENGE_TIMEZONE)
    .startOf('day')
    .toDate();

  // get end of current day in pacific timezone
  const endOfCurrentDay = dayjs()
    .tz(DAILY_CHALLENGE_TIMEZONE)
    .endOf('day')
    .toDate();

  return { startOfCurrentDay, endOfCurrentDay };
}

export function getStartAndEndOfDatePacificTime(
  date: Date
) {
  // get start of date in pacific timezone
  const startOfDay = dayjs(date)
    .tz(DAILY_CHALLENGE_TIMEZONE)
    .startOf('day')
    .toDate();

  // get end of date in pacific timezone
  const endOfDay = dayjs(date)
    .tz(DAILY_CHALLENGE_TIMEZONE)
    .endOf('day')
    .toDate();

  return { startOfDay, endOfDay };
}

export function getDaysBetween(
  startDate: Date,
  endDate: Date
) {
  const start = dayjs(startDate);
  const end = dayjs(endDate);
  return end.diff(start, 'day') + 1;
}

export function getStartOfDateLocalTime(date: Date) {
  // get start of current day in pacific timezone
  const startOfDay = dayjs(date)
    .tz(dayjs.tz.guess())
    .startOf('day')
    .toDate();
  return startOfDay;
}

export function dateInCurrentDayPacificTime(date: Date) {
  if (!date) {
    return false;
  }
  const { startOfCurrentDay, endOfCurrentDay } =
    getStartAndEndOfCurrentDayPacificTime();
  return (
    date >= startOfCurrentDay && date <= endOfCurrentDay
  );
}

export function getUTCDateString(date: Date) {
  if (!date) return null;
  return date.toISOString().split('T')[0];
}

export function getCurrentDateGraphQLString() {
  return new Date().toLocaleDateString('fr-CA');
}

export function toGraphQLString(date: Date) {
  return date.toLocaleDateString('fr-CA');
}

export function startOfDayUTC() {
  return dayjs().startOf('day').toDate();
}
