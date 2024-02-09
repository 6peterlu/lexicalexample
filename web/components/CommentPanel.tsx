import { useReactiveVar } from '@apollo/client';
import {
  commentsVar,
  markNodeMapVar
} from '../cache/cache';
import { Loading, Navbar } from '@nextui-org/react';
import { useMemo, useState } from 'react';
import { CommentDB } from '../models/comment';
import CommentCard from './CommentCard';

export default function CommentPanel() {
  const comments = useReactiveVar(commentsVar);
  const markNodeMap = useReactiveVar(markNodeMapVar);
  const commentsOrderedByMarkNodeMap = useMemo(() => {
    if (comments.length === 0) return [];
    const nodeKeys = Object.keys(markNodeMap).sort(
      (a: string, b: string) => parseInt(a) - parseInt(b)
    );
    const commentMap: Record<string, CommentDB> = {};
    for (const comment of comments) {
      commentMap[comment.commentID] = comment;
    }
    const orderedComments = [];
    const verticalOffsetMap: { [key: number]: string[] } =
      {};
    for (const key of nodeKeys) {
      if (
        !(
          markNodeMap[key].verticalOffset in
          verticalOffsetMap
        )
      ) {
        verticalOffsetMap[markNodeMap[key].verticalOffset] =
          [];
      }
      verticalOffsetMap[
        markNodeMap[key].verticalOffset
      ].push(markNodeMap[key].commentID);
    }
    for (const key of Object.keys(verticalOffsetMap)) {
      orderedComments.push({
        // TODO: remove extra parseInt
        commentIDs: verticalOffsetMap[parseInt(key)],
        verticalOffset: parseInt(key)
      });
    }
    return orderedComments;
  }, [markNodeMap, comments]);

  if (!markNodeMap || !comments) {
    return <Loading />;
  }

  return (
    <div style={{ height: '70vh', width: '100%' }}>
      {/* <Navbar>
        <Navbar.Content variant='highlight-rounded'>
          <Navbar.Link
            onClick={() => {
              setDisplayActiveComments(true);
            }}
            isActive={displayActiveComments}
          >
            Active
          </Navbar.Link>
          <Navbar.Link
            onClick={() => {
              setDisplayActiveComments(false);
            }}
            isActive={!displayActiveComments}
          >
            Resolved
          </Navbar.Link>
        </Navbar.Content>
      </Navbar> */}
      <div style={{ position: 'relative', width: '100%' }}>
        {commentsOrderedByMarkNodeMap.map((comment) => (
          <div
            key={comment.commentIDs[0]}
            style={{
              paddingTop: 20
            }}
          >
            <CommentCard
              commentIDs={comment.commentIDs}
              verticalOffset={comment.verticalOffset}
            />
          </div>
        ))}
      </div>
    </div>
  );
}
