import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  createRectsFromDOMRange,
  createDOMRange
} from '@lexical/selection';
import {
  Button,
  Input,
  Tooltip,
  useTheme
} from '@nextui-org/react';

import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  COMMAND_PRIORITY_LOW,
  NodeKey,
  RangeSelection
} from 'lexical';
import {
  Key,
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faComment } from '@fortawesome/free-solid-svg-icons/faComment';
import { faLeftRight } from '@fortawesome/free-solid-svg-icons/faLeftRight';
import { SCROLL_COMMAND } from '../editor/Editor';
import {
  customGetSelectionTextContent,
  getDOMRangeRect
} from '../../utils/lexical';
import { ThreadState } from '../../pages/document/[enhancedDocumentID]';
import { $isCustomListItemNode } from '../nodes/CustomListItemNode';
import { chatWindowOpenVar } from '../../cache/cache';
import { gql, useMutation } from '@apollo/client';

const EXTRAPOLATE_SELECTION = gql`
  mutation extrapolateIdeaInContext(
    $enhancedDocumentID: String!
    $precedingText: String!
    $followingText: String!
    $idea: String!
  ) {
    extrapolateIdeaInContext(
      request: {
        enhancedDocumentID: $enhancedDocumentID
        precedingText: $precedingText
        followingText: $followingText
        idea: $idea
      }
    ) {
      extrapolatedIdea
    }
  }
`;

