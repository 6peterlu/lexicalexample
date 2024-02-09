import { useReactiveVar } from '@apollo/client';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  currentDocumentVersionContentVar,
  currentEditorHeaderIDsVar
} from '../../cache/cache';
import { useEffect } from 'react';
import { $getRoot } from 'lexical';
import { $isHeaderNode } from '../nodes/HeaderNode';

export default function SetDocumentContentOnLoadPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.registerUpdateListener(() => {
      const editorState = editor.getEditorState();
      currentDocumentVersionContentVar(editorState);
      editorState.read(() => {
        const headerIDs = $getRoot()
          .getChildren()
          .filter((node) => $isHeaderNode(node))
          .map((node) => node.__id);
        currentEditorHeaderIDsVar(headerIDs);
      });
    });
  }, [editor]);
  return <></>;
}
