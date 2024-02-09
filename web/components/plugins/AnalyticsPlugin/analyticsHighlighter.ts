type AnalyticsMatch = {
  anchor: number;
  focus: number;
};
function the(paragraphText: string) {
  const re = /\bthe\b/g;
  let array1;
  const matches = [];
  while ((array1 = re.exec(paragraphText)) !== null) {
    matches.push({
      anchor: array1.index,
      focus: re.lastIndex
    });
  }
  return matches;
}
function sentenceLength(paragraphText: string) {
  const SHORT_SENTENCE_MAX = 6;
  const MED_SENTENCE_MAX = 12;
  // SO source: https://stackoverflow.com/questions/55787514/split-string-into-array-elements-based-on-punctuation-in-string-javascript
  const sentences = paragraphText.match(/\S[^.]*?[\.|\?|\!]["|”]*\s*/g);
  const matches: {
    short: AnalyticsMatch[];
    medium: AnalyticsMatch[];
    long: AnalyticsMatch[];
  } = { short: [], medium: [], long: [] };
  if (sentences) {
    let currentIndex = 0;
    for (const sentence of sentences) {
      const whitespaceFreeSentence = sentence.trimEnd();
      const sentenceLength = whitespaceFreeSentence.length;
      const matchData = {
        anchor: currentIndex,
        focus: currentIndex + sentenceLength
      };
      const sentenceWordCount = sentence.trim().split(/\s+/).length;
      if (sentenceWordCount <= SHORT_SENTENCE_MAX) {
        matches.short.push(matchData);
      } else if (sentenceWordCount <= MED_SENTENCE_MAX) {
        matches.medium.push(matchData);
      } else {
        matches.long.push(matchData);
      }
      currentIndex += sentence.length;
    }
  }
  return matches;
}
export function getAnalyticsHighlights(
  paragraphText: string
): Record<string, AnalyticsMatch[]> {
  const theMatches = the(paragraphText);
  const sentenceLengthMatches = sentenceLength(paragraphText);
  return { the: theMatches, ...sentenceLengthMatches };
}
