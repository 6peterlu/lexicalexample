import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { useReactiveVar } from '@apollo/client';
import {
  commentsVar,
  currentDocumentVar
} from '../../cache/cache';
import { useMarkComments } from './CommentPlugin';

export function UpdateStatePlugin(): null {
  const [editor] = useLexicalComposerContext();
  const currentDocumentData = useReactiveVar(
    currentDocumentVar
  );
  const comments = useReactiveVar(commentsVar);
  const { markComments } = useMarkComments();
  useEffect(() => {
    if (currentDocumentData.content) {
      const editorState = editor.parseEditorState(
        currentDocumentData.content
      );

      editor.setEditorState(editorState);
      markComments(comments);
    }
  }, [currentDocumentData, comments, editor, markComments]);
  return null;
}
