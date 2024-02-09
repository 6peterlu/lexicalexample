import {
  EditorConfig,
  ParagraphNode,
  RangeSelection,
  SerializedElementNode,
  SerializedParagraphNode,
  Spread
} from 'lexical';
import { v4 } from 'uuid';

export type SerializedCustomParagraphNode = Spread<
  {
    id: string;
  },
  SerializedElementNode
>;

export class CustomParagraphNode extends ParagraphNode {
  __id: string;
  static getType() {
    return 'custom-paragraph';
  }
  constructor({
    key,
    id
  }: { key?: string; id?: string } = {}) {
    super(key);
    if (key) {
      this.__id = id || v4();
    } else {
      // assumption: if no key, then this could be from copy/paste and we must ignore id
      this.__id = v4();
    }
  }
  // clone is used in many internal operations so it must preserve id
  static clone(node: CustomParagraphNode) {
    return new CustomParagraphNode({
      key: node.__key,
      id: node.__id
    });
  }

  static cloneWithID(node: CustomParagraphNode) {
    return new CustomParagraphNode({
      key: node.__key,
      id: node.__id
    });
  }
  static importJSON(
    serializedNode: SerializedCustomParagraphNode
  ) {
    return new CustomParagraphNode({
      id: serializedNode.id
    });
  }

  exportJSON(): SerializedCustomParagraphNode {
    return {
      ...super.exportJSON(),
      type: 'custom-paragraph',
      version: 1,
      id: this.__id
    };
  }

  createDOM(config: EditorConfig) {
    const dom = document.createElement('p');
    dom.id = `custom-paragraph-${this.__id}`;
    return dom;
  }

  setBold(bold: boolean) {
    const dom = document.getElementById(
      `custom-paragraph-${this.__id}`
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
      `custom-paragraph-${this.__id}`
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

export function $isCustomParagraphNode(
  node: any
): node is CustomParagraphNode {
  return node instanceof CustomParagraphNode;
}
