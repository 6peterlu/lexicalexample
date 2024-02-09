import { hashCode } from './string';

export const SIMILARITY_SCORE_EXPONENT = 5;
export const SIMILARITY_SCORE_THRESHOLD = 0.5;

export type EmbeddingDataMap = {
  [nodeKey: string]: number[];
};
export type SimilarityOutput = {
  nodeList: string[];
  similarityMatrix: number[][];
};

export type EmbeddingNodeIDMap = {
  [nodeID: string]: { embedding: number[]; text: string };
};

export function dotProduct(
  embedding1: number[],
  embedding2: number[]
): number {
  let sum = 0;
  for (let i = 0; i < embedding1.length; i++) {
    sum += embedding1[i] * embedding2[i];
  }
  return sum;
}
// output data structure: node array, embedding matrix
// usage is to loop through node array and use index to derive similarity
// similarity should be relative (scale to 0-1)
export function computeSimilarity(
  embeddingDataMap: EmbeddingNodeIDMap
): SimilarityOutput {
  const nodeList = Object.keys(embeddingDataMap);
  const similarityMatrix = [];
  let minValue = 1;
  let maxValue = 0;
  if (nodeList.length > 1) {
    for (let i = 0; i < nodeList.length - 1; i++) {
      const similarityRow = [];
      for (let j = i + 1; j < nodeList.length; j++) {
        const nodeKey1 = nodeList[i];
        const nodeKey2 = nodeList[j];
        const embedding1 =
          embeddingDataMap[nodeKey1].embedding;
        const embedding2 =
          embeddingDataMap[nodeKey2].embedding;
        const similarity = dotProduct(
          embedding1,
          embedding2
        );
        if (similarity < minValue) {
          minValue = similarity;
        }
        if (similarity > maxValue) {
          maxValue = similarity;
        }
        similarityRow.push(similarity);
      }
      similarityMatrix.push(similarityRow);
    }
  }
  // normalize all values
  for (let i = 0; i < similarityMatrix.length; i++) {
    for (let j = 0; j < similarityMatrix[i].length; j++) {
      if (maxValue === minValue) {
        similarityMatrix[i][j] = 0;
        continue;
      }
      similarityMatrix[i][j] =
        (similarityMatrix[i][j] - minValue) /
        (maxValue - minValue);
    }
  }
  return { nodeList, similarityMatrix };
}

export function getLinkageHash(
  text1: string,
  text2: string
): number {
  return hashCode(`${text1}||||${text2}`);
}
