import { useRef, useState } from 'react';
import Draggable from 'react-draggable';
import { motion } from 'framer-motion';
import { Note } from '../generated/types/graphql';

function computeTargetIndex(
  currentIndex: number,
  maxIndex: number,
  deltaX: number,
  deltaY: number,
  gridSize: number
) {
  const gridDeltaX = Math.round(deltaX / gridSize);
  const gridDeltaY = Math.round(deltaY / gridSize);
  const row = Math.floor(currentIndex / 4);
  const col = currentIndex % 4;
  const targetRow = Math.min(
    Math.max(row + gridDeltaY, 0),
    Math.floor(maxIndex / 4)
  );
  const targetCol = Math.min(
    Math.max(col + gridDeltaX, 0),
    3
  );
  return Math.min(targetRow * 4 + targetCol, maxIndex);
}

export default function DraggableItem({
  hidden,
  startDragging,
  stopDragging,
  setTargetIndex,
  currentIndex,
  maxIndex,
  reset,
  beingDragged,
  note
}: {
  hidden: boolean;
  setTargetIndex: (value: number) => void;
  currentIndex: number;
  maxIndex: number;
  startDragging: () => void;
  stopDragging: () => void;
  reset: () => void;
  beingDragged: boolean;
  note: Note;
}) {
  const nodeRef = useRef(null);
  return (
    <Draggable
      nodeRef={nodeRef}
      onStop={(_, data) => {
        stopDragging();
        reset();
      }}
      onStart={(_, data) => {
        startDragging();
      }}
      onDrag={(_, data) => {
        if (nodeRef && nodeRef.current) {
          const newTargetIndex = computeTargetIndex(
            currentIndex,
            maxIndex,
            data.x,
            data.y,
            nodeRef.current.offsetWidth
          );
          setTargetIndex(newTargetIndex);
        }
      }}
      // needed to snap the drag handle to grid at the end
      position={{ x: 0, y: 0 }}
    >
      <div
        style={{
          visibility: hidden ? 'hidden' : 'visible'
        }}
        ref={nodeRef}
        id={note.title}
      >
        <motion.div
          animate={
            beingDragged || hidden
              ? { rotate: 0 }
              : {
                  rotate: [0, -2, 0, 2, 0]
                }
          }
          transition={
            beingDragged || hidden
              ? null
              : {
                  repeat: Infinity,
                  repeatType: 'loop',
                  duration: 0.25,
                  ease: 'linear'
                }
          }
          style={{
            borderRadius: 5,
            backgroundColor: 'pink',
            margin: 10,
            width: '17vw',
            height: '17vw',
            alignItems: 'center',
            justifyContent: 'center',
            display: 'flex'
          }}
        />
        {/* <FontAwesomeIcon
            icon={
              note.icon
                ? JSON.parse(note.icon)
                : faClipboard
            }
          /> */}
        ƒ
      </div>
    </Draggable>
  );
}
