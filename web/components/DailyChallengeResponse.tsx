import { LexicalComposer } from '@lexical/react/LexicalComposer';
import {
  Button,
  Loading,
  Modal,
  Text,
  useTheme
} from '@nextui-org/react';
import { ChallengeResponseData } from '../pages/challenge/[date]';
import {
  CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY,
  DAILY_CHALLENGE_REQUIRED_WORD_COUNT,
  PAGE_WIDTH_PX
} from '../utils/constants';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';

import { AutoLinkNode, LinkNode } from '@lexical/link';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import ReadOnlyContentEditable from '../components/editor/ReadOnlyContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { $getRoot, EditorState } from 'lexical';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';

import {
  ORDERED_LIST,
  UNORDERED_LIST
} from '@lexical/markdown';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';

import ToolbarPlugin from '../components/plugins/ToolbarPlugin';
import WordCounterPlugin from '../components/plugins/WordCounterPlugin';

import {
  TableCellNode,
  TableNode,
  TableRowNode
} from '@lexical/table';
import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import { useDebouncedCallback } from 'use-debounce';
import EditorErrorBoundary from './EditorErrorBoundary';
import {
  challengeResponseVar,
  textContentVar,
  wordCounterStateVar
} from '../cache/cache';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronCircleUp } from '@fortawesome/free-solid-svg-icons/faChevronCircleUp';
import HoverDiv from './HoverDiv';
import { useState, useEffect, useMemo } from 'react';

import { useUserInfo } from '../hooks/useUserInfo';
import ProgressBarAndSubmit from './ProgressBarAndSubmit';
import TextContentPlugin from './plugins/TextContentPlugin';
import StatisticsPlugin, {
  InputType
} from './plugins/StatisticsPlugin';
import { getCurrentDateGraphQLString } from '../utils/time';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';

const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph',
  quote: 'editor-quote',
  heading: {
    h1: 'editor-heading-h1',
    h2: 'editor-heading-h2',
    h3: 'editor-heading-h3',
    h4: 'editor-heading-h4',
    h5: 'editor-heading-h5'
  },
  list: {
    nested: {
      listitem: 'editor-nested-listitem'
    },
    ol: 'editor-list-ol',
    ul: 'editor-list-ul',
    listitem: 'editor-listitem'
  },
  image: 'editor-image',
  link: 'editor-link',
  text: {
    bold: 'editor-text-bold',
    italic: 'editor-text-italic',
    overflowed: 'editor-text-overflowed',
    hashtag: 'editor-text-hashtag',
    underline: 'editor-text-underline',
    strikethrough: 'editor-text-strikethrough',
    underlineStrikethrough:
      'editor-text-underlineStrikethrough',
    code: 'editor-text-code'
  },
  code: 'editor-code',
  codeHighlight: {
    atrule: 'editor-tokenAttr',
    attr: 'editor-tokenAttr',
    boolean: 'editor-tokenProperty',
    builtin: 'editor-tokenSelector',
    cdata: 'editor-tokenComment',
    char: 'editor-tokenSelector',
    class: 'editor-tokenFunction',
    'class-name': 'editor-tokenFunction',
    comment: 'editor-tokenComment',
    constant: 'editor-tokenProperty',
    deleted: 'editor-tokenProperty',
    doctype: 'editor-tokenComment',
    entity: 'editor-tokenOperator',
    function: 'editor-tokenFunction',
    important: 'editor-tokenVariable',

    inserted: 'editor-tokenSelector',
    keyword: 'editor-tokenAttr',
    namespace: 'editor-tokenVariable',
    number: 'editor-tokenProperty',
    operator: 'editor-tokenOperator',
    prolog: 'editor-tokenComment',
    property: 'editor-tokenProperty',
    punctuation: 'editor-tokenPunctuation',
    regex: 'editor-tokenVariable',
    selector: 'editor-tokenSelector',
    string: 'editor-tokenSelector',
    symbol: 'editor-tokenProperty',
    tag: 'editor-tokenProperty',
    url: 'editor-tokenOperator',
    variable: 'editor-tokenVariable'
  }
};

const notesTheme = {
  paragraph: 'editor-paragraph'
};

const customNodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  AutoLinkNode,
  LinkNode
];

// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
  throw error;
}

