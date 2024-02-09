const MIN_SEGMENTS_REQUIRED_TO_COMPUTE_FLOW = 10;

export function computeSegmentFlow(segments: number[]) {
  if (segments.length < 10) {
    return null;
  }
  const mean =
    segments.reduce((a, b) => a + b) / segments.length;
  const meanAbsoluteDeviation = Math.sqrt(
    segments
      .map((segment) => Math.abs(segment - mean))
      .reduce((a, b) => a + b) / segments.length
  );
  const relativeMeanAbsoluteDeviation =
    meanAbsoluteDeviation / mean;
  const flow = Math.max(
    100 - Math.floor(relativeMeanAbsoluteDeviation * 100),
    0
  );
  return flow;
}
