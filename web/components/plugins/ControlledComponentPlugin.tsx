import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { useReactiveVar } from '@apollo/client';
import {
  analyticsLayerStateVar,
  currentDocumentVar
} from '../../cache/cache';
import { EditorState } from 'lexical';

export function ControlledComponentPlugin(): null {
  const [editor] = useLexicalComposerContext();
  const editorState = useReactiveVar(
    analyticsLayerStateVar
  );

  useEffect(() => {
    if (editorState) {
      if (typeof editorState === 'string') {
        editor.setEditorState(
          editor.parseEditorState(editorState)
        );
      } else {
        editor.setEditorState(editorState);
      }
    }
  }, [editorState, editor]);
  return null;
}
