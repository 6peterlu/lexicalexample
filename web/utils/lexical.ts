import {
  $getRoot,
  $isDecoratorNode,
  $isElementNode,
  $isLineBreakNode,
  $isRootOrShadowRoot,
  $isTextNode,
  EditorState,
  ElementNode,
  LexicalEditor,
  LexicalNode,
  RangeSelection
} from 'lexical';
import { $isListNode } from '@lexical/list';
import { v4 } from 'uuid';
import { $isHeaderNode } from '../components/nodes/HeaderNode';
import { $isHeaderTextNode } from '../components/nodes/HeaderTextNode';
import { OutlineState } from '../cache/cache';
import {
  $isCustomListItemNode,
  CustomListItemNode
} from '../components/nodes/CustomListItemNode';
import { PointType } from 'lexical/LexicalSelection';

export type NodeIndex = {
  nodeKey: string;
  index: number;
};

export function generateInitialLexicalConfigFromText(
  str: string
): string {
  if (str.length === 0) {
    return null;
  }
  return JSON.stringify({
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: str,
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  });
}

export function createLexicalConfigWithBlankString() {
  return {
    root: {
      children: [
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  };
}

export function createBulletedListInitialConfig(): any {
  return {
    root: {
      children: [
        {
          type: 'list',
          version: 1,
          listType: 'bullet',
          tag: 'ul',
          format: '',
          indent: 0,
          children: [
            {
              type: 'custom-list-item',
              version: 1,
              format: '',
              indent: 0,
              children: [
                {
                  detail: 0,
                  indent: 0,
                  format: '',
                  mode: 'normal',
                  style: '',
                  text: 'add some ideas here',
                  type: 'text',
                  version: 1
                }
              ]
            }
          ]
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  };
}

export function createDemoConfig(): any {
  return {
    root: {
      children: [
        {
          children: [
            {
              children: [
                {
                  detail: 0,
                  format: 0,
                  mode: 'normal',
                  style: '',
                  text: 'Future feature ideas for Draft Zero',
                  type: 'text',
                  version: 1
                }
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'custom-list-item',
              version: 1,
              value: 1,
              id: '07a624fb-6740-47a8-9bf5-9a8e9a16256f'
            },
            {
              children: [
                {
                  children: [
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'Export',
                          type: 'text',
                          version: 1
                        }
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 1,
                      type: 'custom-list-item',
                      version: 1,
                      value: 1,
                      id: 'f59458df-05d2-4ec8-bc3a-9ad75c08d4d6'
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: 'export to markdown',
                                  type: 'text',
                                  version: 1
                                }
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 2,
                              type: 'custom-list-item',
                              version: 1,
                              value: 1,
                              id: '4a8cd54d-9ec3-460e-864e-6c7f7c884e7c'
                            },
                            {
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: 'export to pdf',
                                  type: 'text',
                                  version: 1
                                }
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 2,
                              type: 'custom-list-item',
                              version: 1,
                              value: 2,
                              id: '794822eb-8b68-4b00-8c6a-83a3dfa9444a'
                            },
                            {
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: 'export to docx',
                                  type: 'text',
                                  version: 1
                                }
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 2,
                              type: 'custom-list-item',
                              version: 1,
                              value: 3,
                              id: '00aaafa9-a23a-4638-ad20-3e81bc45dcae'
                            }
                          ],
                          direction: 'ltr',
                          format: '',
                          indent: 0,
                          type: 'list',
                          version: 1,
                          listType: 'bullet',
                          start: 1,
                          tag: 'ul'
                        }
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 1,
                      type: 'custom-list-item',
                      version: 1,
                      value: 2,
                      id: '17500ab4-6d32-4b3e-9393-0aeed866d6a0'
                    },
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'Collaboration',
                          type: 'text',
                          version: 1
                        }
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 1,
                      type: 'custom-list-item',
                      version: 1,
                      value: 2,
                      id: 'aed7dfc1-4453-462e-9370-45cf3b18d93e'
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: 'Multi-cursor',
                                  type: 'text',
                                  version: 1
                                }
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 2,
                              type: 'custom-list-item',
                              version: 1,
                              value: 1,
                              id: '7c050d90-92e6-4f28-a78f-1c3cd34ee009'
                            },
                            {
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: 'Comments and comment threads',
                                  type: 'text',
                                  version: 1
                                }
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 2,
                              type: 'custom-list-item',
                              version: 1,
                              value: 2,
                              id: '6aa7c235-3131-44d9-8001-5d68b3966b78'
                            },
                            {
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: 'Shared spaces',
                                  type: 'text',
                                  version: 1
                                }
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 2,
                              type: 'custom-list-item',
                              version: 1,
                              value: 3,
                              id: 'cfb6337a-0569-4bda-b0f8-59456d947589'
                            }
                          ],
                          direction: 'ltr',
                          format: '',
                          indent: 0,
                          type: 'list',
                          version: 1,
                          listType: 'bullet',
                          start: 1,
                          tag: 'ul'
                        }
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 1,
                      type: 'custom-list-item',
                      version: 1,
                      value: 3,
                      id: '891530b3-f271-4bde-a074-0c74d476e037'
                    },
                    {
                      children: [
                        {
                          detail: 0,
                          format: 0,
                          mode: 'normal',
                          style: '',
                          text: 'Research',
                          type: 'text',
                          version: 1
                        }
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 1,
                      type: 'custom-list-item',
                      version: 1,
                      value: 3,
                      id: '6a691d4d-6e47-45df-aa99-177393e4e9a7'
                    },
                    {
                      children: [
                        {
                          children: [
                            {
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: 'Source attribution',
                                  type: 'text',
                                  version: 1
                                }
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 2,
                              type: 'custom-list-item',
                              version: 1,
                              value: 1,
                              id: 'cee49cde-d26b-4e53-b03b-82d4c938b2d2'
                            },
                            {
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: 'Bibliography generation',
                                  type: 'text',
                                  version: 1
                                }
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 2,
                              type: 'custom-list-item',
                              version: 1,
                              value: 2,
                              id: 'd0662eff-62d8-4699-99e0-26b8aa8341e0'
                            },
                            {
                              children: [
                                {
                                  detail: 0,
                                  format: 0,
                                  mode: 'normal',
                                  style: '',
                                  text: 'Link support',
                                  type: 'text',
                                  version: 1
                                }
                              ],
                              direction: 'ltr',
                              format: '',
                              indent: 2,
                              type: 'custom-list-item',
                              version: 1,
                              value: 3,
                              id: '2f776c84-75f9-47c2-9fe9-6b0e35e6b174'
                            }
                          ],
                          direction: 'ltr',
                          format: '',
                          indent: 0,
                          type: 'list',
                          version: 1,
                          listType: 'bullet',
                          start: 1,
                          tag: 'ul'
                        }
                      ],
                      direction: 'ltr',
                      format: '',
                      indent: 1,
                      type: 'custom-list-item',
                      version: 1,
                      value: 4,
                      id: '48fa6c7c-bda8-4b82-8f7e-dc6396b723ef'
                    }
                  ],
                  direction: 'ltr',
                  format: '',
                  indent: 0,
                  type: 'list',
                  version: 1,
                  listType: 'bullet',
                  start: 1,
                  tag: 'ul'
                }
              ],
              direction: 'ltr',
              format: '',
              indent: 0,
              type: 'custom-list-item',
              version: 1,
              value: 2,
              id: '4d53dc8b-f384-41c7-8636-2eb9d2a3d78f'
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'list',
          version: 1,
          listType: 'bullet',
          start: 1,
          tag: 'ul'
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  };
}

