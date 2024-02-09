import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $applyNodeReplacement,
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isLeafNode,
  $isParagraphNode,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  DELETE_CHARACTER_COMMAND,
  INSERT_LINE_BREAK_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  KEY_ENTER_COMMAND,
  LexicalCommand,
  LexicalEditor,
  LexicalNode,
  ParagraphNode,
  createCommand
} from 'lexical';
import { $getNearestNodeOfType } from '@lexical/utils';
import {
  INSERT_UNORDERED_LIST_COMMAND,
  insertList,
  ListNode,
  ListItemNode,
  ListType,
  $isListItemNode,
  $isListNode,
  REMOVE_LIST_COMMAND
} from '@lexical/list';
import { useEffect } from 'react';
import {
  $createHeaderTextNode,
  $isHeaderTextNode,
  HeaderTextNode
} from '../nodes/HeaderTextNode';
import { useReactiveVar } from '@apollo/client';

export const CREATE_SECTION: LexicalCommand<string> =
  createCommand();

// invariant(condition, message) will refine types based on "condition", and
// if "condition" is false will throw an error. This function is special-cased
// in flow itself, so we can't name it anything else.
function invariant(
  cond?: boolean,
  message?: string,
  ...args: string[]
): asserts cond {
  if (cond) {
    return;
  }

  throw new Error(
    'Internal Lexical error: invariant() is meant to be replaced at compile ' +
      'time. There is no runtime version. Error: ' +
      message
  );
}

/**
 * Creates a new List Item node, passing true/false will convert it to a checkbox input.
 * @param checked - Is the List Item a checkbox and, if so, is it checked? undefined/null: not a checkbox, true/false is a checkbox and checked/unchecked, respectively.
 * @returns The new List Item.
 */
export function $createListItemNode(
  checked?: boolean
): ListItemNode {
  return $applyNodeReplacement(
    new ListItemNode(undefined, checked)
  );
}

/**
 * Creates a ListNode of listType.
 * @param listType - The type of list to be created. Can be 'number', 'bullet', or 'check'.
 * @param start - Where an ordered list starts its count, start = 1 if left undefined.
 * @returns The new ListNode
 */
export function $createListNode(
  listType: ListType,
  start = 1
): ListNode {
  return $applyNodeReplacement(
    new ListNode(listType, start)
  );
}

/**
 * Finds the nearest ancestral ListNode and returns it, throws an invariant if listItem is not a ListItemNode.
 * @param listItem - The node to be checked.
 * @returns The ListNode found.
 */
export function $getTopListNode(
  listItem: LexicalNode
): ListNode {
  let list = listItem.getParent<ListNode>();

  if (!$isListNode(list)) {
    invariant(
      false,
      'A ListItemNode must have a ListNode for a parent.'
    );
  }

  let parent: ListNode | null = list;

  while (parent !== null) {
    parent = parent.getParent();

    if ($isListNode(parent)) {
      list = parent;
    }
  }

  return list;
}

/**
 * Takes a deeply nested ListNode or ListItemNode and traverses up the branch to delete the first
 * ancestral ListNode (which could be the root ListNode) or ListItemNode with siblings, essentially
 * bringing the deeply nested node up the branch once. Would remove sublist if it has siblings.
 * Should not break ListItem -> List -> ListItem chain as empty List/ItemNodes should be removed on .remove().
 * @param sublist - The nested ListNode or ListItemNode to be brought up the branch.
 */
export function $removeHighestEmptyListParent(
  sublist: ListItemNode | ListNode
) {
  // Nodes may be repeatedly indented, to create deeply nested lists that each
  // contain just one bullet.
  // Our goal is to remove these (empty) deeply nested lists. The easiest
  // way to do that is crawl back up the tree until we find a node that has siblings
  // (e.g. is actually part of the list contents) and delete that, or delete
  // the root of the list (if no list nodes have siblings.)
  let emptyListPtr = sublist;

  while (
    emptyListPtr.getNextSibling() == null &&
    emptyListPtr.getPreviousSibling() == null
  ) {
    const parent = emptyListPtr.getParent<
      ListItemNode | ListNode
    >();

    if (
      parent == null ||
      !(
        $isListItemNode(emptyListPtr) ||
        $isListNode(emptyListPtr)
      )
    ) {
      break;
    }

    emptyListPtr = parent;
  }

  emptyListPtr.remove();
}