const initialConfig: any = {
  theme,
  onError,
  nodes: customNodes
};
const UPDATE_CURRENT_DAY_CHALLENGE_RESPONSE = gql`
  mutation updateDailyChallengeResponseContent(
    $dailyChallengeResponseID: String!
    $content: String!
    $wordCount: Int!
    $date: Date!
  ) {
    updateDailyChallengeResponseContent(
      request: {
        dailyChallengeResponseID: $dailyChallengeResponseID
        content: $content
        wordCount: $wordCount
        date: $date
      }
    )
  }
`;

const LIKE_DAILY_CHALLENGE_RESPONSE = gql`
  mutation toggleLikeDailyChallengeResponse(
    $dailyChallengeResponseID: String!
  ) {
    toggleLikeDailyChallengeResponse(
      request: {
        dailyChallengeResponseID: $dailyChallengeResponseID
      }
    )
  }
`;

// gql string to unpost challenge response
const UNPOST_DAILY_CHALLENGE_RESPONSE = gql`
  mutation unpostDailyChallengeResponse(
    $dailyChallengeResponseID: String!
  ) {
    unpostDailyChallengeResponse(
      request: {
        dailyChallengeResponseID: $dailyChallengeResponseID
      }
    )
  }
`;

export default function DailyChallengeResponse({
  challengeResponseData,
  isOther,
  loadOthersResponses,
  urlDate,
  dailyChallengeID
}: {
  challengeResponseData: ChallengeResponseData;
  isOther: boolean;
  loadOthersResponses?: ({
    variables
  }: {
    variables: {
      dailyChallengeID: number;
      responseString?: string;
    };
  }) => Promise<void>;
  urlDate?: Date;
  dailyChallengeID: number;
}) {
  const [modalOpen, setModalOpen] =
    useState<boolean>(false);
  const [
    confirmUnpostModalOpen,
    setConfirmUnpostModalOpen
  ] = useState<boolean>(false);
  const wordCount = useReactiveVar(wordCounterStateVar);
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const { user } = useUserInfo();
  // state for challengeResponseData
  const challengeResponse = useReactiveVar(
    challengeResponseVar
  );
  const textContent = useReactiveVar(textContentVar);
  const [
    localChallengeResponseState,
    setLocalChallengeResponseState
  ] = useState<ChallengeResponseData>(null);

  useEffect(() => {
    if (
      !localChallengeResponseState &&
      challengeResponseData
    ) {
      setLocalChallengeResponseState(challengeResponseData);
    }
  }, [challengeResponseData, localChallengeResponseState]);

  const notPostedYet = useMemo(() => {
    return !isOther && !challengeResponse?.postedOn;
  }, [isOther, challengeResponse]);

  const contentEditable = useMemo(() => {
    return !isOther && !challengeResponse?.postedOn;
  }, [isOther, challengeResponse]);

  const [updateChallengeResponse] = useMutation(
    UPDATE_CURRENT_DAY_CHALLENGE_RESPONSE,
    {
      variables: {
        dailyChallengeResponseID:
          challengeResponseData?.dailyChallengeResponseID,
        content: null,
        wordCount: 0,
        date: getCurrentDateGraphQLString()
      }
    }
  );
  const [likeChallengeResponse] = useMutation(
    LIKE_DAILY_CHALLENGE_RESPONSE,
    {
      variables: {
        dailyChallengeResponseID:
          challengeResponseData?.dailyChallengeResponseID
      }
    }
  );
  const [unpostChallengeResponse] = useMutation(
    UNPOST_DAILY_CHALLENGE_RESPONSE,
    {
      variables: {
        dailyChallengeResponseID:
          challengeResponseData?.dailyChallengeResponseID
      }
    }
  );
  const debouncedSaveResponse = useDebouncedCallback(
    async (editorState: EditorState) => {
      await updateChallengeResponse({
        variables: {
          dailyChallengeResponseID:
            challengeResponseData?.dailyChallengeResponseID,
          content: JSON.stringify(editorState),
          wordCount,
          date: getCurrentDateGraphQLString()
        }
      });
    },
    300
  );
  if (!challengeResponse) {
    return <Loading />;
  }
  return (
    <div
      style={{
        ...{
          minHeight: 200,
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          width: '100%'
        },
        ...(isDesktop
          ? { margin: theme.space.lg.value }
          : {
              paddingLeft: theme.space.md.value,
              paddingRight: theme.space.md.value
            })
      }}
    >
      <div
        style={{
          ...{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            borderRadius: theme.radii.md.value,
            boxShadow: isOther
              ? null
              : '0px 10px 50px -12px rgba(0, 0, 0, 0.25)'
          },
          ...(isDesktop
            ? {
                width: '50%',
                margin: theme.space.lg.value,
                maxWidth: PAGE_WIDTH_PX
              }
            : {
                width: '100%',
                flex: 1
              })
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            flex: 1
          }}
          id='editor-viewport'
        >
          <div id='toolbar-container' />
          <div
            style={{
              borderLeftStyle: 'solid',
              borderLeftWidth:
                theme.borderWeights.normal.value,
              borderLeftColor: theme.colors.blue500.value,
              margin: theme.space.md.value,
              padding: theme.space.md.value,
              paddingTop: theme.space.xs.value,
              paddingBottom: theme.space.xs.value,
              flex: 1,
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            {challengeResponse?.postedOn && (
              <div
                style={{
                  marginBottom: theme.space[2].value
                }}
              >
                <Text
                  style={{
                    fontSize: theme.fontSizes.sm.value,
                    color: theme.colors.gray600.value
                  }}
                >
                  posted on:{' '}
                  {(isOther
                    ? challengeResponseData
                    : challengeResponse
                  ).postedOn.toLocaleString()}
                </Text>
              </div>
            )}
            <LexicalComposer
              initialConfig={{
                ...initialConfig,
                editorState:
                  challengeResponseData?.content ??
                  JSON.parse(
                    localStorage.getItem(
                      CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY
                    )
                  )?.content
              }}
            >
              <div
                style={{
                  flex: 1,
                  display: 'flex',
                  flexDirection: 'column'
                }}
              >
                <RichTextPlugin
                  placeholder={null}
                  contentEditable={
                    <ReadOnlyContentEditable
                      style={{
                        outline: 0,
                        flex: 1,
                        zIndex: 1,
                        backgroundColor: 'transparent'
                      }}
                      id='editor-content-editable'
                      contenteditable={contentEditable}
                      wsConnected={true}
                    />
                  }
                  ErrorBoundary={EditorErrorBoundary}
                />
                <OnChangePlugin
                  onChange={(editorState: EditorState) => {
                    if (user) {
                      debouncedSaveResponse(editorState);
                    } else {
                      const currentLocalStorage =
                        JSON.parse(
                          localStorage.getItem(
                            CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY
                          )
                        ) ?? {};

                      localStorage.setItem(
                        CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY,
                        JSON.stringify({
                          ...currentLocalStorage,
                          content:
                            JSON.stringify(editorState)
                        })
                      );
                    }
                  }}
                  ignoreSelectionChange
                />

                <AutoFocusPlugin />
                <MarkdownShortcutPlugin
                  transformers={[
                    ORDERED_LIST,
                    UNORDERED_LIST
                  ]}
                />
                <TabIndentationPlugin />
                {notPostedYet && isDesktop && (
                  <ToolbarPlugin
                    style={{
                      backgroundColor:
                        theme.colors.white.value,
                      paddingTop: theme.space.sm.value,
                      borderTopLeftRadius:
                        theme.radii.md.value,
                      borderTopRightRadius:
                        theme.radii.md.value
                    }}
                  />
                )}
                <WordCounterPlugin />
                <TextContentPlugin />
                {contentEditable &&
                  challengeResponse.dailyChallengeResponseID && (
                    <StatisticsPlugin
                      inputType={
                        InputType.DAILY_CHALLENGE_RESPONSE
                      }
                    />
                  )}
              </div>
            </LexicalComposer>
            {!notPostedYet && challengeResponse ? (
              <div
                style={{
                  marginTop: theme.space.sm.value,
                  display: 'flex',
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-end'
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      marginRight: theme.space[2].value
                    }}
                  >
                    <HoverDiv>
                      <div
                        onClick={async () => {
                          if (user) {
                            await likeChallengeResponse({
                              variables: {
                                dailyChallengeResponseID:
                                  challengeResponseData?.dailyChallengeResponseID
                              }
                            });
                            if (
                              (isOther
                                ? localChallengeResponseState
                                : challengeResponse
                              ).likes.includes(user?.userID)
                            ) {
                              if (isOther) {
                                setLocalChallengeResponseState(
                                  {
                                    ...localChallengeResponseState,
                                    likes:
                                      localChallengeResponseState.likes.filter(
                                        (id) =>
                                          id !==
                                          user?.userID
                                      )
                                  }
                                );
                              } else {
                                challengeResponseVar({
                                  ...challengeResponse,
                                  likes:
                                    challengeResponse.likes.filter(
                                      (id) =>
                                        id !== user?.userID
                                    )
                                });
                              }
                            } else {
                              if (isOther) {
                                setLocalChallengeResponseState(
                                  {
                                    ...localChallengeResponseState,
                                    likes: [
                                      ...localChallengeResponseState.likes,
                                      user?.userID
                                    ]
                                  }
                                );
                              } else {
                                challengeResponseVar({
                                  ...challengeResponse,
                                  likes: [
                                    ...challengeResponse.likes,
                                    user?.userID
                                  ]
                                });
                              }
                            }
                          } else {
                            setModalOpen(true);
                          }
                        }}
                        style={{
                          padding: theme.space[2].value
                        }}
                      >
                        <FontAwesomeIcon
                          icon={faChevronCircleUp}
                          color={theme.colors.blue600.value}
                        />
                      </div>
                    </HoverDiv>
                  </div>
                  <Text
                    color={theme.colors.blue600.value}
                    size={theme.fontSizes.sm.value}
                  >
                    {isOther
                      ? localChallengeResponseState?.likes
                          ?.length
                      : challengeResponse.likes.length}{' '}
                    likes
                  </Text>
                </div>
                {!isOther &&
                  challengeResponse?.postedOn &&
                  user && (
                    <div
                      onClick={() => {
                        setConfirmUnpostModalOpen(true);
                      }}
                      style={{ cursor: 'pointer' }}
                    >
                      <Text
                        style={{
                          fontSize: theme.fontSizes.sm.value
                        }}
                      >
                        Unpost
                      </Text>
                    </div>
                  )}
              </div>
            ) : (
              <div
                style={{ marginTop: theme.space.md.value }}
              >
                <Text
                  color={theme.colors.blue600.value}
                  size={theme.fontSizes.sm.value}
                >
                  {wordCount ?? 0}/
                  {DAILY_CHALLENGE_REQUIRED_WORD_COUNT}{' '}
                  words
                </Text>
              </div>
            )}
          </div>
        </div>
      </div>

      {notPostedYet && (
        <ProgressBarAndSubmit
          urlDate={urlDate}
          loadOthersResponses={loadOthersResponses}
          dailyChallengeID={dailyChallengeID}
        />
      )}
      <Modal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
      >
        <Modal.Header
          style={{
            backgroundColor: theme.colors.blue500.value,
            color: theme.colors.white.value
          }}
        >
          Not logged in
        </Modal.Header>
        <Modal.Body>
          Create an account or login to show your support
          for posts!
        </Modal.Body>
      </Modal>
      <Modal
        open={confirmUnpostModalOpen}
        onClose={() => {
          setConfirmUnpostModalOpen(false);
        }}
      >
        <Modal.Header
          style={{
            backgroundColor: theme.colors.blue500.value,
            color: theme.colors.white.value
          }}
        >
          Unposting confirmation
        </Modal.Header>
        <Modal.Body>
          Unposting will reset your likes.
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end'
            }}
          >
            <Button
              onClick={() => {
                setConfirmUnpostModalOpen(false);
              }}
              style={{
                minWidth: 0,
                marginRight: theme.space.md.value
              }}
              ghost
            >
              Cancel
            </Button>
            <Button
              onClick={async () => {
                // unpost response
                await unpostChallengeResponse({
                  variables: {
                    dailyChallengeResponseID:
                      challengeResponseData?.dailyChallengeResponseID
                  }
                });
                challengeResponseVar({
                  ...challengeResponse,
                  postedOn: null
                });
                setConfirmUnpostModalOpen(false);
              }}
              style={{ minWidth: 0 }}
            >
              Unpost
            </Button>
          </div>
        </Modal.Body>
      </Modal>
    </div>
  );
}
