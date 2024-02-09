import {
  gql,
  useLazyQuery,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import {
  currentDocumentVersionIDVar,
  currentWritingSessionIDVar
} from '../cache/cache';
import ResponsiveButton from './ResponsiveButton';
import { useCallback, useEffect, useState } from 'react';
import {
  Button,
  Loading,
  Modal,
  Popover,
  Text,
  useTheme
} from '@nextui-org/react';
import { WritingSession } from '../generated/types/graphql';
import WritingSessionCard from './WritingSessionCard';

const START_WRITING_SESSION = gql`
  mutation createWritingSession($documentID: String!) {
    createWritingSession(
      request: { documentID: $documentID }
    ) {
      writingSessionID
    }
  }
`;

const COMPLETE_WRITING_SESSION = gql`
  mutation completeWritingSession(
    $writingSessionID: String!
  ) {
    completeWritingSession(
      request: { writingSessionID: $writingSessionID }
    )
  }
`;

const GET_WRITING_SESSION_FOR_DOCUMENT = gql`
  query getWritingSessionForDocument($documentID: String!) {
    getWritingSessionForDocument(
      args: { documentID: $documentID }
    ) {
      writingSessionID
      wordsChanged
      timeSpentSeconds
      startDateTime
      title
      segmentTime
      flow
    }
  }
`;

export default function WritingSessionToggle() {
  const { theme } = useTheme();
  const currentWritingSessionID = useReactiveVar(
    currentWritingSessionIDVar
  );
  const currentDocumentVersionID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const [startWritingSession] = useMutation(
    START_WRITING_SESSION,
    {
      variables: {
        documentID: currentDocumentVersionID.documentID
      }
    }
  );
  const [completeWritingSession] = useMutation(
    COMPLETE_WRITING_SESSION,
    {
      variables: {
        writingSessionID: currentWritingSessionID
      }
    }
  );
  const [
    getWritingSessionForDocument,
    {
      called: getWritingSessionForDocumentCalled,
      data: getWritingSessionForDocumentData
    }
  ] = useLazyQuery(GET_WRITING_SESSION_FOR_DOCUMENT);

  const [writingSession, setWritingSession] =
    useState<WritingSession>(null);

  const onClick = useCallback(async () => {
    if (currentWritingSessionID) {
      await completeWritingSession();
      currentWritingSessionIDVar(null);
    } else {
      const writingSessionResponse =
        await startWritingSession();
      currentWritingSessionIDVar(
        writingSessionResponse.data.createWritingSession
          .writingSessionID
      );
    }
  }, [
    startWritingSession,
    completeWritingSession,
    currentWritingSessionID
  ]);

  useEffect(() => {
    if (
      currentDocumentVersionID.documentID &&
      !getWritingSessionForDocumentCalled
    ) {
      getWritingSessionForDocument({
        variables: {
          documentID: currentDocumentVersionID.documentID
        },
        fetchPolicy: 'no-cache'
      });
    }
  }, [
    currentDocumentVersionID.documentID,
    getWritingSessionForDocument,
    getWritingSessionForDocumentCalled
  ]);

  useEffect(() => {
    if (getWritingSessionForDocumentData) {
      currentWritingSessionIDVar(
        getWritingSessionForDocumentData
          .getWritingSessionForDocument?.writingSessionID ??
          null
      );
      setWritingSession(
        getWritingSessionForDocumentData.getWritingSessionForDocument
      );
    }
  }, [getWritingSessionForDocumentData]);

  if (!currentDocumentVersionID.documentID) {
    return <Loading />;
  }
  return (
    <>
      {currentWritingSessionID ? (
        <Popover
          onOpenChange={async (isOpen) => {
            if (isOpen) {
              await getWritingSessionForDocument({
                variables: {
                  documentID:
                    currentDocumentVersionID.documentID
                },
                fetchPolicy: 'no-cache'
              });
            }
          }}
        >
          <Popover.Trigger>
            <Button>Manage writing session</Button>
          </Popover.Trigger>
          <Popover.Content>
            <div style={{ padding: theme.space.lg.value }}>
              {writingSession && (
                <>
                  <WritingSessionCard
                    writingSession={writingSession}
                    isSelf={true}
                  />
                  <ResponsiveButton onClick={onClick}>
                    Post
                  </ResponsiveButton>
                </>
              )}
            </div>
          </Popover.Content>
        </Popover>
      ) : (
        <ResponsiveButton onClick={onClick}>
          Start writing session
        </ResponsiveButton>
      )}
    </>
  );
}
