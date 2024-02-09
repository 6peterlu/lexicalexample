import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';
import {
  textContentVar,
  wordCounterStateVar
} from '../../cache/cache';
import { getWordCount } from '../../utils/lexical';

export default function TextContentPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.getEditorState().read(() => {
      textContentVar($getRoot().getTextContent());
    });
  }, [editor]);

  return <></>;
}
