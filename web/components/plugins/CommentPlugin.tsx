import { addClassNamesToElement } from '@lexical/utils';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  createRectsFromDOMRange,
  createDOMRange
} from '@lexical/selection';
import {
  Button,
  Input,
  NormalColors,
  useTheme
} from '@nextui-org/react';

import {
  $getNodeByKey,
  $getSelection,
  $isRangeSelection,
  COMMAND_PRIORITY_CRITICAL,
  COMMAND_PRIORITY_LOW,
  NodeKey,
  RangeSelection,
  createCommand
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
import {
  commentsVar,
  currentDocumentVersionIDVar,
  markNodeMapVar,
  Role,
  selectedCommentVar
} from '../../cache/cache';
import {
  gql,
  useMutation,
  useQuery,
  useReactiveVar
} from '@apollo/client';
import {
  TextCommentData,
  CommentType,
  Comment as CommentModel,
  CommentDB as CommentDBModel,
  CommentDB
} from '../../models/comment';
import {
  $isMarkNode,
  $unwrapMarkNode,
  $wrapSelectionInMarkNode,
  MarkNode
} from '@lexical/mark';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faClose } from '@fortawesome/free-solid-svg-icons/faClose';
import { faComment } from '@fortawesome/free-solid-svg-icons/faComment';
import { faPlus } from '@fortawesome/free-solid-svg-icons/faPlus';
import { SCROLL_COMMAND } from '../editor/Editor';
import { getDOMRangeRect } from '../../utils/lexical';

export type Comment = {
  id: string;
  text: string;
  author: string;
  timestamp: Date;
  role: keyof typeof Role;
};

export const ROLE_STRINGS: Record<keyof typeof Role, Key> =
  {
    ADMIN: 'Admin',
    EDITOR: 'Editor',
    PRINCIPAL_REVIEWER: 'Prinicipal Reviewer',
    REVIEWER_1: 'Reviewer 1',
    REVIEWER_2: 'Reviewer 2'
  };

export const ROLE_COLORS: Record<
  keyof typeof Role,
  NormalColors
> = {
  ADMIN: 'primary',
  EDITOR: 'secondary',
  PRINCIPAL_REVIEWER: 'success',
  REVIEWER_1: 'warning',
  REVIEWER_2: 'error'
};

const CREATE_COMMENT = gql`
  mutation createComment(
    $documentID: String!
    $versionName: String
    $commentData: String!
    $selectedText: String!
  ) {
    createComment(
      request: {
        documentID: $documentID
        versionName: $versionName
        commentData: $commentData
        selectedText: $selectedText
      }
    ) {
      createdComment {
        commentData
        commentID
        user {
          userID
          username
        }
        resolved
        selectedText
      }
    }
  }
`;

const LOAD_COMMENTS = gql`
  query getCommentsForDocument(
    $documentID: String!
    $versionName: String
  ) {
    getCommentsForDocument(
      args: {
        documentID: $documentID
        versionName: $versionName
        resolved: false
      }
    ) {
      comments {
        commentData
        commentID
        user {
          userID
          username
        }
        resolved
        selectedText
      }
    }
  }
`;

const RESOLVE_COMMENT_REQUEST = gql`
  mutation resolveComment(
    $commentID: String!
    $userDocumentPermissionID: String!
  ) {
    resolveComment(
      request: {
        commentID: $commentID
        userDocumentPermissionID: $userDocumentPermissionID
      }
    )
  }
`;

const CREATE_COMMENT_COMMAND = createCommand();

type createCommentCommandPayload = {
  commentData: TextCommentData;
};

export function markCommentID({
  commentID
}: {
  commentID: string;
}) {
  const elements = document.getElementsByName(
    `comment-${commentID}`
  );
  for (const element of elements) {
    if (!element.classList.contains('highlight')) {
      // add highlight class if not on element
      addClassNamesToElement(element, 'highlight');
    }
  }
}

export function unmarkCommentID({
  commentID
}: {
  commentID: string;
}) {
  const elements = document.getElementsByName(
    `comment-${commentID}`
  );
  for (const element of elements) {
    element.classList.remove('highlight');
  }
}

export function useMarkComments() {
  function markComments(comments: CommentDB[]) {
    const commentIDs = comments.map(
      (c: CommentDB) => c.commentID
    );
    for (const commentID of commentIDs) {
      markCommentID({ commentID });
    }
  }
  return { markComments };
}

