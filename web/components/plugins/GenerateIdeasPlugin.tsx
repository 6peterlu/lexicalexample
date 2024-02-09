import { gql, useMutation } from '@apollo/client';
import {
  Button,
  Spacer,
  Text,
  useTheme
} from '@nextui-org/react';
import { createPortal } from 'react-dom';
import { IDEAS_PANE_DIV_ID } from '../../pages/document/[enhancedDocumentID]';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { useCallback, useEffect, useState } from 'react';
import {
  $getNodeByKey,
  $getRoot,
  $isTextNode
} from 'lexical';
import { motion } from 'framer-motion';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import { faThumbtack } from '@fortawesome/free-solid-svg-icons/faThumbtack';
import { faArrowUp } from '@fortawesome/free-solid-svg-icons/faArrowUp';
import SectionSeparator from '../SectionSeparator';
import { $isCustomListItemNode } from '../nodes/CustomListItemNode';
import {
  convertPxStringToNumber,
  hashCode
} from '../../utils/string';
import useMediaQuery from '../../hooks/useMediaQuery';

const GET_IDEAS = gql`
  mutation getIdeas(
    $enhancedDocumentID: String
    $text: String!
  ) {
    getIdeas(
      request: {
        enhancedDocumentID: $enhancedDocumentID
        text: $text
      }
    ) {
      ideas
    }
  }
`;

const SET_PINNED_IDEAS = gql`
  mutation setPinnedIdeas(
    $enhancedDocumentID: String!
    $pinnedIdeas: [String!]!
  ) {
    setPinnedIdeas(
      request: {
        enhancedDocumentID: $enhancedDocumentID
        pinnedIdeas: $pinnedIdeas
      }
    )
  }
`;

