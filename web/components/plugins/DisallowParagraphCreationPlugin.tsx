import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getSelection,
  $isRangeSelection,
  $isRootOrShadowRoot,
  COMMAND_PRIORITY_CRITICAL,
  DELETE_CHARACTER_COMMAND,
  INSERT_PARAGRAPH_COMMAND,
  LexicalNode
} from 'lexical';
import {
  $createCustomListItemNode,
  $isCustomListItemNode,
  CustomListItemNode
} from '../nodes/CustomListItemNode';
import {
  $isListNode,
  ListNode,
  $createListNode,
  REMOVE_LIST_COMMAND
} from '@lexical/list';
import { useEffect } from 'react';

/**
 * Takes a deeply nested ListNode or ListItemNode and traverses up the branch to delete the first
 * ancestral ListNode (which could be the root ListNode) or ListItemNode with siblings, essentially
 * bringing the deeply nested node up the branch once. Would remove sublist if it has siblings.
 * Should not break ListItem -> List -> ListItem chain as empty List/ItemNodes should be removed on .remove().
 * @param sublist - The nested ListNode or ListItemNode to be brought up the branch.
 */
export function $removeHighestEmptyListParent(
  sublist: CustomListItemNode | ListNode
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
      CustomListItemNode | ListNode
    >();

    if (
      parent == null ||
      !(
        $isCustomListItemNode(emptyListPtr) ||
        $isListNode(emptyListPtr)
      )
    ) {
      break;
    }

    emptyListPtr = parent;
  }
  if (
    !$isRootOrShadowRoot(emptyListPtr) &&
    !$isRootOrShadowRoot(emptyListPtr.getParent())
  ) {
    emptyListPtr.remove();
  }
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
    throw new Error('listItem is not a ListItemNode');
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
 * MODIFIED FROM LEXICAL $handleListInsertParagraph to disallow paragraph creation
 * Docs below are copied from Lexical
 *
 * Attempts to insert a ParagraphNode at selection and selects the new node. The selection must contain a ListItemNode
 * or a node that does not already contain text. If its grandparent is the root/shadow root, it will get the ListNode
 * (which should be the parent node) and insert the ParagraphNode as a sibling to the ListNode. If the ListNode is
 * nested in a ListItemNode instead, it will add the ParagraphNode after the grandparent ListItemNode.
 * Throws an invariant if the selection is not a child of a ListNode.
 * @returns true if a ParagraphNode was inserted succesfully, false if there is no selection
 * or the selection does not contain a ListItemNode or the node already holds text.
 */
export function $handleListInsertParagraph(): boolean {
  const selection = $getSelection();

  if (
    !$isRangeSelection(selection) ||
    !selection.isCollapsed()
  ) {
    return false;
  }
  // Only run this code on empty list items
  const anchor = selection.anchor.getNode();

  if (
    !$isCustomListItemNode(anchor) ||
    anchor.getTextContent() !== ''
  ) {
    return false;
  }
  const topListNode = $getTopListNode(anchor);
  const parent = anchor.getParent();

  const grandparent = parent.getParent();

  let replacementNode;

  if ($isRootOrShadowRoot(grandparent)) {
    // do nothing if grandparent is root
    return true;
  }

  if ($isCustomListItemNode(grandparent)) {
    replacementNode = $createCustomListItemNode();
    grandparent.insertAfter(replacementNode);
  } else {
    return false;
  }
  replacementNode.select();

  const nextSiblings = anchor.getNextSiblings();

  if (nextSiblings.length > 0) {
    const newList = $createListNode(parent.getListType());
    const newListItem = $createCustomListItemNode();
    newListItem.append(newList);
    replacementNode.insertAfter(newListItem);
    nextSiblings.forEach((sibling) => {
      sibling.remove();
      newList.append(sibling);
    });
  }

  // Don't leave hanging nested empty lists
  $removeHighestEmptyListParent(anchor);

  return true;
}

export default function DisallowParagraphCreationPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    editor.registerCommand(
      INSERT_PARAGRAPH_COMMAND,
      () => {
        const hasHandledInsertParagraph =
          $handleListInsertParagraph();

        if (hasHandledInsertParagraph) {
          return true;
        }

        return false;
      },
      // override lexical handler
      COMMAND_PRIORITY_CRITICAL
    );
    editor.registerCommand(
      DELETE_CHARACTER_COMMAND,
      () => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) &&
          selection.isCollapsed() &&
          selection.anchor.offset === 0
        ) {
          const node = selection.anchor.getNode();
          let parentListItem = node;
          if (!$isCustomListItemNode(parentListItem)) {
            parentListItem =
              parentListItem.getParent<CustomListItemNode>();
          }
          const parentList =
            parentListItem.getParent<ListNode>();
          const grandparent = parentList.getParent();
          if (
            $isRootOrShadowRoot(grandparent) &&
            parentListItem.getPreviousSibling() === null
          ) {
            // we are the only list item left, do not delete
            return true;
          }
        }
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  return null;
}
