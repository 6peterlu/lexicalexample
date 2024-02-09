import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getRoot,
  $isTextNode,
  $setSelection,
  LexicalEditor,
  LexicalNode
} from 'lexical';
import {
  DragEvent,
  useCallback,
  useEffect,
  useState
} from 'react';
import { createPortal } from 'react-dom';
import { DRAG_AREA_DIV_ID } from '../../pages/document/[enhancedDocumentID]';
import { $isListNode } from '@lexical/list';
import {
  $getNextListItemWithCurrentDepth,
  $getTopListItemNode,
  $isCustomListItemNode,
  $isLastListItemNode,
  $nodeKeyInCurrentListHierarchy,
  CustomListItemNode
} from '../nodes/CustomListItemNode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faGripVertical } from '@fortawesome/free-solid-svg-icons/faGripVertical';
import { useTheme } from '@nextui-org/react';
import useResizeObserver from '@react-hook/resize-observer';
import { $removeHighestEmptyListParent } from './DisallowParagraphCreationPlugin';
import { $getTopListNode } from './OutlinePlugin';
import { PREVIEW_CONTAINER_DIV_ID } from '../lexicalComposers/EnhancedDocumentNoteLexicalComposer';

const END_NODE_INDICATOR = 'END';

export function getNodeFromDOMNode(
  dom: Node,
  editor: LexicalEditor
): LexicalNode | null {
  // @ts-ignore We intentionally add this to the Node.
  const key = dom[`__lexicalKey_${editor._key}`];
  if (key !== undefined) {
    return $getNodeByKey(key, editor.getEditorState());
  }
  return null;
}

