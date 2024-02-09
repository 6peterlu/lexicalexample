import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';
import { wordCounterStateVar } from '../../cache/cache';
import { getWordCount } from '../../utils/lexical';

export default function WordCounterPlugin() {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.registerTextContentListener((textContent) => {
      wordCounterStateVar(getWordCount(textContent));
    });
  }, [editor]);

  return <></>;
}