export default function NewInitiateChatPlugin({
  currentThreadState,
  setThreadState,
  setChatWindowOpen,
  listPlugin,
  enhancedDocumentID
}: {
  currentThreadState: ThreadState;
  setThreadState: (newThreadState: ThreadState) => void;
  setChatWindowOpen: (open: boolean) => void;
  listPlugin: boolean;
  enhancedDocumentID: string;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [extrapolateIdeaMutation] = useMutation(
    EXTRAPOLATE_SELECTION,
    {
      variables: {
        enhancedDocumentID,
        precedingText: '',
        followingText: '',
        idea: ''
      }
    }
  );
  const boxRef = useRef<HTMLDivElement>();
  const [activeFocusKey, setActiveFocusKey] =
    useState<NodeKey | null>();
  const { theme } = useTheme();
  const [displayCommentInput, setDisplayCommentInput] =
    useState<boolean>(false);
  const [textSelected, setTextSelected] =
    useState<Boolean>(false);
  const [commentInputValue, setCommentInputValue] =
    useState<string>('');
  // used to keep track of the comment highlight rects
  const selectionState = useMemo(() => {
    const pre = document.createElement('pre');
    // html pre element: https://developer.mozilla.org/en-US/docs/Web/HTML/Element/pre
    // needed to prevent a white bar on the bottom of the page
    pre.setAttribute('style', 'padding:0;margin:0;');
    return {
      container: pre,
      elements: []
    };
  }, []);

  const openCommentInput = useCallback(() => {
    const editorState = editor.getEditorState();
    let document = '';
    let plainText = '';
    let markdownText = '';
    editorState.read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const { textContent, plainTextContent } =
          customGetSelectionTextContent(selection);
        plainText = plainTextContent;
        markdownText = textContent;
      }
      const root = $getRoot();
      if (!root.isEmpty()) {
        if (listPlugin) {
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
                paragraphHeights[nodeKey] =
                  element.offsetTop;
                document +=
                  '\n' +
                  '#'.repeat(node.getIndent() + 1) +
                  ' ' +
                  node.getTextContent();
              }
            }
          }
        } else {
          document += root.getTextContent();
        }
      }
    });
    setThreadState({
      ...currentThreadState,
      messages: [],
      chatWindowOpen: true,
      plainText: plainText,
      sectionText: markdownText,
      document: document
    });
    setChatWindowOpen(true);
  }, [
    currentThreadState,
    editor,
    listPlugin,
    setChatWindowOpen,
    setThreadState
  ]);

  const extrapolateClickHandler = useCallback(async () => {
    const editorState = editor.getEditorState();
    let precedingText = '';
    let followingText = '';
    let textContent = '';
    editorState.read(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        const startingPoint = selection.isBackward()
          ? selection.focus
          : selection.anchor;
        const endingPoint = selection.isBackward()
          ? selection.anchor
          : selection.focus;
        const startingPointNode = $getNodeByKey(
          startingPoint.key
        );
        precedingText = startingPointNode
          .getTextContent()
          .slice(0, startingPoint.offset);
        const endingPointNode = $getNodeByKey(
          endingPoint.key
        );
        followingText = endingPointNode
          .getTextContent()
          .slice(endingPoint.offset);
        const selectionTextContent =
          customGetSelectionTextContent(selection);
        textContent = selectionTextContent.textContent;
      }
    });
    const extrapolatedText = await extrapolateIdeaMutation({
      variables: {
        enhancedDocumentID,
        precedingText,
        followingText,
        idea: textContent
      }
    });
    editor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        // replace selection with extrapolated text
        const parts =
          extrapolatedText.data.extrapolateIdeaInContext.extrapolatedIdea.split(
            /(\r?\n|\t)/
          );
        const partsLength = parts.length;
        for (let i = 0; i < partsLength; i++) {
          const part = parts[i];
          if (part === '\n' || part === '\r\n') {
            selection.insertParagraph();
          } else {
            selection.insertText(part);
          }
        }
      }
    });
  }, [editor, enhancedDocumentID, extrapolateIdeaMutation]);

  const clearCommentUIElements = useCallback(() => {
    setTextSelected(false);
    setCommentInputValue('');
    setDisplayCommentInput(false);
    selectionState.container.innerHTML = '';
  }, [selectionState.container]);

  const updateCommentCreateButtonPosition =
    useCallback(() => {
      // comment create button
      const rootElement = editor.getRootElement();
      const nativeSelection = window.getSelection();
      if (!nativeSelection.isCollapsed) {
        const rangeRect = getDOMRangeRect(
          nativeSelection,
          rootElement
        );
        const boxElem = boxRef.current;
        if (boxElem) {
          boxElem.style.left = `${rangeRect.right}px`;
          boxElem.style.top = `${rangeRect.top - 40}px`;
        }
      }
    }, [editor, boxRef]);

  const updateCommentInputBoxPosition = useCallback(() => {
    if (displayCommentInput) {
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          const anchor = selection.anchor;
          const focus = selection.focus;
          const range = createDOMRange(
            editor,
            anchor.getNode(),
            anchor.offset,
            focus.getNode(),
            focus.offset
          );
          if (range) {
            const selectionRects = createRectsFromDOMRange(
              editor,
              range
            );
            // clear existing rects, if any
            selectionState.container.innerHTML = '';
            for (const selectionRect of selectionRects) {
              const generatedSpan =
                document.createElement('span');
              const style = `position:absolute;top:${selectionRect.top}px;left:${selectionRect.left}px;height:${selectionRect.height}px;width:${selectionRect.width}px;background-color:rgba(255, 212, 0, 0.3);pointer-events:none;z-index:5;`;
              generatedSpan.style.cssText = style;
              selectionState.container.appendChild(
                generatedSpan
              );
            }
          }
        }
      });
    }
  }, [editor, selectionState, displayCommentInput]);

  const scrollResponder = useCallback(() => {
    updateCommentCreateButtonPosition();
    updateCommentInputBoxPosition();
    return true;
  }, [
    updateCommentCreateButtonPosition,
    updateCommentInputBoxPosition
  ]);

  useEffect(() => {
    return editor.registerCommand(
      SCROLL_COMMAND,
      scrollResponder,
      COMMAND_PRIORITY_LOW
    );
  }, [editor, scrollResponder]);

  useLayoutEffect(() => {
    // load container into document.body
    updateCommentInputBoxPosition();
    const container = selectionState.container;
    const body = document.body;
    if (body !== null) {
      body.appendChild(container);
      return () => {
        body.removeChild(container);
      };
    }
  }, [
    selectionState.container,
    updateCommentInputBoxPosition
  ]);

  useEffect(() => {
    window.addEventListener(
      'resize',
      updateCommentInputBoxPosition
    );

    return () => {
      window.removeEventListener(
        'resize',
        updateCommentInputBoxPosition
      );
    };
  }, [updateCommentInputBoxPosition]);

  useEffect(() => {
    window.addEventListener(
      'resize',
      updateCommentCreateButtonPosition
    );

    return () => {
      window.removeEventListener(
        'resize',
        updateCommentCreateButtonPosition
      );
    };
  }, [editor, updateCommentCreateButtonPosition]);

  useLayoutEffect(() => {
    updateCommentCreateButtonPosition();
  }, [
    activeFocusKey,
    editor,
    updateCommentCreateButtonPosition
  ]);

  useEffect(() => {
    // update comment input box position
    editor.registerUpdateListener(
      ({ editorState, tags }) => {
        editorState.read(() => {
          const selection = $getSelection();
          if ($isRangeSelection(selection)) {
            const { textContent, plainTextContent } =
              customGetSelectionTextContent(selection);
            const focusNode = selection.focus.getNode();
            if (!selection.isCollapsed()) {
              setTextSelected(true);
              setActiveFocusKey(focusNode.getKey());
              const rootElement = editor.getRootElement();
              const nativeSelection = window.getSelection();
              const rangeRect = getDOMRangeRect(
                nativeSelection,
                rootElement
              );
              const boxElem = boxRef.current;
              if (boxElem) {
                boxElem.style.left = `${rangeRect.right}px`;
                boxElem.style.top = `${
                  rangeRect.top - 40
                }px`;
              }
            } else {
              setActiveFocusKey(null);
              clearCommentUIElements();
            }
          }
        });
      }
    );
  }, [editor, clearCommentUIElements]);

  return (
    <>
      {
        <div
          ref={boxRef}
          style={{
            position: 'fixed',
            zIndex: 1000
          }}
        >
          {textSelected && (
            <div style={{ display: 'flex' }}>
              <Tooltip content='Chat about this text'>
                <Button
                  icon={
                    <FontAwesomeIcon icon={faComment} />
                  }
                  style={{
                    minWidth: 0,
                    backgroundColor:
                      theme.colors.blue500.value
                  }}
                  onClick={() => {
                    openCommentInput();
                  }}
                />
              </Tooltip>
              {!listPlugin && (
                <Tooltip content='Expand this idea'>
                  <Button
                    icon={
                      <FontAwesomeIcon icon={faLeftRight} />
                    }
                    style={{
                      minWidth: 0,
                      backgroundColor:
                        theme.colors.blue500.value,
                      marginLeft: theme.space.xs.value
                    }}
                    onClick={async () => {
                      await extrapolateClickHandler();
                    }}
                  />
                </Tooltip>
              )}
            </div>
          )}
        </div>
      }
    </>
  );
}