export default function DraggableHandlePlugin({
  hoveringOverNotePanel,
  scrollOffset
}: {
  hoveringOverNotePanel: boolean;
  scrollOffset: number;
}) {
  const { theme } = useTheme();
  const [paragraphHeights, setParagraphHeights] = useState<{
    [nodekey: string]: number;
  }>({});
  const [endOfDocumentHeight, setEndOfDocumentHeight] =
    useState<number>();
  const [currentlyDragging, setCurrentlyDragging] =
    useState<{
      nodekey: string;
      delta: number;
      insertBeforeNodeKey: string | null;
    } | null>(null);

  const [editor] = useLexicalComposerContext();
  const recomputeParagraphHeights = useCallback(() => {
    const editorState = editor.getEditorState();
    editorState.read(() => {
      const root = $getRoot();
      if (!root.isEmpty()) {
        const allNodeKeys = editorState._nodeMap.keys();
        const paragraphHeights: {
          [nodekey: string]: number;
        } = {};
        for (const nodeKey of allNodeKeys) {
          const node = $getNodeByKey(nodeKey);
          if ($isCustomListItemNode(node)) {
            // add to paragraph heights if the first child is a text node or node has no children
            const firstChild = node.getFirstChild();
            if (!firstChild || $isTextNode(firstChild)) {
              const element =
                editor.getElementByKey(nodeKey);
              paragraphHeights[nodeKey] = element.offsetTop;
            }
          }
        }
        setParagraphHeights(paragraphHeights);
        const lastElement = editor.getElementByKey(
          root
            .getChildAtIndex(root.getChildrenSize() - 1)
            .getKey()
        );
        setEndOfDocumentHeight(
          lastElement.offsetTop + lastElement.offsetHeight
        );
      }
    });
  }, [editor]);
  const getNodeKeyToDragBefore = useCallback(
    (nodekey: string, currentDragHandleHeight: number) => {
      const currentHandleLocations = Array.from(
        Object.entries(paragraphHeights),
        ([nodekey, height]) => ({
          nodekey,
          height
        })
      ).sort((a, b) => a.height - b.height);
      const currentDragHandleIndex =
        currentHandleLocations.findIndex(
          (handleLocation) =>
            handleLocation.nodekey === nodekey
        );
      let targetKey: string | null = null;
      for (
        let i = 0;
        i < currentHandleLocations.length;
        i++
      ) {
        const handleLocation = currentHandleLocations[i];
        if (
          handleLocation.height > currentDragHandleHeight
        ) {
          if (i === currentDragHandleIndex) {
            // no change needed
            targetKey = currentHandleLocations[i + 1]
              ? currentHandleLocations[i + 1].nodekey
              : END_NODE_INDICATOR;
          }
          targetKey = handleLocation.nodekey;
          break;
        }
      }
      if (targetKey === END_NODE_INDICATOR || !targetKey) {
        return END_NODE_INDICATOR;
      }
      // adjust for block dragging

      editor.getEditorState().read(() => {
        const currentNode = $getNodeByKey(nodekey);
        if ($isCustomListItemNode(currentNode)) {
          const targetNode = $getNodeByKey(targetKey);
          if ($isCustomListItemNode(targetNode)) {
            if (
              $nodeKeyInCurrentListHierarchy(
                currentNode,
                targetNode
              )
            ) {
              const nextNode = currentNode.getNextSibling();
              if ($isCustomListItemNode(nextNode)) {
                const nextNodeChild =
                  nextNode.getFirstChild();
                if ($isListNode(nextNodeChild)) {
                  // need to go to next top-level child
                  const nextNodeAtDepth =
                    $getNextListItemWithCurrentDepth(
                      nextNode
                    );
                  targetKey = nextNodeAtDepth
                    ? nextNodeAtDepth.__key
                    : END_NODE_INDICATOR;
                }
              }
            }
          }
        }
      });
      return targetKey;
    },
    [paragraphHeights, editor]
  );
  const handleDragEnd = useCallback(() => {
    if (!currentlyDragging) {
      return;
    }
    if (
      currentlyDragging.insertBeforeNodeKey ===
      END_NODE_INDICATOR
    ) {
      // TODO: deduplicate code between this block and the one below
      editor.update(() => {
        const draggedNode = $getNodeByKey(
          currentlyDragging.nodekey
        );
        // used to delete empty nodes after moving
        const draggedNodeParent = draggedNode.getParent();
        // used to prevent moving to the same location
        let alreadyAtEnd = false;
        if ($isCustomListItemNode(draggedNode)) {
          alreadyAtEnd = $isLastListItemNode(draggedNode);
          // this has to be evaluated before the drag takes place.
          let draggedNodeHasSibling =
            draggedNodeParent.getChildrenSize() > 1;
          const clonedDraggedNode =
            CustomListItemNode.clone(draggedNode);
          // get next node
          let clonedList = null;
          const nextSibling =
            clonedDraggedNode.getNextSibling();

          // grab sublists to move
          if ($isCustomListItemNode(nextSibling)) {
            const nextSiblingChild =
              nextSibling.getFirstChild();
            if ($isListNode(nextSiblingChild)) {
              // copy list over
              clonedList =
                CustomListItemNode.clone(nextSibling);
              draggedNodeHasSibling =
                draggedNodeParent.getChildrenSize() > 2;
              alreadyAtEnd =
                $isLastListItemNode(nextSibling);
            }
          }
          if (alreadyAtEnd) {
            return;
          }

          // append node to end of document
          const root = $getRoot();
          const topLevelListItem = root.getFirstChild();
          topLevelListItem
            .getLastChild()
            .insertAfter(clonedDraggedNode);

          // insert nested list after node
          if (clonedList) {
            clonedDraggedNode.insertAfter(clonedList);
          }
          // clean up empty lists
          if (
            !draggedNodeHasSibling &&
            $isListNode(draggedNodeParent)
          ) {
            $removeHighestEmptyListParent(
              draggedNodeParent
            );
          }
        }
      });
    } else {
      if (
        currentlyDragging.insertBeforeNodeKey ===
        currentlyDragging.nodekey
      ) {
        // don't allow drag before self
        return;
      }
      // move the dragged paragraph to the location of the handle
      editor.update(() => {
        const node = $getNodeByKey(
          currentlyDragging.insertBeforeNodeKey
        );
        const draggedNode = $getNodeByKey(
          currentlyDragging.nodekey
        );

        // used to delete empty nodes after moving
        const draggedNodeParent = draggedNode.getParent();
        let clonedList = null;
        if ($isCustomListItemNode(draggedNode)) {
          // this has to be evaluated before the drag takes place.
          let draggedNodeHasSibling =
            draggedNodeParent.getChildrenSize() > 1;
          const clonedDraggedNode =
            CustomListItemNode.clone(draggedNode);
          const nextSibling =
            clonedDraggedNode.getNextSibling();
          if ($isCustomListItemNode(nextSibling)) {
            const nextSiblingChild =
              nextSibling.getFirstChild();
            if ($isListNode(nextSiblingChild)) {
              // copy list over
              clonedList =
                CustomListItemNode.clone(nextSibling);
              draggedNodeHasSibling =
                draggedNodeParent.getChildrenSize() > 2;
            }
          }
          node.insertBefore(clonedDraggedNode);
          if (clonedList) {
            clonedDraggedNode.insertAfter(clonedList);
          }
          if (
            !draggedNodeHasSibling &&
            $isListNode(draggedNodeParent)
          ) {
            $removeHighestEmptyListParent(
              draggedNodeParent
            );
          }
        }
        $setSelection(null);
      });
    }
  }, [currentlyDragging, editor]);
  useEffect(() => {
    // updates on all document updates besides selection
    return editor.registerUpdateListener(
      ({ dirtyElements, dirtyLeaves }) => {
        if (
          dirtyElements.size === 0 &&
          dirtyLeaves.size === 0
        ) {
          return;
        }
        recomputeParagraphHeights();
      }
    );
  }, [editor, recomputeParagraphHeights]);
  useResizeObserver(
    document.getElementById('note-editor-content-editable'),
    (entry) => {
      recomputeParagraphHeights();
    }
  );
  const dragAreaDiv = document.getElementById(
    DRAG_AREA_DIV_ID
  );

  // used to show hover grab effect
  const [mouseCursorPosition, setMouseCursorPosition] =
    useState({ x: 0, y: 0 });

  // synchronize paragraph heights and mouse cursor distances
  useEffect(() => {
    function mouseMoveListener(event: MouseEvent) {
      setMouseCursorPosition({
        x: event.clientX,
        y: event.clientY
      });
    }
    window.addEventListener('mousemove', mouseMoveListener);
    return () => {
      window.removeEventListener(
        'mousemove',
        mouseMoveListener
      );
    };
  }, []);

  if (!dragAreaDiv) {
    return null;
  }
  return (
    <>
      {createPortal(
        <div>
          {Object.entries(paragraphHeights).map(
            ([nodekey, height]) => (
              <div
                draggable={true}
                id={nodekey}
                onDragStart={(
                  event: DragEvent<HTMLElement>
                ) => {
                  const previewDiv =
                    document.createElement('div');
                  const previewList =
                    document.createElement('ul');
                  let nextNodeHTML = null;
                  editor.getEditorState().read(() => {
                    const node = $getNodeByKey(nodekey);
                    if ($isCustomListItemNode(node)) {
                      const nextNode =
                        node.getNextSibling();
                      if ($isCustomListItemNode(nextNode)) {
                        const nextNodeChild =
                          nextNode.getFirstChild();
                        if ($isListNode(nextNodeChild)) {
                          const htmlElement =
                            editor.getElementByKey(
                              nextNodeChild.getKey()
                            );
                          nextNodeHTML =
                            htmlElement.outerHTML;
                        }
                      }
                    }
                  });
                  previewList.innerHTML =
                    editor.getElementByKey(nodekey)
                      .outerHTML + (nextNodeHTML || '');
                  previewList.style.opacity = '0.6';
                  previewDiv.appendChild(previewList);
                  document
                    .getElementById(
                      PREVIEW_CONTAINER_DIV_ID
                    )
                    .appendChild(previewDiv);
                  event.dataTransfer.setDragImage(
                    previewDiv,
                    0,
                    0
                  );
                }}
                onDrag={(event: DragEvent<HTMLElement>) => {
                  // event target is null on drag end
                  if (event.target && event.clientY !== 0) {
                    const offsetTopWithinEditor =
                      event.clientY -
                      document.getElementById(
                        'note-content-editable-container'
                      ).offsetTop +
                      scrollOffset;
                    setCurrentlyDragging({
                      nodekey: nodekey,
                      delta: offsetTopWithinEditor,
                      insertBeforeNodeKey:
                        getNodeKeyToDragBefore(
                          nodekey,
                          offsetTopWithinEditor
                        )
                    });
                  }
                }}
                onDragEnd={(
                  event: DragEvent<HTMLElement>
                ) => {
                  handleDragEnd();
                  setCurrentlyDragging(null);
                  document.getElementById(
                    PREVIEW_CONTAINER_DIV_ID
                  ).innerHTML = '';
                }}
                key={nodekey}
                style={{
                  position: 'absolute',
                  top: height,
                  // right: 10,
                  // height: 10,
                  // width: 10,
                  // backgroundColor: 'red',
                  cursor: currentlyDragging
                    ? 'grabbing'
                    : 'grab',
                  transform: 'none',
                  opacity:
                    document.getElementById(nodekey) &&
                    hoveringOverNotePanel
                      ? 20 /
                        (Math.abs(
                          height -
                            mouseCursorPosition.y +
                            document.getElementById(
                              'note-content-editable-container'
                            ).offsetTop -
                            scrollOffset
                        ) +
                          1)
                      : 0
                }}
              >
                <FontAwesomeIcon
                  icon={faGripVertical}
                  color={theme.colors.gray400.value}
                />
              </div>
            )
          )}
        </div>,
        document.getElementById(DRAG_AREA_DIV_ID)
      )}
      {currentlyDragging && (
        <div
          style={{
            position: 'absolute',
            top: paragraphHeights[
              currentlyDragging.insertBeforeNodeKey
            ]
              ? paragraphHeights[
                  currentlyDragging.insertBeforeNodeKey
                ] - scrollOffset
              : endOfDocumentHeight - scrollOffset,
            // bottom: paragraphHeights[
            //   currentlyDragging.insertBeforeNodeKey
            // ]
            //   ? undefined
            //   : 0,
            height: 2,
            width: 400,
            backgroundColor: 'red'
          }}
        />
      )}
    </>
  );
}
