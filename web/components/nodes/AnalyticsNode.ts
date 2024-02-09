import {
  NodeKey,
  $isElementNode,
  RangeSelection,
  LexicalNode,
  $isTextNode,
  Spread,
  SerializedElementNode,
  EditorConfig,
  ElementNode
} from 'lexical';
import { addClassNamesToElement } from '@lexical/utils';

export enum AnalyticsType {
  THE,
  LONG_SENTENCE,
  MEDIUM_SENTENCE,
  SHORT_SENTENCE
}

export type SerializedAnalyticsNode = Spread<
  {
    ids: Array<string>;
    analyticsType: AnalyticsType;
    type: 'analytics';
    version: 1;
  },
  SerializedElementNode
>;

export class AnalyticsNode extends ElementNode {
  analyticsType: AnalyticsType;
  constructor(analyticsType: AnalyticsType, key?: NodeKey) {
    super(key);
    this.analyticsType = analyticsType;
  }
  static getType(): string {
    return 'analytics';
  }
  static getMarkType(): string {
    return 'analytics';
  }
  static clone(node: AnalyticsNode): AnalyticsNode {
    return new AnalyticsNode(node.type, node.__key);
  }
  static importJSON(
    serializedNode: SerializedAnalyticsNode
  ): AnalyticsNode {
    const node = $createAnalyticsNode(
      serializedNode.analyticsType
    );
    node.setFormat(serializedNode.format);
    node.setIndent(serializedNode.indent);
    node.setDirection(serializedNode.direction);
    return node;
  }

  exportJSON() {
    return {
      ...super.exportJSON(),
      type: 'comment',
      markType: AnalyticsNode.getMarkType(),
      ids: this.getIDs()
    };
  }

  updateDOM(): true {
    return true;
  }

  createDOM(config: EditorConfig): HTMLElement {
    const element = document.createElement('analytics');
    if (
      this.analyticsType === AnalyticsType.LONG_SENTENCE
    ) {
      addClassNamesToElement(element, 'analytics');
    } else if (
      this.analyticsType === AnalyticsType.MEDIUM_SENTENCE
    ) {
      addClassNamesToElement(element, 'medium-sentence');
    } else {
      addClassNamesToElement(element, 'short-sentence');
    }
    return element;
  }
}

export function $createAnalyticsNode(
  analyticsType: AnalyticsType
): AnalyticsNode {
  return new AnalyticsNode(analyticsType);
}

export function $wrapSelectionInAnalyticsNode(
  selection: RangeSelection,
  isBackward: boolean,
  type: AnalyticsType
): void {
  const nodes = selection.getNodes();
  const anchorOffset = selection.anchor.offset;
  const focusOffset = selection.focus.offset;
  const nodesLength = nodes.length;
  const startOffset = isBackward
    ? focusOffset
    : anchorOffset;
  const endOffset = isBackward ? anchorOffset : focusOffset;
  let currentNodeParent;
  let currentMarkNode;

  // We only want wrap adjacent text nodes, line break nodes
  // and inline element nodes. For decorator nodes and block
  // element nodes, we stop out their boundary and start again
  // after, if there are more nodes.
  for (let i = 0; i < nodesLength; i++) {
    const node = nodes[i];
    if (
      currentMarkNode &&
      $isElementNode(currentMarkNode) &&
      currentMarkNode.isParentOf(node)
    ) {
      continue;
    }
    const isFirstNode = i === 0;
    const isLastNode = i === nodesLength - 1;
    let targetNode: LexicalNode | null = null;

    if ($isTextNode(node)) {
      const textContentSize = node.getTextContentSize();
      const startTextOffset = isFirstNode ? startOffset : 0;
      const endTextOffset = isLastNode
        ? endOffset
        : textContentSize;
      if (startTextOffset === 0 && endTextOffset === 0) {
        continue;
      }
      const splitNodes = node.splitText(
        startTextOffset,
        endTextOffset
      );
      targetNode =
        splitNodes.length > 1 &&
        (splitNodes.length === 3 ||
          (isFirstNode && !isLastNode) ||
          endTextOffset === textContentSize)
          ? splitNodes[1]
          : splitNodes[0];
    } else if ($isElementNode(node) && node.isInline()) {
      targetNode = node;
    }
    if (targetNode !== null) {
      if (targetNode && targetNode.is(currentNodeParent)) {
        continue;
      }
      const parentNode = targetNode.getParent();
      if (
        parentNode == null ||
        !parentNode.is(currentNodeParent)
      ) {
        currentMarkNode = undefined;
      }
      currentNodeParent = parentNode;
      if (currentMarkNode === undefined) {
        currentMarkNode = $createAnalyticsNode(type);
        targetNode.insertBefore(currentMarkNode);
      }
      currentMarkNode.append(targetNode);
    } else {
      currentNodeParent = undefined;
      currentMarkNode = undefined;
    }
  }
}
