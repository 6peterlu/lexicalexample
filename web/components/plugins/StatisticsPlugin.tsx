import {
  useCallback,
  useEffect,
  useRef,
  useState
} from 'react';
import {
  useReactiveVar,
  gql,
  useMutation
} from '@apollo/client';
import {
  challengeResponseVar,
  currentDocumentVersionIDVar,
  currentWritingSessionIDVar,
  timeSpentSecondsTrackerVar,
  wordCounterStateVar
} from '../../cache/cache';
import { useIdleTimer } from 'react-idle-timer';
import { computeActiveTime } from '../../utils/statistics';
import { useInterval } from '../../utils/time';
import { WRITING_SESSION_SEGMENT_SIZE } from '../../utils/constants';

export enum InputType {
  DOCUMENT,
  DAILY_CHALLENGE_RESPONSE
}

const INCREMENT_STAT_UNIT_FOR_DOCUMENT_VERSION_TIME = gql`
  mutation incrementDailyStatUnit(
    $documentVersionID: String!
    $timeSpentSeconds: Int!
    $date: Date!
  ) {
    incrementDailyStatUnit(
      request: {
        documentVersionID: $documentVersionID
        timeSpentSeconds: $timeSpentSeconds
        date: $date
      }
    )
  }
`;

const INCREMENT_STAT_UNIT_FOR_DAILY_CHALLENGE_RESPONSE = gql`
  mutation incrementDailyStatUnitForWritingChallenge(
    $dailyChallengeResponseID: String!
    $timeSpentSeconds: Int!
    $date: Date!
  ) {
    incrementDailyStatUnitForWritingChallenge(
      request: {
        dailyChallengeResponseID: $dailyChallengeResponseID
        timeSpentSeconds: $timeSpentSeconds
        date: $date
      }
    )
  }
`;

const UPDATE_WRITING_SESSION = gql`
  mutation updateWritingSession(
    $writingSessionID: String!
    $wordsAdded: Int!
    $wordsRemoved: Int!
    $timeSpentSeconds: Int!
  ) {
    updateWritingSession(
      request: {
        writingSessionID: $writingSessionID
        wordsAdded: $wordsAdded
        wordsRemoved: $wordsRemoved
        timeSpentSeconds: $timeSpentSeconds
      }
    )
  }
`;

const DELETE_WRITING_SESSION = gql`
  mutation deleteWritingSession(
    $writingSessionID: String!
  ) {
    deleteWritingSession(
      request: { writingSessionID: $writingSessionID }
    )
  }
`;

