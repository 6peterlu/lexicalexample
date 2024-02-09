import {
  TextNode,
  LineBreakNode,
  LexicalNode
} from 'lexical';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useEffect } from 'react';

function lineBreakTransform(node: LexicalNode): void {
  node.remove(false);
}

// TODO: this might be a better solution https://github.com/facebook/lexical/discussions/3640
export function RemoveLineBreakPlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    const removeTransform = editor.registerNodeTransform(
      LineBreakNode,
      lineBreakTransform
    );
    return () => {
      removeTransform();
    };
  }, [editor]);
  return null;
}
