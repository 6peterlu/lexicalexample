import {
  ListItemNode,
  SerializedListItemNode,
  $isListNode,
  ListNode
} from '@lexical/list';
import {
  $applyNodeReplacement,
  $getRoot,
  EditorConfig,
  LexicalEditor,
  LexicalNode,
  Spread
} from 'lexical';
import { v4 } from 'uuid';
import { addClassNamesToElement } from '@lexical/utils';

export type SerializedCustomListItemNode = Spread<
  {
    id: string;
  },
  SerializedListItemNode
>;

/**
 * The structure of the list items is:
 * - ListNode
 *  - CustomListItemNode
 *   - ListNode
 *    - CustomListItemNode
 * ... etc
 * 
 * List node nesting is defined by the number of list/listitem nodes in the chain
 * For example, here is a deeply nested node:
 *    | ├ (73) listitem  
  | | └ (74) list  
  | |   └ (75) listitem  
  | |     └ (76) list  
  | |       └ (77) listitem  
  | |         └ (78) list  
  | |           └ (79) listitem  
  | |             └ (80) list  
  | |               └ (72) listitem
 * this means we have to use the text field to decide if the node is a visible node on the page.
 * we only need to consider list nodes that have a text node as a child for the purposes of embeddings
 * List items with list nodes as children are not visible on the page and are used for nesting
 */

export class CustomListItemNode extends ListItemNode {
  __id: string;
  static getType() {
    return 'custom-list-item';
  }
  constructor({
    key,
    id
  }: { key?: string; id?: string } = {}) {
    // value, checked, key
    // value can be used to set numbering in ordered lists but we don't have those yet
    super(undefined, false, key);
    if (key) {
      this.__id = id || v4();
    } else {
      // assumption: if no key, then this could be from copy/paste and we must ignore id
      this.__id = v4();
    }
  }
  // clone is used in many internal operations so it must preserve id
  static clone(node: CustomListItemNode) {
    return new CustomListItemNode({
      key: node.__key,
      id: node.__id
    });
  }

  static cloneWithID(node: CustomListItemNode) {
    return new CustomListItemNode({
      key: node.__key,
      id: node.__id
    });
  }
  static importJSON(
    serializedNode: SerializedCustomListItemNode
  ) {
    return new CustomListItemNode({
      id: serializedNode.id
    });
  }
  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('li');
    element.id = `custom-list-item-${this.__id}`;
    if (
      this.getChildren().some((child) => $isListNode(child))
    ) {
      addClassNamesToElement(
        element,
        'editor-nested-listitem'
      );
    }
    return element;
  }

  exportJSON(): SerializedCustomListItemNode {
    return {
      ...super.exportJSON(),
      type: 'custom-list-item',
      version: 1,
      id: this.__id
    };
  }
  setBold(bold: boolean) {
    const dom = document.getElementById(
      `custom-list-item-${this.__id}`
    );
    if (dom) {
      if (bold) {
        dom.style.fontWeight = 'bold';
      } else {
        dom.style.fontWeight = 'normal';
      }
    }
  }
  setHighlighted(hovered: boolean) {
    const dom = document.getElementById(
      `custom-list-item-${this.__id}`
    );
    if (dom) {
      if (hovered) {
        dom.style.fontWeight = 'bold';
        dom.style.color = '#5D8298'; //blue600
      } else {
        dom.style.fontWeight = 'normal';
        dom.style.color = 'black';
      }
    }
  }
}

export function $isCustomListItemNode(
  node: any
): node is CustomListItemNode {
  return node instanceof CustomListItemNode;
}

/**
 * Creates a new List Item node, passing true/false will convert it to a checkbox input.
 * @param checked - Is the List Item a checkbox and, if so, is it checked? undefined/null: not a checkbox, true/false is a checkbox and checked/unchecked, respectively.
 * @returns The new List Item.
 */
export function $createCustomListItemNode(): ListItemNode {
  return $applyNodeReplacement(new CustomListItemNode({}));
}

export function $getTextContentForCustomListItemNode(
  node: CustomListItemNode
) {
  let textContent = node.getTextContent();
  const nextSibling = node.getNextSibling();
  if (nextSibling && $isCustomListItemNode(nextSibling)) {
    const firstChildOfNextSibling =
      nextSibling.getFirstChild();
    if ($isListNode(firstChildOfNextSibling)) {
      textContent += '\n\n'; // two new lines to match lexical autoformatting for bulleted lists
      textContent += nextSibling.getTextContent();
    }
  }
  return textContent;
}

export function $getNextListItemWithCurrentDepth(
  node: CustomListItemNode | null
): CustomListItemNode | null {
  if (!node) {
    return null;
  }
  const nextSibling = node.getNextSibling();
  if (nextSibling && $isCustomListItemNode(nextSibling)) {
    return nextSibling;
  }
  // no next sibling at current depth
  const parent = node.getParent();
  // highest level reached
  if (!$isListNode(parent)) {
    return null;
  }
  const grandparent = parent.getParent();
  if (!$isCustomListItemNode(grandparent)) {
    return null; // should never happen
  }
  return $getNextListItemWithCurrentDepth(grandparent);
}

export function $nodeKeyInCurrentListHierarchy(
  node: CustomListItemNode,
  targetNode: CustomListItemNode
) {
  if (node.__key === targetNode.__key) {
    return true;
  }
  const nextSibling = node.getNextSibling();
  if (!nextSibling) {
    return false;
  }
  let targetNodePointer = targetNode;
  while (targetNodePointer) {
    if (nextSibling.__key === targetNodePointer.__key) {
      return true;
    }
    targetNodePointer = targetNodePointer.getParent();
    if (
      !$isCustomListItemNode(targetNodePointer) &&
      !$isListNode(targetNodePointer)
    ) {
      return false;
    }
  }
}

export function $getTopListItemNode(
  listItem: CustomListItemNode
): CustomListItemNode {
  let node = listItem;

  while (true) {
    const parent = node.getParent();
    if (!$isListNode(parent)) {
      break;
    }
    const grandparent = parent.getParent();

    if (!$isCustomListItemNode(grandparent)) {
      break;
    }
    node = grandparent;
  }

  return node;
}

export function $isLastListItemNode(
  listItem: CustomListItemNode
) {
  const topListItemNode = $getTopListItemNode(listItem);
  const root = $getRoot();
  const topLevelList = root.getFirstChild<ListNode>();
  const lastListItem =
    topLevelList.getLastChild<CustomListItemNode>();
  if (lastListItem.__key === topListItemNode.__key) {
    return true;
  }
  return false;
}
