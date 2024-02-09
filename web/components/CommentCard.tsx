import {
  Card,
  useTheme,
  Text,
  Button,
  Collapse,
  Loading
} from '@nextui-org/react';
import {
  CommentDB,
  TextCommentData,
  TextCommentDataChecker
} from '../models/comment';
import {
  selectedCommentVar,
  currentDocumentVersionIDVar,
  commentsVar,
  activeEditorVar,
  markNodeMapVar
} from '../cache/cache';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faCheck } from '@fortawesome/free-solid-svg-icons/faCheck';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { faClose } from '@fortawesome/free-solid-svg-icons/faClose';

import { motion } from 'framer-motion';
import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import { useCallback, useState } from 'react';
import { $getNodeByKey } from 'lexical';
import {
  $isMarkNode,
  $unwrapMarkNode
} from '@lexical/mark';

function TextComment({
  commentData
}: {
  commentData: TextCommentData;
}) {
  return <Text>{commentData.text}</Text>;
}

function renderComment({
  commentData
}: {
  commentData: any;
}) {
  if (TextCommentDataChecker.is(commentData)) {
    return <TextComment commentData={commentData} />;
  } else {
    throw new Error(
      'renderComment: Comment type did not match any known type'
    );
  }
}

function SingleCommentCard({
  commentID,
  selected
}: {
  commentID: string;
  selected?: boolean;
}) {
  const comments = useReactiveVar(commentsVar);

  const { theme } = useTheme();
  const activeEditor = useReactiveVar(activeEditorVar);
  const markNodeMap = useReactiveVar(markNodeMapVar);

  const resolveCommentAndUpdateCommentList =
    useCallback(() => {
      activeEditor.update(() => {
        for (const nodeKey of Object.keys(markNodeMap)) {
          if (
            markNodeMap[nodeKey].commentID === commentID
          ) {
            const commentNode = $getNodeByKey(nodeKey);
            if ($isMarkNode(commentNode)) {
              $unwrapMarkNode(commentNode);
            }
          }
        }
      });
    }, [activeEditor, markNodeMap, commentID]);
  const comment = comments.filter(
    (c) => commentID === c.commentID
  )[0];
  if (!comment) {
    return <Loading />;
  }

  return (
    <Card
      style={{
        boxShadow: selected
          ? '5px 10px 5px #888888'
          : 'none',
        zIndex: selected ? 1 : 0,
        width: '100%',
        borderRadius: 0,
        borderColor: theme.colors.blue100.value
      }}
      isPressable={true}
      disableRipple={true}
      onPress={() => {
        selectedCommentVar(comment.commentID);
      }}
      variant='flat'
    >
      <Card.Header
        style={{
          backgroundColor: theme.colors.blue500.value,
          color: 'white',
          alignItems: 'flex-start',
          display: 'flex',
          height: 'auto',
          padding: 0,
          paddingLeft: theme.space.md.value,
          paddingRight: 0
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            flex: 1
          }}
        >
          <Text
            style={{
              fontSize: theme.fontSizes.xs.value,
              color: 'white'
            }}
          >{`${comment.user.username}`}</Text>
          {comment.resolved ? (
            <Text
              style={{
                fontSize: theme.fontSizes.xs.value,
                color: 'white'
              }}
            >
              selected: {comment.selectedText}
            </Text>
          ) : (
            <div
              style={{
                display: 'flex',
                flexDirection: 'row'
              }}
            >
              <div>
                <Button
                  icon={<FontAwesomeIcon icon={faCheck} />}
                  style={{
                    minWidth: 0,
                    backgroundColor: 'transparent',
                    color: 'white',
                    height: 20,
                    width: 20
                  }}
                  onClick={async () => {
                    resolveCommentAndUpdateCommentList();
                  }}
                />
              </div>
              <Button
                icon={<FontAwesomeIcon icon={faClose} />}
                style={{
                  minWidth: 0,
                  backgroundColor: 'transparent',
                  color: 'white',
                  height: 20,
                  width: 20
                }}
                onClick={async () => {
                  resolveCommentAndUpdateCommentList();
                }}
              />
            </div>
          )}
        </div>
      </Card.Header>
      <Card.Divider />
      <Card.Body
        style={{
          paddingTop: theme.space.xs.value,
          paddingBottom: theme.space.xs.value,
          backgroundColor: theme.colors.white.value,
          borderColor: theme.colors.gray100.value,
          borderRightWidth: 0,
          borderLeftWidth: 1,
          borderBottomWidth: 1,
          borderTopWidth: 0,
          borderStyle: 'solid'
        }}
      >
        {renderComment({
          commentData: comment.commentData
        })}
      </Card.Body>
    </Card>
  );
}

export default function CommentCard({
  commentIDs,
  selected,
  verticalOffset
}: {
  commentIDs: string[];
  selected?: boolean;
  verticalOffset: number;
}) {
  const { theme } = useTheme();
  const [expanded, setExpanded] = useState<boolean>(false);
  if (commentIDs.length > 1) {
    return (
      <div
        style={{
          position: 'absolute',
          top: verticalOffset,
          width: '100%'
        }}
      >
        <Collapse.Group style={{ padding: 0 }}>
          <Collapse
            onChange={(e) => {
              setExpanded(!expanded);
            }}
            title={
              <div
                style={{
                  ...{
                    backgroundColor:
                      theme.colors.blue500.value,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center'
                  },
                  ...(expanded
                    ? {
                        borderBottomWidth: 1,
                        borderBottomStyle: 'solid',
                        borderBottomColor:
                          theme.colors.white.value
                      }
                    : {})
                }}
              >
                <motion.div
                  animate={expanded ? { rotate: 90 } : {}}
                  style={{
                    ...{
                      marginRight: theme.space.sm.value,
                      marginLeft: theme.space.md.value
                    }
                  }}
                >
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    color={theme.colors.white.value}
                  />
                </motion.div>
                <Text color={theme.colors.white.value}>
                  {commentIDs.length} comments
                </Text>
              </div>
            }
            showArrow={false}
          >
            {commentIDs.map((cid) => (
              <SingleCommentCard
                commentID={cid}
                selected={selected}
                key={cid}
              />
            ))}
          </Collapse>
        </Collapse.Group>
      </div>
    );
  }
  return (
    <div
      style={{
        position: 'absolute',
        top: verticalOffset,
        width: '100%'
      }}
    >
      {commentIDs.map((cid) => (
        <SingleCommentCard
          commentID={cid}
          selected={selected}
          key={cid}
        />
      ))}
    </div>
  );
}
