import { useReactiveVar } from '@apollo/client';
import { Button } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { Note } from '../generated/types/graphql';
import {
  appDrawerNotesVar,
  notesVar
} from '../cache/cache';
import DraggableIcon from './DraggableIcon';
import StaticIcon from './StaticIcon';
import { v4 } from 'uuid';

const ROW_LENGTH = 4;

export default function AppDrawer() {
  const notes = useReactiveVar(appDrawerNotesVar);
  const [handleValues, setHandleValues] =
    useState<Note[]>(notes);
  const [iconValues, setIconValues] =
    useState<Note[]>(notes);
  useEffect(() => {
    setHandleValues(notes);
    setIconValues(notes);
  }, [notes]);
  const [currentlyDragging, setCurrentlyDragging] =
    useState<string | null>(null);
  const [editable, setEditable] = useState<boolean>(false);
  const [pointerDownTimeout, setPointerDownTimeout] =
    useState<NodeJS.Timeout | null>(null);
  function shiftIndices(
    startIndex: number,
    endIndex: number
  ) {
    if (startIndex !== endIndex) {
      let iconValuesCopy: Note[] = [];
      // ex: end index = 5, start index = 4
      if (endIndex > startIndex) {
        iconValuesCopy = [
          ...iconValues.slice(0, startIndex),
          ...iconValues.slice(startIndex + 1, endIndex + 1),
          iconValues[startIndex],
          ...iconValues.slice(endIndex + 1)
        ];
      } else {
        iconValuesCopy = [
          ...iconValues.slice(0, endIndex),
          iconValues[startIndex],
          ...iconValues.slice(endIndex, startIndex),
          ...iconValues.slice(startIndex + 1)
        ];
      }
      setIconValues(iconValuesCopy);
    }
  }
  function resetDraggables() {
    setHandleValues([...iconValues]);
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        flex: 1,
        height: '100%'
      }}
    >
      {editable && (
        <div
          style={{
            position: 'absolute',
            zIndex: 1
          }}
        >
          {[
            ...Array(
              Math.floor(handleValues.length / 4) + 1
            )
          ].map((_, rowNumber) => {
            return (
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'flex-start'
                }}
                key={`row-${rowNumber}`}
              >
                {handleValues
                  .slice(
                    rowNumber * ROW_LENGTH,
                    rowNumber * ROW_LENGTH + 4
                  )
                  .map((note: Note, index: number) => {
                    // create cell
                    const currentIndex =
                      ROW_LENGTH * rowNumber + index;
                    return (
                      <DraggableIcon
                        key={`draggable-${note.noteID}`}
                        hidden={
                          currentlyDragging &&
                          currentlyDragging !== note.noteID
                        }
                        beingDragged={
                          currentlyDragging === note.noteID
                        }
                        startDragging={() => {
                          setCurrentlyDragging(note.noteID);
                        }}
                        stopDragging={() => {
                          setCurrentlyDragging(null);
                        }}
                        currentIndex={currentIndex}
                        setTargetIndex={(
                          newTargetIndex
                        ) => {
                          shiftIndices(
                            iconValues.findIndex(
                              (v) =>
                                v.noteID === note.noteID
                            ),
                            newTargetIndex
                          );
                        }}
                        reset={resetDraggables}
                        maxIndex={handleValues.length - 1}
                        note={note}
                      />
                    );
                  })}
                {rowNumber ===
                  Math.floor(handleValues.length / 4) &&
                  [
                    ...Array(4 - (handleValues.length % 4))
                  ].map(() => (
                    <div
                      // placeholder since this code isnt used anyway
                      key={v4()}
                      style={{
                        width: '17vw',
                        height: '17vw',
                        margin: '10px'
                      }}
                    ></div>
                  ))}
              </div>
            );
          })}
        </div>
      )}
      <div
        style={{
          position: 'absolute'
        }}
      >
        {[
          ...Array(Math.floor(iconValues.length / 4) + 1)
        ].map((_, rowNumber) => {
          return (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'flex-start'
              }}
              key={`row-${rowNumber}`}
              onPointerDown={() => {
                const timeoutID = setTimeout(() => {
                  setEditable(true);
                }, 1000);
                setPointerDownTimeout(timeoutID);
              }}
              onPointerUp={() => {
                if (pointerDownTimeout) {
                  clearTimeout(pointerDownTimeout);
                  setPointerDownTimeout(null);
                }
              }}
            >
              {iconValues
                .slice(
                  rowNumber * ROW_LENGTH,
                  rowNumber * ROW_LENGTH + 4
                )
                .map((note: Note, index: number) => {
                  // create cell
                  if (currentlyDragging !== note.noteID) {
                    return (
                      <StaticIcon
                        key={`static-${note.noteID}`}
                        animate={
                          editable && !currentlyDragging
                        }
                        note={note}
                      />
                    );
                  }
                  return (
                    <div
                      style={{
                        width: '17vw',
                        height: '17vw',
                        margin: '10px'
                      }}
                      key={note.noteID}
                    />
                  );
                })}
              {rowNumber ===
                Math.floor(iconValues.length / 4) &&
                [...Array(4 - (iconValues.length % 4))].map(
                  (_, index) => (
                    <div
                      style={{
                        width: '17vw',
                        height: '17vw',
                        margin: '10px'
                      }}
                      key={`spacer-${index}`}
                    ></div>
                  )
                )}
            </div>
          );
        })}
      </div>
      {editable && (
        <>
          <div style={{ flexGrow: 1 }} />
          <div style={{ marginBottom: 'auto' }}>
            <Button
              onClick={() => {
                setEditable(false);
                if (pointerDownTimeout) {
                  clearTimeout(pointerDownTimeout);
                  setPointerDownTimeout(null);
                }
              }}
            >
              Done editing
            </Button>
          </div>
        </>
      )}
    </div>
  );
}
