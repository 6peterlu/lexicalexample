export function clipNumber(
  value: number,
  min: number,
  max: number
) {
  if (min >= max) {
    throw new Error('min must be less than max');
  }
  if (value < min) {
    return min;
  }
  if (value > max) {
    return max;
  }
  return value;
}
