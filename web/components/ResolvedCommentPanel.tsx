import {
  useReactiveVar,
  gql,
  useMutation,
  useQuery
} from '@apollo/client';
import {
  currentDocumentVersionIDVar,
  showResolvedCommentsVar
} from '../cache/cache';
import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useState } from 'react';
import { CommentDB } from '../models/comment';
import CommentCard from './CommentCard';
import { useTheme } from '@nextui-org/react';

const LOAD_RESOLVED_COMMENTS = gql`
  query getCommentsForDocument(
    $documentID: String!
    $versionName: String
    $userDocumentPermissionID: String!
  ) {
    getCommentsForDocument(
      args: {
        documentID: $documentID
        versionName: $versionName
        userDocumentPermissionID: $userDocumentPermissionID
        resolved: true
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

export default function ResolvedCommentPanel() {
  const visible = useReactiveVar(showResolvedCommentsVar);
  const ids = useReactiveVar(currentDocumentVersionIDVar);
  const { theme } = useTheme();
  const [comments, setComments] = useState<CommentDB[]>([]);
  const {
    called: commentQueryCalled,
    loading: commentQueryLoading,
    error: commentQueryError,
    data: commentQueryData
  } = useQuery(LOAD_RESOLVED_COMMENTS, {
    variables: {
      documentID: ids.documentID,
      versionName: ids.versionName
    }
  });

  useEffect(() => {
    if (commentQueryData) {
      const commentList =
        commentQueryData.getCommentsForDocument.comments.map(
          (c: any) =>
            CommentDB.fromGraphQLResponse({ response: c })
        );
      setComments(commentList);
    }
  }, [commentQueryData]);

  return (
    <div>
      <AnimatePresence>
        {visible && (
          <motion.div
            style={{
              position: 'absolute',
              right: 0,
              zIndex: 1,
              height: '80%',
              overflowY: 'scroll',
              backgroundColor: theme.colors.white.value
            }}
            initial={{ translateX: 300 }}
            animate={{ translateX: 0 }}
            exit={{ translateX: 300 }}
          >
            {comments.map((c) => (
              <></>
              // <CommentCard comment={c} />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
