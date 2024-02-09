import {
  ApolloCache,
  DefaultContext,
  FetchResult,
  MutationFunctionOptions,
  gql,
  useMutation
} from '@apollo/client';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode
} from 'lexical';
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import { useDebouncedCallback } from 'use-debounce';
import {
  EmbeddingCallInput,
  GetEmbeddingInput,
  GetEmbeddingOutput
} from '../../generated/types/graphql';
import { v4 } from 'uuid';
import { createPortal } from 'react-dom';
import {
  EMBEDDING_AREA_DIV_ID,
  EMBEDDING_DETAIL_DIV_ID
} from '../../pages/document/[enhancedDocumentID]';
import {
  Button,
  Text,
  Tooltip,
  useTheme
} from '@nextui-org/react';
import {
  SIMILARITY_SCORE_EXPONENT,
  SIMILARITY_SCORE_THRESHOLD,
  getLinkageHash
} from '../../utils/embedding';
import {
  $getTextContentForCustomListItemNode,
  $isCustomListItemNode
} from '../nodes/CustomListItemNode';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { faInfoCircle } from '@fortawesome/free-solid-svg-icons/faInfoCircle';
import useResizeObserver from '@react-hook/resize-observer';

const GET_EMBEDDING = gql`
  mutation getEmbedding(
    $embeddingInputs: [EmbeddingCallInput!]!
    $enhancedDocumentID: String!
    $allNodeIDs: [String!]!
    $embeddingID: String!
  ) {
    getEmbedding(
      request: {
        embeddingInputs: $embeddingInputs
        enhancedDocumentID: $enhancedDocumentID
        allNodeIDs: $allNodeIDs
        embeddingID: $embeddingID
      }
    ) {
      embeddingID
      nodeList
      similarityMatrix
      linkageExplainer
    }
  }
`;
type DirtyNodeMap = {
  nodes: {
    [nodeID: string]: {
      text: string;
    };
  };
};

