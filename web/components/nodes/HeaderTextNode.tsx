import {
  $applyNodeReplacement,
  EditorConfig,
  ElementNode,
  LexicalNode,
  SerializedElementNode
} from 'lexical';
import { v4 } from 'uuid';

export type SerializedHeaderTextNode =
  SerializedElementNode;

export function generateHeaderNodeID(): string {
  return `section-${v4()}`;
}

export class HeaderTextNode extends ElementNode {
  static getType(): string {
    return 'header-paragraph';
  }
  static clone(node: HeaderTextNode): HeaderTextNode {
    return new HeaderTextNode(node.__key);
  }
  static importJSON(
    serializedNode: SerializedHeaderTextNode
  ): HeaderTextNode {
    const node = $createHeaderTextNode();
    return node;
  }
  exportJSON(): SerializedHeaderTextNode {
    return {
      ...super.exportJSON(),
      type: 'header-paragraph'
      // version: 1
    };
  }
  createDOM(config: EditorConfig): HTMLElement {
    const dom = document.createElement('p');
    dom.style.color = 'blue';
    dom.style.minHeight = '1.5em';
    return dom;
  }
  updateDOM(
    prevNode: HeaderTextNode,
    dom: HTMLElement,
    config: EditorConfig
  ): boolean {
    return false;
  }
  collapseAtStart(): boolean {
    return false;
  }
  excludeFromCopy(destination?: 'clone' | 'html'): boolean {
    return destination === 'html';
  }
  // isTextEntity(): boolean {
  //   return true;
  // }
}

export function $createHeaderTextNode(): HeaderTextNode {
  // create header text node and child text node, so collab will sync it correctly
  // reason this is needed is unknown
  const headerTextNode = new HeaderTextNode();
  return $applyNodeReplacement(headerTextNode);
}

export function $isHeaderTextNode(
  node: LexicalNode | null | undefined
): node is HeaderTextNode {
  return node instanceof HeaderTextNode;
}
