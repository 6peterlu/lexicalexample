import { LexicalEditor } from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { activeEditorVar } from '../../cache/cache';

export default function EmitEditorObjectPlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    if (editor) {
      activeEditorVar(editor);
    }
  }, [editor]);
  return null;
}