export function extractTextFromEditorState(
  editorState: EditorState
): string {
  // type coercion due to lexical weirdness
  const jsonState: any = editorState.toJSON();
  if (jsonState.root.children[0].children[0]) {
    return jsonState.root.children[0].children[0].text;
  }
  return '';
}

export function generateHeaderNodeID(): string {
  return `section-${v4()}`;
}

export function generateDocumentVersionInitialEditorState(): any {
  return {
    root: {
      children: [
        {
          title: '',
          description: [],
          type: 'header',
          version: 1
        },
        {
          children: [
            {
              detail: 0,
              format: 0,
              mode: 'normal',
              style: '',
              text: '',
              type: 'text',
              version: 1
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'paragraph',
          version: 1
        }
      ],
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1
    }
  };
}

export function getOutlineStateFromEditorState(
  editorState: EditorState
): any {
  const sectionData: OutlineState[] = [];

  editorState.read(() => {
    const root = $getRoot();
    for (const node of root.getChildren()) {
      if ($isHeaderNode(node)) {
        sectionData.push({
          key: node.__key,
          title: node.__title,
          description: node.__description
        });
      }
    }
  });
  return sectionData;
}

export function universalIndex(
  inputIndex: number,
  node: ElementNode
): NodeIndex {
  // case: error input specifies an inputIndex that is too large.
  if (inputIndex > node.getTextContentSize()) {
    throw Error(
      `universalIndex: node with key ${node.getKey()} has textContentSize ${node.getTextContentSize()} which is less than desired index ${inputIndex}`
    );
  }
  const childrenNodes = node.getChildren();
  // recursive case: loop through the children until you get the one that has the right index
  let indexRemaining = inputIndex;
  for (const child of childrenNodes) {
    const childTextContentSize = child.getTextContentSize();
    if (childTextContentSize < indexRemaining) {
      indexRemaining -= childTextContentSize;
      continue;
    }
    // child is a text node directly so we need to return
    if ($isTextNode(child)) {
      return {
        nodeKey: child.getKey(),
        index: indexRemaining
      };
    }
    // child is an unknown type of node
    if (!$isElementNode(child)) {
      throw Error(
        `universalIndex: found a node that was not text or element: ${child.getType()}`
      );
    }
    return universalIndex(indexRemaining, child);
  }
  throw Error(
    'universalIndex: went through all nodes of parent and did not find suitable child.'
  );
}

export function extractCommentIDsFromEditorState(
  editorState: any
): string[] {
  const topLevelChildren = editorState.root.children;
  const commentIDs: string[] = [];
  for (const topLevelChild of topLevelChildren) {
    if (topLevelChild.type === 'paragraph') {
      const paragraphChildren = topLevelChild.children;
      for (const paragraphChild of paragraphChildren) {
        if (paragraphChild.type === 'mark') {
          commentIDs.push(...paragraphChild.ids);
        }
      }
    }
  }
  return commentIDs;
}

// This is a big hack and ideally should be a function in the lexical library.
// NOTE: outdated, we're no longer pruning comment nodes this way before saving.
// Keeping around for posterity in case we need to strip nodes later...although we should try not to
// export function UNSAFE_pruneAndProcessMarkNodesFromEditorState(
//   editorState: EditorState
// ): any {
//   const jsonState: any = editorState.toJSON();
//   const comments: LexicalComment[] = [];
//   editorState.read(() => {
//     let lastNodeSize = 0;
//     for (const node of $getRoot()
//       .getChildren()[0]
//       .getChildren()) {
//       const nodeTextContentSize = node.getTextContentSize();
//       if (node.getType() === 'mark') {
//         const comment: LexicalComment =
//           LexicalComment.fromLexicalNode({
//             startOffset: lastNodeSize,
//             endOffset: lastNodeSize + nodeTextContentSize,
//             node
//           });
//         comments.push(comment);
//       } else {
//         lastNodeSize = nodeTextContentSize;
//       }
//     }
//   });

//   // NOTE: needed for old logic below to work
//   const commentLocations = [];
//   let mergeWithPrevNode = false;
//   for (const parent of jsonState.root.children) {
//     // parent.children = parent.children.slice(0, 1);
//     // NOTE: old logic below, in case lexical changes their first node structure
//     const prunedChildren = [];
//     for (const child of parent.children) {
//       if (child.type === 'mark') {
//         if (prunedChildren.length > 0) {
//           // [textNode: "hi", markNode: "hey", textNode: "cat"] -> [textNode: "hiheycat"].
//           // this logic will need to be significantly more advanced to support rich text formatting
//           prunedChildren[prunedChildren.length - 1].text +=
//             child.children[0].text;
//           mergeWithPrevNode = true;
//         } else {
//           prunedChildren.push(...child.children);
//         }
//         commentLocations.push({ commentID: child.ids[0] });
//       } else if (mergeWithPrevNode) {
//         if (child.text) {
//           prunedChildren[prunedChildren.length - 1].text +=
//           child.text;
//         }
//         mergeWithPrevNode = false;
//       } else {
//         prunedChildren.push(child);
//       }
//     }
//     parent.children = prunedChildren;
//   }
//   return { jsonState, comments };
// }

export function getDOMRangeRect(
  nativeSelection: Selection,
  rootElement: HTMLElement
): DOMRect {
  if (!nativeSelection.isCollapsed) {
    const domRange = nativeSelection.getRangeAt(0);

    let rect;

    if (nativeSelection.anchorNode === rootElement) {
      let inner = rootElement;
      while (inner.firstElementChild != null) {
        inner = inner.firstElementChild as HTMLElement;
      }
      rect = inner.getBoundingClientRect();
    } else {
      rect = domRange.getBoundingClientRect();
    }

    return rect;
  }
  return null;
}

export function getWordCount(text: string) {
  const wordCount = (text.match(/\b\S+\b/g) || []).length;
  return wordCount;
}

export function nodeHasSameLevelSibling(
  node: CustomListItemNode
): boolean {
  const parent = node.getParent();
  if ($isRootOrShadowRoot(parent.getParent())) {
    return true; // don't initiate deletion of the top level list item
  }
  return parent.getChildrenSize() > 2;
}

function getCharacterOffset(point: PointType): number {
  const offset = point.offset;
  if (point.type === 'text') {
    return offset;
  }

  const parent = point.getNode();
  return offset === parent.getChildrenSize()
    ? parent.getTextContent().length
    : 0;
}

function getCharacterOffsets(
  selection: RangeSelection
): [number, number] {
  const anchor = selection.anchor;
  const focus = selection.focus;
  if (
    anchor.type === 'element' &&
    focus.type === 'element' &&
    anchor.key === focus.key &&
    anchor.offset === focus.offset
  ) {
    return [0, 0];
  }
  return [
    getCharacterOffset(anchor),
    getCharacterOffset(focus)
  ];
}

// customizing to get the indent level of the text
export function customGetSelectionTextContent(
  selection: RangeSelection
): { textContent: string; plainTextContent: string } {
  const nodes = selection.getNodes();
  if (nodes.length === 0) {
    return { textContent: '', plainTextContent: '' };
  }
  const firstNode = nodes[0];
  const lastNode = nodes[nodes.length - 1];
  const anchor = selection.anchor;
  const focus = selection.focus;
  const isBefore = anchor.isBefore(focus);
  const [anchorOffset, focusOffset] =
    getCharacterOffsets(selection);
  let textContent = '';
  let plainTextContent = '';
  let prevWasElement = true;
  for (let i = 0; i < nodes.length; i++) {
    const node = nodes[i];
    if ($isElementNode(node) && !node.isInline()) {
      if (!prevWasElement) {
        textContent += '\n';
        plainTextContent += '\n';
      }

      if (node.isEmpty()) {
        prevWasElement = false;
      } else {
        prevWasElement = true;
      }
    } else {
      prevWasElement = false;
      if ($isTextNode(node)) {
        const parent = node.getParent();
        if ($isCustomListItemNode(parent)) {
          textContent += '#'.repeat(parent.getIndent() + 1);
        }
        let text = node.getTextContent();
        if (node === firstNode) {
          if (node === lastNode) {
            if (
              anchor.type !== 'element' ||
              focus.type !== 'element' ||
              focus.offset === anchor.offset
            ) {
              text =
                anchorOffset < focusOffset
                  ? text.slice(anchorOffset, focusOffset)
                  : text.slice(focusOffset, anchorOffset);
            }
          } else {
            text = isBefore
              ? text.slice(anchorOffset)
              : text.slice(focusOffset);
          }
        } else if (node === lastNode) {
          text = isBefore
            ? text.slice(0, focusOffset)
            : text.slice(0, anchorOffset);
        }
        textContent += text;
        plainTextContent += text;
      } else if (
        ($isDecoratorNode(node) ||
          $isLineBreakNode(node)) &&
        (node !== lastNode || !selection.isCollapsed())
      ) {
        textContent += node.getTextContent();
        plainTextContent += node.getTextContent();
      }
    }
  }
  return { textContent, plainTextContent };
}