export default function EmbeddingPlugin({
  enhancedDocumentID,
  existingEmbeddings,
  scrollOffset
}: {
  enhancedDocumentID: string;
  existingEmbeddings: GetEmbeddingOutput;
  scrollOffset: number;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  // **** EMBEDDING LOADING STATE MAP LOGIC *****
  const [
    textContentListenerCalledOnce,
    setTextContentListenerCalledOnce
  ] = useState(false);
  const [dirtyNodeMap, setDirtyNodeMap] =
    useState<DirtyNodeMap>({
      nodes: {
        ...existingEmbeddings.nodeList?.reduce(
          (
            acc: {
              [key: string]: {
                text: string | null;
              };
            },
            e
          ) => {
            acc[e] = {
              text: null
            };
            return acc;
          },
          {}
        )
      }
    });

  // on text content change, update the embedding loading state map
  const textContentListener = useCallback(() => {
    setTextContentListenerCalledOnce(true);
    const newDirtyNodeMap: DirtyNodeMap = {
      ...dirtyNodeMap
    };
    const editorState = editor.getEditorState();
    let requiresUpdate = false;
    let editorLoaded = false;
    const allNodeIDs: string[] = [];
    editorState.read(() => {
      const root = $getRoot();
      if (!root.isEmpty()) {
        // if root is empty we're still loading in
        editorLoaded = true;
      }
      const nodeMap = editor.getEditorState()._nodeMap;
      for (const nodeKey of nodeMap.keys()) {
        const node = $getNodeByKey(nodeKey);
        if ($isCustomListItemNode(node)) {
          const firstChild = node.getFirstChild();
          if (firstChild && $isTextNode(firstChild)) {
            const textContent =
              $getTextContentForCustomListItemNode(node);
            if (
              newDirtyNodeMap.nodes[node.__id] &&
              newDirtyNodeMap.nodes[node.__id].text === null
            ) {
              // first load, just set text content and don't make request
              newDirtyNodeMap.nodes[node.__id] = {
                text: textContent
              };
              requiresUpdate = true;
            } else if (
              !newDirtyNodeMap.nodes[node.__id] ||
              newDirtyNodeMap.nodes[node.__id].text !==
                textContent
            ) {
              // loaded embedding doesn't have this node ID, so we need a new request
              // OR the text has changed so we need a new request
              newDirtyNodeMap.nodes[node.__id] = {
                text: textContent
              };
              requiresUpdate = true;
            }
            allNodeIDs.push(node.__id);
          }
        }
      }
    });
    if (editorLoaded) {
      for (const nodeID in newDirtyNodeMap.nodes) {
        if (!allNodeIDs.includes(nodeID)) {
          requiresUpdate = true;
          delete newDirtyNodeMap.nodes[nodeID];
        }
      }
    }
    if (requiresUpdate) {
      setDirtyNodeMap(newDirtyNodeMap);
    }
  }, [dirtyNodeMap, editor]);

  useEffect(() => {
    editor.registerTextContentListener(textContentListener);
  }, [textContentListener, editor]);

  useEffect(() => {
    // on first render, trigger the text content listener
    if (!textContentListenerCalledOnce) {
      textContentListener();
    }
  }, [textContentListenerCalledOnce, textContentListener]);

  // **** EMBEDDING QUERYING LOGIC *****

  const [getEmbedding, { data: embeddingData }]: [
    (
      options?: MutationFunctionOptions<
        any,
        GetEmbeddingInput,
        DefaultContext,
        ApolloCache<any>
      >
    ) => Promise<FetchResult<GetEmbeddingOutput>>,
    { data?: { getEmbedding: GetEmbeddingOutput } }
  ] = useMutation(GET_EMBEDDING, {
    variables: {
      embeddingInputs: [
        // typing example
        {
          text: '',
          nodeID: ''
        }
      ],
      enhancedDocumentID: '',
      allNodeIDs: [''],
      embeddingID: ''
    },
    fetchPolicy: 'no-cache'
  });
  const [embeddingDataState, setEmbeddingDataState] =
    useState<GetEmbeddingOutput>({
      embeddingID: null,
      similarityMatrix: existingEmbeddings.similarityMatrix,
      nodeList: existingEmbeddings.nodeList,
      // this stringify is because I'm overusing the get embedding output type :/
      linkageExplainer: JSON.stringify(
        existingEmbeddings.linkageExplainer
      )
    });
  useEffect(() => {
    if (embeddingData) {
      setEmbeddingDataState(embeddingData.getEmbedding);
    }
  }, [embeddingData]);
  const debouncedGetEmbedding = useDebouncedCallback(
    getEmbedding,
    300
  );
  const [pendingEmbeddingID, setPendingEmbeddingID] =
    useState<string | null>(null);
  useEffect(() => {
    // whenever the embedding loading state changes, make debounced requests and handle accordingly
    const newRequestsNeeded: EmbeddingCallInput[] = [];
    for (const nodeID in dirtyNodeMap.nodes) {
      newRequestsNeeded.push({
        text: dirtyNodeMap.nodes[nodeID].text,
        nodeID: nodeID
      });
    }
    if (newRequestsNeeded.length > 0) {
      const requestID = v4();
      setPendingEmbeddingID(requestID);
      void debouncedGetEmbedding({
        variables: {
          embeddingInputs: newRequestsNeeded,
          enhancedDocumentID,
          allNodeIDs: Object.keys(dirtyNodeMap.nodes),
          embeddingID: requestID
        }
      });
    }
  }, [
    dirtyNodeMap,
    debouncedGetEmbedding,
    enhancedDocumentID,
    editor
  ]);

  // handle the API response when it comes
  useEffect(() => {
    if (
      embeddingDataState &&
      embeddingDataState.embeddingID &&
      embeddingDataState.embeddingID === pendingEmbeddingID
    ) {
      setPendingEmbeddingID(null);
    }
  }, [
    dirtyNodeMap,
    pendingEmbeddingID,
    embeddingDataState
  ]);

  // **** EMBEDDING RENDERING LOGIC *****
  const [paragraphHeights, setParagraphHeights] = useState<{
    [nodeID: string]: {
      height: number;
      text: string;
      htmlElement: HTMLElement;
    };
  }>({});
  const [activeNodeID, setActiveNodeID] =
    useState<string>(null);
  const recomputeParagraphHeights = useCallback(() => {
    const editorState = editor.getEditorState();
    editorState.read(() => {
      const root = $getRoot();
      const allNodeKeys = editorState._nodeMap.keys();
      const paragraphHeights: {
        [nodekey: string]: {
          height: number;
          text: string;
          htmlElement: HTMLElement;
        };
      } = {};
      for (const nodeKey of allNodeKeys) {
        const node = $getNodeByKey(nodeKey);
        if ($isCustomListItemNode(node)) {
          // add to paragraph heights if the first child is a text node or node has no children
          const firstChild = node.getFirstChild();
          if (!firstChild || $isTextNode(firstChild)) {
            const element = editor.getElementByKey(nodeKey);
            const textContent =
              $getTextContentForCustomListItemNode(node);
            paragraphHeights[node.__id] = {
              height: element.offsetTop,
              text: textContent,
              htmlElement: editor.getElementByKey(nodeKey)
            };
          }
        }
      }
      setParagraphHeights(paragraphHeights);
    });
  }, [editor]);
  useEffect(() => {
    return editor.registerUpdateListener(() => {
      recomputeParagraphHeights();
      editor.getEditorState().read(() => {
        const selection = $getSelection();
        if (
          $isRangeSelection(selection) &&
          selection.isCollapsed()
        ) {
          const listItem = selection.anchor
            .getNode()
            .getParent();
          if ($isCustomListItemNode(listItem)) {
            setActiveNodeID(listItem.__id);
          } else {
            setActiveNodeID(null);
          }
        } else {
          setActiveNodeID(null);
        }
      });
    });
  }, [editor, recomputeParagraphHeights]);
  const embeddingAreaDiv = document.getElementById(
    EMBEDDING_AREA_DIV_ID
  );
  // **** DETAIL PANEL RENDERING LOGIC *****
  const [detailPanelOpen, setDetailPanelOpen] =
    useState<boolean>(false);
  const embeddingAnnotations = useMemo(() => {
    if (!activeNodeID || !embeddingDataState) {
      return [];
    }
    const output = Object.keys(paragraphHeights).map(
      (nodeID) => {
        const targetNodeIndex =
          embeddingDataState.nodeList.indexOf(nodeID);
        const activeNodeIndex =
          embeddingDataState.nodeList.indexOf(activeNodeID);
        if (!targetNodeIndex || !activeNodeIndex) {
          // this happens if new nodes are inserted (i.e. bullets are added)
          return null;
        }
        let similarity = null;
        if (
          targetNodeIndex > activeNodeIndex &&
          embeddingDataState.similarityMatrix[
            activeNodeIndex
          ]?.[targetNodeIndex - activeNodeIndex - 1]
        ) {
          similarity =
            embeddingDataState.similarityMatrix[
              activeNodeIndex
            ][targetNodeIndex - activeNodeIndex - 1];
        } else if (
          targetNodeIndex < activeNodeIndex &&
          embeddingDataState.similarityMatrix[
            targetNodeIndex
          ]?.[activeNodeIndex - targetNodeIndex - 1]
        ) {
          similarity =
            embeddingDataState.similarityMatrix[
              targetNodeIndex
            ][activeNodeIndex - targetNodeIndex - 1];
        } else {
          return null;
        }
        const exponentiatedSimilarity = Math.pow(
          similarity,
          SIMILARITY_SCORE_EXPONENT
        );
        if (
          exponentiatedSimilarity <
          SIMILARITY_SCORE_THRESHOLD
        ) {
          return null;
        }
        let content = null;
        const parsedLinkageExplainer =
          embeddingDataState.linkageExplainer
            ? JSON.parse(
                embeddingDataState.linkageExplainer
              )
            : {};
        if (
          getLinkageHash(
            paragraphHeights[nodeID].text,
            paragraphHeights[activeNodeID].text
          ) in parsedLinkageExplainer
        ) {
          content =
            parsedLinkageExplainer[
              getLinkageHash(
                paragraphHeights[nodeID].text,
                paragraphHeights[activeNodeID].text
              )
            ];
        } else if (
          getLinkageHash(
            paragraphHeights[activeNodeID].text,
            paragraphHeights[nodeID].text
          ) in parsedLinkageExplainer
        ) {
          content =
            parsedLinkageExplainer[
              getLinkageHash(
                paragraphHeights[activeNodeID].text,
                paragraphHeights[nodeID].text
              )
            ];
        }
        return { nodeID: nodeID, content: content };
      }
    );
    const filteredOutput = output.filter((x) => x !== null);
    // update node highlights
    const allNodeIDs = filteredOutput.map((x) => x.nodeID);
    editor.getEditorState().read(() => {
      const nodeMap = editor.getEditorState()._nodeMap;
      for (const nodeKey of nodeMap.keys()) {
        const node = $getNodeByKey(nodeKey);
        if ($isCustomListItemNode(node)) {
          if (allNodeIDs.includes(node.__id)) {
            node.setHighlighted(true);
          } else {
            node.setHighlighted(false);
          }
        }
      }
    });
    return filteredOutput;
  }, [
    activeNodeID,
    editor,
    embeddingDataState,
    paragraphHeights
  ]);
  const sortedNodeIDs = useMemo(() => {
    if (!activeNodeID) {
      return [];
    }
    const activeNodeIndex =
      embeddingDataState.nodeList.indexOf(activeNodeID);
    if (activeNodeIndex < 0) {
      return [];
    }
    const nodeIDScores: {
      nodeID: string;
      similarity: number;
    }[] = [];
    for (let i = 0; i < activeNodeIndex; i++) {
      const targetNodeID = embeddingDataState.nodeList[i];
      const similarityScore =
        embeddingDataState.similarityMatrix[i][
          activeNodeIndex - i - 1
        ];
      nodeIDScores.push({
        nodeID: targetNodeID,
        similarity: similarityScore
      });
    }
    for (
      let i = activeNodeIndex + 1;
      i < embeddingDataState.nodeList.length;
      i++
    ) {
      const targetNodeID = embeddingDataState.nodeList[i];
      const similarityScore =
        embeddingDataState.similarityMatrix[
          activeNodeIndex
        ][i - activeNodeIndex - 1];
      nodeIDScores.push({
        nodeID: targetNodeID,
        similarity: similarityScore
      });
    }
    const nodeIDsBySimilarityToActiveNodeID =
      nodeIDScores.sort(
        (a, b) => b.similarity - a.similarity
      );
    return nodeIDsBySimilarityToActiveNodeID;
  }, [
    activeNodeID,
    embeddingDataState.nodeList,
    embeddingDataState.similarityMatrix
  ]);

  const { theme } = useTheme();

  if (!embeddingAreaDiv) {
    return null;
  }

  return (
    <>
      {createPortal(
        <>
          {activeNodeID && (
            <>
              <div
                style={{
                  position: 'absolute',
                  top:
                    (paragraphHeights[activeNodeID]
                      ?.height ?? 0) + 3
                }}
              >
                <Button
                  icon={
                    <FontAwesomeIcon icon={faArrowRight} />
                  }
                  ghost={!detailPanelOpen}
                  size='xs'
                  style={{ minWidth: 0, borderRadius: 20 }}
                  onPress={() =>
                    setDetailPanelOpen(!detailPanelOpen)
                  }
                />
              </div>
              {embeddingAnnotations.map(
                ({ nodeID, content }) => {
                  if (!content) {
                    return null;
                  }
                  return (
                    <div
                      key={`connection-${nodeID}`}
                      style={{
                        position: 'absolute',
                        top: paragraphHeights[nodeID].height
                      }}
                    >
                      <Tooltip
                        content={content}
                        color='primary'
                      >
                        <FontAwesomeIcon
                          icon={faInfoCircle}
                          color={theme.colors.blue600.value}
                        />
                      </Tooltip>
                    </div>
                  );
                }
              )}
            </>
          )}
        </>,
        embeddingAreaDiv
      )}
      {detailPanelOpen &&
        activeNodeID &&
        createPortal(
          <div
            style={{
              position: 'absolute',
              // left: notePanelWidth as unknown as number,
              top:
                paragraphHeights[activeNodeID].height -
                scrollOffset,
              paddingTop: 0,
              zIndex: 10,
              backgroundColor: 'white',
              borderColor: theme.colors.gray300.value,
              boxShadow: '2px 2px 2px 0px rgba(0,0,0,0.1)',
              borderTopWidth: 0.1,
              borderLeftWidth: 0.1,
              borderTopStyle: 'solid',
              borderLeftStyle: 'solid',
              padding: theme.space.sm.value
            }}
          >
            <Text size='$sm'>Most related</Text>
            <ul style={{ marginTop: 0 }}>
              {sortedNodeIDs.map((node) => {
                if (
                  !Object.keys(paragraphHeights).includes(
                    node.nodeID
                  )
                ) {
                  return null;
                }
                return (
                  <li
                    key={`preview-${node.nodeID}`}
                    style={{
                      fontSize: 10,
                      width: 200,
                      marginBottom: 0,
                      marginTop: 0,
                      fontWeight: 'bold',
                      opacity: 0.5
                    }}
                  >
                    {paragraphHeights[node.nodeID].text}
                  </li>
                );
              })}
            </ul>
            <Text size='$sm'>Least related</Text>
          </div>,
          document.getElementById(EMBEDDING_DETAIL_DIV_ID)
        )}
    </>
  );
}
