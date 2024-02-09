import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { draftEditorContextVar } from '../../cache/cache';
import { useEffect } from 'react';

export default function ShareEditorContextPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    draftEditorContextVar(editor);
  }, [editor]);
  return null;
}
