import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createHeaderNode,
  $isHeaderNode,
  HeaderNode
} from '../nodes/HeaderNode';
import { useReactiveVar } from '@apollo/client';
import { headerHeightsVar } from '../../cache/cache';
import {
  $createParagraphNode,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $setSelection,
  COMMAND_PRIORITY_CRITICAL,
  DELETE_CHARACTER_COMMAND,
  LexicalNode,
  RangeSelection
} from 'lexical';
import { useEffect } from 'react';

export function getHeaderNodesFromSelection(
  selection: RangeSelection
): HeaderNode[] {
  const headerNodes: LexicalNode[] = selection
    .getNodes()
    .filter((n) => $isHeaderNode(n));
  return headerNodes as HeaderNode[];
}

export default function HeaderPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const headerHeights = useReactiveVar(headerHeightsVar);
  useEffect(() => {
    editor.registerMutationListener(
      HeaderNode,
      (mutations) => {
        const editorState = editor.getEditorState();
        editorState.read(() => {
          const updatedHeaderHeights = { ...headerHeights };
          for (const [key, mutation] of mutations) {
            const node: null | HeaderNode =
              $getNodeByKey(key);
            const element = editor.getElementByKey(key);
            // sometimes node has already been removed
            if (mutation === 'created') {
              updatedHeaderHeights[node.getKey()] =
                element.offsetTop;
            } else if (mutation === 'destroyed') {
              delete updatedHeaderHeights[key];
            }
          }
          headerHeightsVar({
            ...updatedHeaderHeights
          });
        });
      }
    );
    editor.registerTextContentListener(() => {
      const editorState = editor.getEditorState();
      const updatedHeaderHeights = { ...headerHeights };
      let changed = false;
      editorState.read(() => {
        for (const key in updatedHeaderHeights) {
          const element = editor.getElementByKey(key);
          if (element) {
            // sometimes html elements arent rendered yet
            if (
              element.offsetTop !==
              updatedHeaderHeights[key]
            ) {
              changed = true;
              updatedHeaderHeights[key] = element.offsetTop;
            }
          }
        }
      });
      if (changed) {
        headerHeightsVar(updatedHeaderHeights);
      }
    });
  }, [editor, headerHeights]);
  useEffect(() => {
    editor.registerMutationListener(
      HeaderNode,
      (mutations) => {
        for (const [key, mutation] of mutations) {
          if (mutation === 'created') {
            editor.update(() => {
              const node: HeaderNode = $getNodeByKey(key);
              const nextNode = node.getNextSibling();
              if (!nextNode || $isHeaderNode(nextNode)) {
                const paragraphNode =
                  $createParagraphNode();
                node.insertAfter(paragraphNode);
              }
            });
          }
        }
      }
    );

    // regen header nodes if it gets removed
    editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      () => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          if (selection.isCollapsed()) {
            // anchor or focus doesn't matter because it's collapsed
            const anchorNode = selection.anchor.getNode();
            // empty anchor node = we are at the beginning of a paragraph
            let previousNode =
              anchorNode.getPreviousSibling();
            // logic for deciding if you're at the beginning of a paragraph, need to replace with a lexical builtin if possible
            if (
              // this first case usually works
              $isHeaderNode(previousNode) ||
              // second case needed when cursor is coming from another delete on the next line.
              // reason unknown
              (previousNode === null &&
                selection.anchor.offset === 0)
            ) {
              if (!previousNode) {
                // in this case, we need to get the previous node through the previous sibling of the paragraph
                const topLevelParagraph =
                  anchorNode.getTopLevelElement();
                previousNode =
                  topLevelParagraph.getPreviousSibling();
                if (!$isHeaderNode(previousNode)) {
                  return false;
                }
              }
              const nodeBeforeHeader =
                previousNode.getPreviousSibling();
              if (nodeBeforeHeader) {
                previousNode.selectPrevious();
              }
              return true;
            }
            // }

            return false;
          }
          const headerNodes =
            getHeaderNodesFromSelection(selection);
          if (headerNodes.length > 0) {
            selection.insertNodes(
              HeaderNode.regenerateWithParagraphNodes(
                headerNodes
              )
            );
            return true;
          }
          return false;
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);
  return null;
}