export default function StatisticsPlugin({
  inputType
}: {
  inputType: InputType;
}): JSX.Element {
  const wordCount = useReactiveVar(wordCounterStateVar);
  const [lastWordCount, setLastWordCount] =
    useState<number>(null);
  const [currentSegment, setCurrentSegment] = useState({
    wordsAdded: 0,
    wordsDeleted: 0,
    lastSavedSegmentTime: Date.now(),
    lastWordCount: 0
  });
  const currentWritingSessionID = useReactiveVar(
    currentWritingSessionIDVar
  );
  const currentWritingSessionIDRef = useRef<string>();
  const [updateWritingSession] = useMutation(
    UPDATE_WRITING_SESSION,
    {
      variables: {
        writingSessionID: currentWritingSessionID,
        wordsAdded: currentSegment.wordsAdded,
        wordsRemoved: currentSegment.wordsDeleted,
        timeSpentSeconds: 0
      }
    }
  );
  const [deleteWritingSession] = useMutation(
    DELETE_WRITING_SESSION,
    {
      variables: {
        writingSessionID: currentWritingSessionID
      }
    }
  );

  const challengeResponse = useReactiveVar(
    challengeResponseVar
  );
  const [incrementStatUnitForDocumentVersion] = useMutation(
    INCREMENT_STAT_UNIT_FOR_DOCUMENT_VERSION_TIME
  );
  const [incrementStatUnitForDailyChallengeResponse] =
    useMutation(
      INCREMENT_STAT_UNIT_FOR_DAILY_CHALLENGE_RESPONSE
    );
  const documentVersionDualID = useReactiveVar(
    currentDocumentVersionIDVar
  );


  // TODO: make this local state
  const timers = useReactiveVar(timeSpentSecondsTrackerVar);

  // load timer once on start
  useEffect(() => {
    if (timers.timeStartMillis.length === 0) {
      timeSpentSecondsTrackerVar({
        ...timers,
        timeStartMillis: [
          ...timers.timeStartMillis,
          Date.now()
        ]
      });
    }
  }, [timers.timeStartMillis, timers]);

  // updating writing session data -- only for documents
  useEffect(() => {
    if (inputType === InputType.DOCUMENT) {
      if (lastWordCount === null) {
        setLastWordCount(wordCount);
      } else if (
        lastWordCount !== wordCount &&
        currentWritingSessionID
      ) {
        let updatedSegment = {
          ...currentSegment
        };
        if (wordCount > lastWordCount) {
          updatedSegment.wordsAdded =
            updatedSegment.wordsAdded +
            wordCount -
            lastWordCount;
        } else if (wordCount < lastWordCount) {
          updatedSegment.wordsDeleted =
            updatedSegment.wordsDeleted +
            lastWordCount -
            wordCount;
        }
        if (
          updatedSegment.wordsAdded +
            updatedSegment.wordsDeleted >
          WRITING_SESSION_SEGMENT_SIZE
        ) {
          updateWritingSession({
            variables: {
              writingSessionID: currentWritingSessionID,
              wordsAdded: updatedSegment.wordsAdded,
              wordsRemoved: updatedSegment.wordsDeleted,
              timeSpentSeconds: Math.floor(
                (Date.now() -
                  updatedSegment.lastSavedSegmentTime) /
                  1000
              )
            }
          });
          // reset segment values back to 0
          updatedSegment = {
            ...updatedSegment,
            lastSavedSegmentTime: Date.now(),
            wordsAdded: 0,
            wordsDeleted: 0
          };
        }
        setLastWordCount(wordCount);
        setCurrentSegment(updatedSegment);
      }
    }
  }, [
    wordCount,
    lastWordCount,
    setLastWordCount,
    currentSegment,
    updateWritingSession,
    currentWritingSessionID,
    inputType
  ]);

  // reset current segment when currentWritingSessionID changes
  useEffect(() => {
    setCurrentSegment({
      wordsAdded: 0,
      wordsDeleted: 0,
      lastSavedSegmentTime: Date.now(),
      lastWordCount: 0
    });
    currentWritingSessionIDRef.current =
      currentWritingSessionID;
  }, [currentWritingSessionID]);

  useEffect(() => {
    // on unmount, delete writing session if there is a current writing session
    return () => {
      if (currentWritingSessionIDRef.current) {
        deleteWritingSession({
          variables: {
            writingSessionID:
              currentWritingSessionIDRef.current
          }
        });
      }
    };
  }, [currentWritingSessionIDRef, deleteWritingSession]);

  const onIdle = useCallback(() => {
    timeSpentSecondsTrackerVar({
      ...timers,
      timeEndMillis: [...timers.timeEndMillis, Date.now()]
    });
  }, [timers]);

  const onActive = useCallback(() => {
    timeSpentSecondsTrackerVar({
      ...timers,
      timeStartMillis: [
        ...timers.timeStartMillis,
        Date.now()
      ]
    });
  }, [timers]);

  const { isIdle } = useIdleTimer({
    onIdle,
    onActive,
    timeout: 10_000
  });

  useEffect(() => {
    timeSpentSecondsTrackerVar({
      timeStartMillis: [],
      timeEndMillis: []
    });
  }, []);

  useInterval(() => {
    const activeTime = computeActiveTime(timers);
    if (activeTime > 0) {
      if (inputType === InputType.DOCUMENT) {
        incrementStatUnitForDocumentVersion({
          variables: {
            documentVersionID:
              documentVersionDualID.documentVersionID,
            timeSpentSeconds: Math.floor(activeTime / 1000),
            date: new Date().toLocaleDateString('fr-CA')
          }
        });
      } else if (
        challengeResponse.dailyChallengeResponseID
      ) {
        incrementStatUnitForDailyChallengeResponse({
          variables: {
            dailyChallengeResponseID:
              challengeResponse.dailyChallengeResponseID,
            timeSpentSeconds: Math.floor(activeTime / 1000),
            date: new Date().toLocaleDateString('fr-CA')
          }
        });
      }
    }
    if (isIdle()) {
      timeSpentSecondsTrackerVar({
        timeStartMillis: [],
        timeEndMillis: []
      });
    } else {
      timeSpentSecondsTrackerVar({
        timeStartMillis: [Date.now()],
        timeEndMillis: []
      });
    }
  }, 10000);
  return null;
}
