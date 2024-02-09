import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot, $isTextNode } from 'lexical';
import { $isListNode, ListNode } from '@lexical/list';
import { CustomListItemNode } from '../nodes/CustomListItemNode';
import { useEffect, useState } from 'react';

export default function BulletPlaceholderPlugin({
  setPlaceholderState
}: {
  setPlaceholderState: (arg0: boolean) => void;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.registerUpdateListener(() => {
      editor.getEditorState().read(() => {
        const root = $getRoot();
        const topLevelList = root.getFirstChild<ListNode>();
        if (topLevelList.getChildrenSize() === 1) {
          const firstListItemNode =
            topLevelList.getFirstChild<CustomListItemNode>();
          const firstChildNode =
            firstListItemNode.getFirstChild();
          if (
            !firstChildNode ||
            ($isTextNode(firstChildNode) &&
              firstChildNode.getTextContentSize() === 0)
          ) {
            setPlaceholderState(true);
          } else {
            setPlaceholderState(false);
          }
        } else {
          setPlaceholderState(false);
        }
      });
    });
  }, [editor, setPlaceholderState]);

  return null;
}
