import { Text, useTheme } from '@nextui-org/react';
import {
  DecoratorNode,
  EditorConfig,
  GridSelection,
  LexicalNode,
  NodeKey,
  NodeSelection,
  RangeSelection,
  SerializedLexicalNode,
  Spread
} from 'lexical';
import DocumentHeader from '../DocumentHeader';
import { generateHeaderNodeID } from './HeaderTextNode';

export type SerializedHeaderNode = Spread<
  {
    title: string;
    description: string[];
  },
  SerializedLexicalNode
>;

export class HeaderNode extends DecoratorNode<JSX.Element> {
  // TODO: set these by typing in the outline box
  __title: string;
  __description: string[];
  static getType(): string {
    return 'header';
  }
  constructor(
    title: string,
    description: string[],
    key?: NodeKey
  ) {
    super(key);
    this.__title = title;
    this.__description = description;
  }
  updateTitleAndDescription({
    title,
    description
  }: {
    title: string;
    description: string[];
  }) {
    const writable = this.getWritable();
    writable.__title = title;
    writable.__description = description;
  }
  exportJSON(): SerializedHeaderNode {
    return {
      type: 'header',
      title: this.__title,
      description: this.__description,
      version: 1
    };
  }
  // header indicators will always be on their own line.
  isInline(): boolean {
    return false;
  }

  // prevent header nodes from being copy pasted
  excludeFromCopy(destination?: 'clone' | 'html'): boolean {
    return true;
  }

  static clone(node: HeaderNode): HeaderNode {
    return new HeaderNode(node.__title, node.__description);
  }
  // make header node unselectable
  isSelected(
    selection?:
      | RangeSelection
      | NodeSelection
      | GridSelection
  ): boolean {
    return false;
  }
  static regenerateWithParagraphNodes(node: HeaderNode[]) {
    return node.map((node) => {
      return HeaderNode.clone(node);
    });
  }
  updateDOM(
    prevNode: HeaderNode,
    element: HTMLElement,
    config: EditorConfig
  ): boolean {
    return false;
  }
  canInsertTextBefore(): boolean {
    return true;
  }
  canInsertTextAfter(): boolean {
    return true;
  }
  decorate(): JSX.Element {
    return (
      <DocumentHeader
        nodeKey={this.getKey()}
        title={this.__title}
        description={this.__description}
      />
    );
  }
  createDOM(_config: EditorConfig): HTMLElement {
    const element = document.createElement('header');
    return element;
  }
  static importJSON(
    serializedNode: SerializedHeaderNode
  ): HeaderNode {
    const node = new HeaderNode(
      serializedNode.title,
      serializedNode.description
    );
    return node;
  }
}

export function $createHeaderNode(
  title: string,
  description: string[]
): HeaderNode {
  const headerNode = new HeaderNode(title, description);
  return headerNode;
}

export function $isHeaderNode(
  node: LexicalNode | null | undefined
): node is HeaderNode {
  return node instanceof HeaderNode;
}
