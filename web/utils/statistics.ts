export function computeActiveTime(timers: {
  timeStartMillis: number[];
  timeEndMillis: number[];
}) {
  let millisActive = 0;
  for (let i = 0; i < timers.timeEndMillis.length; i++) {
    millisActive +=
      timers.timeEndMillis[i] - timers.timeStartMillis[i];
  }
  if (
    timers.timeStartMillis.length >
    timers.timeEndMillis.length
  ) {
    millisActive +=
      Date.now() - timers.timeStartMillis.pop();
  }
  return millisActive;
}
