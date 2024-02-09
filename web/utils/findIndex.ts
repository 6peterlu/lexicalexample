import { clamp, distance } from '@popmotion/popcorn';

export interface Position {
  top: number;
  height: number;
}

// Prevent rapid reverse swapping
const buffer = 5;

// export const findIndex = (
//   index: number,
//   point: number,
//   positions: Position[],
// ) => {
//   let target = index
//   const { top, height } = positions[index]
//   const bottom = top + height

//   // If moving down
//   if (point.y > 0) {
//     const nextItem = positions[index + 1]
//     if (nextItem === undefined) {
//       return index
//     }
//     const swapOffset =
//       distance(bottom, nextItem.top + nextItem.height / 2) + buffer
//     if (point.y > swapOffset) {
//       target = index + 1
//     }

//     // If moving up
//   } else if (point.y < 0) {
//     const previousItem = positions[index - 1]
//     if (previousItem === undefined) {
//       return index
//     }
//     const previousBottom = previousItem.top + previousItem.height
//     const swapOffset =
//       distance(top, previousBottom - previousItem.height / 2) + buffer
//     if (point.y < -swapOffset) {
//       target = index - 1
//     }
//   }

//   return clamp(0, positions.length, target)
// }
export function findIndex(): void {
  console.log('hi');
}
