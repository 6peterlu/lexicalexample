import { useReactiveVar } from '@apollo/client';
import {
  Button,
  Card,
  Checkbox,
  Text
} from '@nextui-org/react';
import { useEffect } from 'react';
import {
  currentEditorModeVar,
  wordCounterStateVar
} from '../cache/cache';

export enum EditorModes {
  DEFAULT = 'Default',
  ANALYTICS = 'Analytics',
  WORD_COUNTER = 'Word count'
}

export function EditorModeMenu() {
  const editorMode = useReactiveVar(currentEditorModeVar);
  // useEffect(() => {
  //   if (!editorMode.includes(EditorModes.WORD_COUNTER)) {
  //     wordCounterStateVar(null);
  //   }
  // }, [editorMode]);
  return (
    <Card
      style={{
        margin: 20,
        padding: 10,
        width: 200,
        maxWidth: 200
      }}
    >
      <Text>Layers</Text>
      {/* <Button.Group vertical size='sm'>
        {Object.keys(EditorModes).map((mode) => {
          const buttonMode =
            EditorModes[mode as keyof typeof EditorModes];
          return (
            <Button
              css={{ margin: 10 }}
              onClick={() => {
                currentEditorModeVar(buttonMode);
              }}
              ghost={editorMode !== buttonMode}
              key={`editor-mode-${buttonMode}`}
            >
              {buttonMode}
            </Button>
          );
        })}
      </Button.Group> */}
      <Checkbox.Group
        onChange={currentEditorModeVar}
        color='secondary'
      >
        <Checkbox value={EditorModes.ANALYTICS}>
          <Text>Analytics</Text>
        </Checkbox>
      </Checkbox.Group>
    </Card>
  );
}