export default function CommentPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const boxRef = useRef<HTMLDivElement>();
  const [activeFocusKey, setActiveFocusKey] =
    useState<NodeKey | null>();
  const { theme } = useTheme();
  const [displayCommentInput, setDisplayCommentInput] =
    useState<boolean>(false);
  const currentDocumentVersionDualID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const [textSelected, setTextSelected] =
    useState<Boolean>(false);
  const [commentInputValue, setCommentInputValue] =
    useState<string>('');

  const markNodeMap = useReactiveVar(markNodeMapVar);
  const comments = useReactiveVar(commentsVar);

  const selectedCommentID = useReactiveVar(
    selectedCommentVar
  );

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

  const [
    createCommentMutation,
    {
      loading: documentContentMutationLoading,
      error: documentContentMutationError,
      data: documentContentMutationData
    }
  ] = useMutation(CREATE_COMMENT);

  const [resolveComment] = useMutation(
    RESOLVE_COMMENT_REQUEST
  );

  const {
    called: commentQueryCalled,
    loading: commentQueryLoading,
    error: commentQueryError,
    data: commentQueryData
  } = useQuery(LOAD_COMMENTS, {
    fetchPolicy: 'no-cache',
    variables: {
      documentID: currentDocumentVersionDualID.documentID,
      versionName: currentDocumentVersionDualID.versionName
    }
  });

  // apply darker highlights when comment card is clicked
  useEffect(() => {
    for (const nodeKey of Object.keys(markNodeMap)) {
      const element = editor.getElementByKey(nodeKey);
      if (element) {
        if (
          markNodeMap[nodeKey].commentID ===
          selectedCommentID
        ) {
          element.classList.add('selected-comment-node');
          const activeElement = document.activeElement;
          editor.update(() => {
            const selection = $getSelection();
            if (!selection) {
              const node = $getNodeByKey(nodeKey);
              if ($isMarkNode(node)) {
                node.selectStart();
              }
            }
          });
        } else {
          element.classList.remove('selected-comment-node');
        }
      }
    }
  }, [selectedCommentID, markNodeMap, editor]);

  // TODO: remove and load comments from get document content endpoint
  useEffect(() => {
    if (commentQueryData) {
      const commentList =
        commentQueryData.getCommentsForDocument.comments.map(
          (c: any) =>
            CommentDB.fromGraphQLResponse({ response: c })
        );
      commentsVar(commentList);
    }
  }, [commentQueryData]);

  // TODO: add back comment resolution logic
  // useEffect(() => {
  //   if (comments.length > 0) {
  //     const commentIDs = comments
  //       .filter((c) => !c.resolved)
  //       .map((c: CommentDB) => c.commentID);
  //     for (const commentID of commentIDs) {
  //       markCommentID({ commentID });
  //     }
  //   }
  // }, [comments]);

  const openCommentInput = useCallback(() => {
    setDisplayCommentInput(true);
  }, []);

  const clearCommentUIElements = useCallback(() => {
    setTextSelected(false);
    setCommentInputValue('');
    setDisplayCommentInput(false);
    selectionState.container.innerHTML = '';
  }, [selectionState.container]);

  // const createComment = useCallback(async () => {
  //   let selection;
  //   let selectionTextContent = '';
  //   const editorState = editor.getEditorState();
  //   editor.update(() => {
  //     selection = $getSelection();
  //     selectionTextContent = selection.getTextContent();
  //   });
  //   if (!selection) {
  //     throw new Error(
  //       'createComment called without selection'
  //     );
  //   }
  //   if ($isRangeSelection(selection)) {
  //     selection = selection as RangeSelection;

  //     const rangeSelectionData =
  //       selection as RangeSelection;

  //     const newTextComment: TextCommentData = {
  //       type: CommentType.TEXT,
  //       text: commentInputValue
  //     };

  //     const commentLocation =
  //       CommentModel.serializeCommentLocation({
  //         rangeSelection: selection,
  //         editorState
  //       });
  //     const rawResponse = await createCommentMutation({
  //       variables: {
  //         documentID:
  //           currentDocumentVersionDualID.documentID,
  //         versionName:
  //           currentDocumentVersionDualID.versionName,
  //         commentData: JSON.stringify(newTextComment),
  //         commentLocation: JSON.stringify(commentLocation),
  //         userDocumentPermissionID:
  //           currentDocumentVersionDualID.loadCommentPermissionID(),
  //         selectedText: selectionTextContent
  //       }
  //     });

  //     const commentModel =
  //       CommentDBModel.fromGraphQLResponse({
  //         response:
  //           rawResponse.data.createComment.createdComment
  //       });
  //     // update comments list
  //     commentsVar([...comments, commentModel]);
  //     // have to wrap the specific call you need in editor.update because async/await doesn't appear to work
  //     editor.update(() => {
  //       $wrapSelectionInMarkNode(
  //         rangeSelectionData,
  //         rangeSelectionData.isBackward(),
  //         rawResponse.data.createComment.createdComment
  //           .commentID
  //       );
  //     });
  //   }
  // }, [editor, comments, commentInputValue]);

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
              const selectedNode =
                selection.anchor.getNode();
              const selectedNodeKey = selectedNode.__parent;
              const commentID =
                markNodeMap[selectedNodeKey]?.commentID;
              if (commentID !== selectedCommentID) {
                selectedCommentVar(commentID);
              }
            }
          }
        });
      }
    );

    // update comment card vertical heights on node creation
    editor.registerMutationListener(
      MarkNode,
      (mutations) => {
        const editorState = editor.getEditorState();
        editorState.read(() => {
          const updatedMarkNodeMap = { ...markNodeMap };
          for (const [key, mutation] of mutations) {
            const node: null | MarkNode =
              $getNodeByKey(key);
            const element = editor.getElementByKey(key);
            // sometimes node has already been removed
            if (mutation === 'created') {
              if (!(key in markNodeMap)) {
                updatedMarkNodeMap[node.getKey()] = {
                  commentID: node.getIDs()[0],
                  verticalOffset: element.offsetTop
                };
              }
            } else if (mutation === 'destroyed') {
              // TODO: figure out why this is firing so many times (~25)
              // note, deleting a node will result in an orphaned comment in the DB that has no node.
              // right now this just means you won't be able to see it in the UI at all
              delete updatedMarkNodeMap[key];
            }
          }
          markNodeMapVar({
            ...updatedMarkNodeMap
          });
        });
      }
    );

    // update comment heights on text content change
    editor.registerTextContentListener(() => {
      const editorState = editor.getEditorState();
      const updatedMarkNodeMap = { ...markNodeMap };
      let changed = false;
      editorState.read(() => {
        for (const key in markNodeMap) {
          const element = editor.getElementByKey('' + key);
          if (element) {
            // sometimes html elements arent rendered yet
            if (
              element.offsetTop !==
              updatedMarkNodeMap[key].verticalOffset
            ) {
              changed = true;
              updatedMarkNodeMap[key].verticalOffset =
                element.offsetTop;
            }
          }
        }
      });
      if (changed) {
        markNodeMapVar(updatedMarkNodeMap);
      }
    });
  }, [
    editor,
    markNodeMap,
    clearCommentUIElements,
    selectedCommentID
  ]);

  useEffect(() => {
    editor.registerCommand(
      CREATE_COMMENT_COMMAND,
      ({
        commentID,
        rangeSelection
      }: {
        commentID: string;
        rangeSelection: RangeSelection;
      }) => {
        editor.update(() => {
          $wrapSelectionInMarkNode(
            rangeSelection,
            rangeSelection.isBackward(),
            commentID
          );
        });
        return true;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor]);

  // on unmount unset comment list
  useEffect(() => {
    return () => {
      markNodeMapVar({});
    };
  }, []);

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
            <>
              {displayCommentInput ? (
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row'
                  }}
                >
                  <div style={{ flex: 1 }}>
                    <Input
                      value={commentInputValue}
                      onChange={(e) => {
                        setCommentInputValue(
                          e.target.value
                        );
                      }}
                    />
                  </div>
                  <Button
                    onClick={async () => {
                      let selectionTextContent = '';
                      let rangeSelection: RangeSelection =
                        null;
                      editor.getEditorState().read(() => {
                        const selection = $getSelection();
                        if ($isRangeSelection(selection)) {
                          rangeSelection = selection;
                        }
                        selectionTextContent =
                          selection.getTextContent();
                      });
                      if (!rangeSelection) {
                        // comments can only wrap around range selections
                        return;
                      }
                      const rawResponse =
                        await createCommentMutation({
                          variables: {
                            documentID:
                              currentDocumentVersionDualID.documentID,
                            versionName:
                              currentDocumentVersionDualID.versionName,
                            commentData: JSON.stringify({
                              type: CommentType.TEXT,
                              text: commentInputValue
                            }),
                            selectedText:
                              selectionTextContent
                          }
                        });

                      // get commentID from newly created comment
                      const commentModel =
                        CommentDBModel.fromGraphQLResponse({
                          response:
                            rawResponse.data.createComment
                              .createdComment
                        });
                      // only dispatch command if the comment saved successfully to the DB
                      editor.dispatchCommand(
                        CREATE_COMMENT_COMMAND,
                        {
                          commentID: commentModel.commentID,
                          rangeSelection
                        }
                      );
                      setCommentInputValue('');
                      setTextSelected(false);
                      setDisplayCommentInput(false);
                    }}
                    disabled={!commentInputValue}
                    icon={<FontAwesomeIcon icon={faPlus} />}
                    style={{ minWidth: 0 }}
                  />
                  <Button
                    onClick={() => {
                      clearCommentUIElements();
                    }}
                    icon={
                      <FontAwesomeIcon icon={faClose} />
                    }
                    color='error'
                    style={{ minWidth: 0 }}
                  />
                </div>
              ) : (
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
              )}
            </>
          )}
        </div>
      }
    </>
  );
}