/**
 * Attempts to insert a ParagraphNode at selection and selects the new node. The selection must contain a ListItemNode
 * or a node that does not already contain text. If its grandparent is the root/shadow root, it will get the ListNode
 * (which should be the parent node) and insert the ParagraphNode as a sibling to the ListNode. If the ListNode is
 * nested in a ListItemNode instead, it will add the ParagraphNode after the grandparent ListItemNode.
 * Throws an invariant if the selection is not a child of a ListNode.
 * @returns true if a ParagraphNode was inserted succesfully, false if there is no selection
 * or the selection does not contain a ListItemNode or the node already holds text.
 */
export function $handleListInsertParagraph(
  editor: LexicalEditor
): boolean {
  // only run this when you're hitting enter off of regular text
  const selection = $getSelection();

  if (
    !$isRangeSelection(selection) ||
    !selection.isCollapsed()
  ) {
    return false;
  }
  const anchor = selection.anchor.getNode();

  if (!$isListItemNode(anchor)) {
    if (anchor.getTextContent() === '') {
      // no bullet creation if header node is empty
      return true;
    }
    const paragraphNode = anchor.getParent();
    const newList = $createListNode('bullet');
    const newListItem = $createListItemNode();
    newList.append(newListItem);
    paragraphNode.insertAfter(newList);
    newListItem.select();
    return true;
  }
  const topListNode = $getTopListNode(anchor);
  const parent = anchor.getParent();

  invariant(
    $isListNode(parent),
    'A ListItemNode must have a ListNode for a parent.'
  );

  const grandparent = parent.getParent();

  let replacementNode;

  if ($isRootOrShadowRoot(grandparent)) {
    replacementNode = $createHeaderTextNode();
    topListNode.insertAfter(replacementNode);
  } else if ($isListItemNode(grandparent)) {
    replacementNode = $createListItemNode();
    grandparent.insertAfter(replacementNode);
  } else {
    return false;
  }
  replacementNode.select();

  const nextSiblings = anchor.getNextSiblings();

  if (nextSiblings.length > 0) {
    const newList = $createListNode(parent.getListType());

    if ($isHeaderTextNode(replacementNode)) {
      replacementNode.insertAfter(newList);
    } else {
      const newListItem = $createListItemNode();
      newListItem.append(newList);
      replacementNode.insertAfter(newListItem);
    }
    nextSiblings.forEach((sibling) => {
      sibling.remove();
      newList.append(sibling);
    });
  }
  anchor.remove();

  return true;
}

/**
 * A recursive Depth-First Search (Postorder Traversal) that finds all of a node's children
 * that are of type ListItemNode and returns them in an array.
 * @param node - The ListNode to start the search.
 * @returns An array containing all nodes of type ListItemNode found.
 */
// This should probably be $getAllChildrenOfType
export function $getAllListItems(
  node: ListNode
): Array<ListItemNode> {
  let listItemNodes: Array<ListItemNode> = [];
  const listChildren: Array<ListItemNode> = node
    .getChildren()
    .filter($isListItemNode);

  for (let i = 0; i < listChildren.length; i++) {
    const listItemNode = listChildren[i];
    const firstChild = listItemNode.getFirstChild();

    if ($isListNode(firstChild)) {
      listItemNodes = listItemNodes.concat(
        $getAllListItems(firstChild)
      );
    } else {
      listItemNodes.push(listItemNode);
    }
  }

  return listItemNodes;
}

export default function OutlinePlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => {
        return $handleListInsertParagraph(editor);
      },
      COMMAND_PRIORITY_CRITICAL
    );
    // editor.registerCommand(
    //   REMOVE_LIST_COMMAND,
    //   () => {
    //     removeList(editor);
    //     return true;
    //   },
    //   COMMAND_PRIORITY_CRITICAL
    // );
  }, [editor]);

  useEffect(() => {
    editor.registerNodeTransform(ParagraphNode, (node) => {
      const newHeaderTextNode = $createHeaderTextNode();
      for (const child of node.getChildren()) {
        newHeaderTextNode.append(child);
      }
      node.replace(newHeaderTextNode);
      newHeaderTextNode.select();
    });
    editor.registerMutationListener(
      HeaderTextNode,
      (mutations) => {
        if (
          Array.from(mutations.values()).some(
            (m) => m === 'destroyed'
          )
        ) {
          editor.update(() => {
            // merge lists that are next to each other
            const root = $getRoot();
            const children = root.getChildren();
            let maybePrevListNode: ListNode | null = null;
            for (const child of children) {
              const currentChildIsList = $isListNode(child);
              if (currentChildIsList) {
                if (maybePrevListNode) {
                  // merge lists
                  for (const grandchild of child.getChildren()) {
                    maybePrevListNode.append(grandchild);
                  }
                  child.remove();
                } else {
                  maybePrevListNode = child;
                }
              } else {
                maybePrevListNode = null;
              }
            }
          });
        }
      }
    );
  }, [editor]);

  return null;
}