export default function GenerateIdeasPlugin({
  enhancedDocumentID,
  existingIdeas
}: {
  enhancedDocumentID: string | null;
  existingIdeas: string[];
}) {
  const [domReady, setDomReady] = useState(false);
  useEffect(() => {
    setDomReady(true);
  }, []);
  const { theme } = useTheme();
  const [editor] = useLexicalComposerContext();
  const [ideas, setIdeas] = useState([]);
  const [pinnedIdeas, setPinnedIdeas] =
    useState(existingIdeas);
  const [
    getIdeas,
    { data: ideasResponse, loading: ideasLoading }
  ] = useMutation(GET_IDEAS, {
    variables: { enhancedDocumentID, text: '' }
  });
  const [setPinnedIdeasMutation] = useMutation(
    SET_PINNED_IDEAS,
    {
      variables: {
        enhancedDocumentID,
        pinnedIdeas
      }
    }
  );

  useEffect(() => {
    if (ideasResponse?.getIdeas?.ideas) {
      setIdeas(ideasResponse?.getIdeas?.ideas);
    }
  }, [ideasResponse]);

  const getIdeasClickHandler = useCallback(async () => {
    let text = '';
    const editorState = editor.getEditorState();
    editorState.read(() => {
      const root = $getRoot();
      if (!root.isEmpty()) {
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
              paragraphHeights[nodeKey] = element.offsetTop;
              text +=
                '\n' +
                '#'.repeat(node.getIndent() + 1) +
                ' ' +
                node.getTextContent();
            }
          }
        }
        // setParagraphHeights(paragraphHeights);
        // const lastElement = editor.getElementByKey(
        //   root
        //     .getChildAtIndex(root.getChildrenSize() - 1)
        //     .getKey()
        // );
        // setEndOfDocumentHeight(
        //   lastElement.offsetTop + lastElement.offsetHeight
        // );
      }
      // text = root.getTextContent();
    });
    if (text) {
      await getIdeas({
        variables: { enhancedDocumentID, text }
      });
    }
  }, [editor, enhancedDocumentID, getIdeas]);
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const [showIdeasPanel, setShowIdeasPanel] = useState(
    isDesktop ? true : false
  );

  if (!domReady) {
    return null;
  }
  return createPortal(
    <>
      <motion.div
        layout='position'
        style={{
          display: 'flex',
          alignItems: 'flex-end',
          width: '100%',
          flex: 1,
          marginTop: theme.space.md.value,
          marginBottom: theme.space.md.value
        }}
      >
        <SectionSeparator sectionTitle='thoughts' />

        {ideas && (
          <motion.div
            layout='position'
            style={{
              color: theme.colors.gray500.value,
              paddingLeft: theme.space.md.value,
              paddingRight: theme.space.md.value
            }}
            whileHover={{
              backgroundColor: theme.colors.black.value,
              color: theme.colors.white.value
            }}
            onClick={() => {
              setShowIdeasPanel(!showIdeasPanel);
            }}
          >
            <motion.div
              animate={{ rotate: showIdeasPanel ? 0 : 180 }}
            >
              <FontAwesomeIcon icon={faChevronDown} />
            </motion.div>
          </motion.div>
        )}
      </motion.div>
      <motion.div
        layout='position'
        style={{
          flex: 1,
          backgroundColor: theme.colors.white.value,
          width: '100%'
        }}
      >
        {showIdeasPanel && (
          <>
            {pinnedIdeas.length > 0 && (
              <motion.div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  borderBottomStyle: 'dashed',
                  borderBottomWidth: 1,
                  borderBottomColor:
                    theme.colors.gray500.value,
                  marginBottom: theme.space.md.value
                }}
              >
                {pinnedIdeas.map((idea) => (
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'flex-start'
                    }}
                    key={`pinned-${hashCode(idea)}`}
                  >
                    <motion.div
                      style={{
                        color: theme.colors.red600.value,
                        cursor: 'pointer',
                        marginRight: theme.space.xs.value,
                        marginTop: -6,
                        padding: theme.space.xs.value
                      }}
                      whileHover={{
                        color: theme.colors.white.value,
                        backgroundColor:
                          theme.colors.red600.value
                      }}
                      onClick={async () => {
                        if (enhancedDocumentID) {
                          await setPinnedIdeasMutation({
                            variables: {
                              enhancedDocumentID,
                              pinnedIdeas:
                                pinnedIdeas.filter(
                                  (pinnedIdea) =>
                                    pinnedIdea !== idea
                                )
                            }
                          });
                        }
                        setPinnedIdeas(
                          pinnedIdeas.filter(
                            (pinnedIdea) =>
                              pinnedIdea !== idea
                          )
                        );
                        setIdeas([...ideas, idea]);
                      }}
                    >
                      <FontAwesomeIcon icon={faThumbtack} />
                    </motion.div>
                    <Text
                      style={{
                        letterSpacing: 'normal'
                      }}
                    >
                      {idea}
                    </Text>
                  </div>
                ))}
                <div
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    alignItems: 'center'
                  }}
                >
                  <Text
                    style={{
                      color: theme.colors.gray600.value,
                      letterSpacing: 'normal',
                      fontSize: theme.fontSizes.xs.value,
                      fontFamily: 'Alata',
                      marginRight: 4
                    }}
                  >
                    pinned thoughts
                  </Text>
                  <FontAwesomeIcon
                    icon={faArrowUp}
                    color={theme.colors.gray600.value}
                  />
                </div>
              </motion.div>
            )}
            {ideas &&
              ideas.map((idea: string) => (
                <div
                  style={{ display: 'flex' }}
                  key={`ideas-${hashCode(idea)}`}
                >
                  <motion.div
                    style={{
                      color: theme.colors.gray500.value,
                      cursor: 'pointer',
                      marginRight: theme.space.xs.value,
                      marginTop: -6,
                      padding: theme.space.xs.value
                    }}
                    whileHover={{
                      color: theme.colors.red600.value
                    }}
                    onClick={async () => {
                      if (enhancedDocumentID) {
                        await setPinnedIdeasMutation({
                          variables: {
                            enhancedDocumentID,
                            pinnedIdeas: [
                              ...pinnedIdeas,
                              idea
                            ]
                          }
                        });
                      }
                      setIdeas(
                        ideas.filter(
                          (currentIdea) =>
                            currentIdea !== idea
                        )
                      );
                      setPinnedIdeas([
                        ...pinnedIdeas,
                        idea
                      ]);
                    }}
                  >
                    <FontAwesomeIcon icon={faThumbtack} />
                  </motion.div>
                  <Text style={{ letterSpacing: 'normal' }}>
                    {idea}
                  </Text>
                </div>
              ))}
            {ideas.length === 0 &&
              pinnedIdeas.length === 0 && (
                <div
                  style={{
                    marginBottom: theme.space.md.value
                  }}
                >
                  <Text>no thoughts yet</Text>
                </div>
              )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                marginTop: theme.space.md.value
              }}
            >
              <Button
                onClick={getIdeasClickHandler}
                disabled={ideasLoading}
              >
                {ideasLoading
                  ? 'thinking...'
                  : ideas.length > 0
                  ? 'rethink'
                  : 'think'}
              </Button>
              <div style={{ maxWidth: '30%' }}>
                <Text
                  style={{
                    fontSize: theme.fontSizes.xs.value,
                    fontFamily: 'Alata',
                    color: theme.colors.red700.value,
                    lineHeight: theme.lineHeights.sm.value,
                    textAlign: 'right'
                  }}
                >
                  version 0.0: best for brainstorming and
                  blog outlining
                </Text>
              </div>
            </div>
          </>
        )}
      </motion.div>
    </>,
    document.getElementById(IDEAS_PANE_DIV_ID)
  );
}
