import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import {
  Button,
  Progress,
  Text,
  Tooltip,
  useTheme
} from '@nextui-org/react';
import { useCallback, useEffect, useState } from 'react';
import {
  challengeResponseVar,
  wordCounterStateVar
} from '../cache/cache';
import useMediaQuery from '../hooks/useMediaQuery';
import { useUserInfo } from '../hooks/useUserInfo';
import {
  CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY,
  DAILY_CHALLENGE_REQUIRED_WORD_COUNT,
  PAGE_WIDTH_PX
} from '../utils/constants';
import { convertPxStringToNumber } from '../utils/string';
import {
  getStartAndEndOfCurrentDayPacificTime,
  getStartOfDateLocalTime,
  getUTCDateString,
  toGraphQLString,
  useInterval
} from '../utils/time';
import SubmitPromptSuggestionButton from './SubmitPromptSuggestionButton';

const POST_NOT_LOGGED_IN_DAILY_CHALLENGE_RESPONSE = gql`
  mutation notLoggedInPostDailyChallenge(
    $dailyChallengeID: Int!
    $content: String!
  ) {
    notLoggedInPostDailyChallenge(
      request: {
        dailyChallengeID: $dailyChallengeID
        content: $content
      }
    )
  }
`;

const POST_DAILY_CHALLENGE_RESPONSE = gql`
  mutation postDailyChallengeResponse(
    $dailyChallengeResponseID: String!
  ) {
    postDailyChallengeResponse(
      request: {
        dailyChallengeResponseID: $dailyChallengeResponseID
      }
    )
  }
`;

const SUBMIT_PROMPT_SUGGESTION = gql`
  mutation submitPromptSuggestion($prompt: String!) {
    submitPromptSuggestion(request: { prompt: $prompt })
  }
`;

export default function ProgressBarAndSubmit({
  urlDate,
  dailyChallengeID,
  loadOthersResponses
}: {
  urlDate: Date;
  dailyChallengeID: number;
  loadOthersResponses?: ({
    variables
  }: {
    variables: {
      dailyChallengeID: number;
      responseString?: string;
    };
  }) => Promise<void>;
}) {
  const wordCount = useReactiveVar(wordCounterStateVar);
  const { theme } = useTheme();
  const { user } = useUserInfo();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  // state for challengeResponseData
  const challengeResponse = useReactiveVar(
    challengeResponseVar
  );
  const [postNotLoggedInChallengeResponse] = useMutation(
    POST_NOT_LOGGED_IN_DAILY_CHALLENGE_RESPONSE,
    {
      variables: {
        dailyChallengeID,
        content: null
      }
    }
  );
  const [postChallengeResponse] = useMutation(
    POST_DAILY_CHALLENGE_RESPONSE,
    {
      variables: {
        dailyChallengeResponseID:
          challengeResponse?.dailyChallengeResponseID
      }
    }
  );
  const [dayProgressPercent, setDayProgressPercent] =
    useState(null);
  const [minutesLeft, setMinutesLeft] =
    useState<number>(null);
  const [submitButtonText, setSubmitButtonText] =
    useState('Post');
  const [showModal, setShowModal] = useState(false);
  const [promptSuggestion, setPromptSuggestion] =
    useState('');
  const [submitPromptSuggestion] = useMutation(
    SUBMIT_PROMPT_SUGGESTION,
    {
      variables: {
        prompt: ''
      }
    }
  );
  const updateDayProgress = useCallback(() => {
    if (urlDate) {
      const current = Date.now();
      if (
        getUTCDateString(
          getStartOfDateLocalTime(new Date())
        ) == toGraphQLString(urlDate)
      ) {
        const { endOfCurrentDay } =
          getStartAndEndOfCurrentDayPacificTime();
        const timeLeftToEndOfDay =
          endOfCurrentDay.getTime() - current;
        setDayProgressPercent(
          (100 * timeLeftToEndOfDay) / (1000 * 60 * 60 * 24)
        );
        setMinutesLeft(
          Math.floor(timeLeftToEndOfDay / (1000 * 60))
        );
      }
    }
  }, [urlDate]);

  useEffect(() => {
    updateDayProgress();
  }, [updateDayProgress]);
  useInterval(() => {
    updateDayProgress();
  }, 10_000);
  return (
    <>
      <>
        <div
          style={
            isDesktop
              ? { width: '50%', maxWidth: PAGE_WIDTH_PX }
              : {
                  width: '100%',
                  marginTop: theme.space[12].value
                }
          }
        >
          <>
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'flex-end'
              }}
            >
              {minutesLeft ? (
                <Text color={theme.colors.yellow500.value}>
                  {Math.floor(minutesLeft / 60)} hours,{' '}
                  {minutesLeft % 60} minutes left
                </Text>
              ) : (
                <Text color={theme.colors.gray600.value}>
                  this day is over but your thoughts are
                  always welcome
                </Text>
              )}
            </div>
            <div style={{ transform: 'rotateY(180deg)' }}>
              <Progress
                value={dayProgressPercent}
                size='sm'
                color='warning'
                animated={false}
              />
            </div>
          </>
        </div>
        {!isDesktop && (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'flex-end',
              width: '100%',
              paddingRight: theme.space.md.value
            }}
          >
            <Text
              color={theme.colors.yellow500.value}
              style={{ textAlign: 'end' }}
            >
              post to see what others wrote, all posts are
              anonymous
            </Text>
          </div>
        )}
        <div
          style={{
            ...{
              marginTop: theme.space.md.value,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              width: '100%'
            },
            ...(isDesktop
              ? {}
              : { marginBottom: theme.space.md.value })
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: isDesktop
                ? 'center'
                : 'space-between',
              width: '100%'
            }}
          >
            {!isDesktop && <SubmitPromptSuggestionButton />}
            <Tooltip
              content={
                wordCount <
                DAILY_CHALLENGE_REQUIRED_WORD_COUNT
                  ? 'Type 100 words to submit'
                  : ''
              }
            >
              <Button
                color='warning'
                onClick={async () => {
                  if (user) {
                    await postChallengeResponse({
                      variables: {
                        dailyChallengeResponseID:
                          challengeResponse?.dailyChallengeResponseID
                      }
                    });
                    if (loadOthersResponses) {
                      await loadOthersResponses({
                        variables: {
                          dailyChallengeID
                        }
                      });
                    }
                  } else {
                    const localStorageData = JSON.parse(
                      localStorage.getItem(
                        CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY
                      )
                    );
                    await postNotLoggedInChallengeResponse({
                      variables: {
                        dailyChallengeID,
                        content: localStorageData?.content
                      }
                    });
                    localStorage.setItem(
                      CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY,
                      JSON.stringify({
                        ...localStorageData,
                        postedOn: new Date()
                      })
                    );
                  }
                  challengeResponseVar({
                    ...challengeResponse,
                    postedOn: new Date()
                  });
                }}
                disabled={
                  wordCount <
                  DAILY_CHALLENGE_REQUIRED_WORD_COUNT
                }
                style={{
                  background: `linear-gradient(90deg, ${theme.colors.yellow500.value} 0%, ${theme.colors.yellow500.value} ${wordCount}%, ${theme.colors.gray100.value} ${wordCount}%, ${theme.colors.gray100.value} 100%)`,
                  height: isDesktop
                    ? `${theme.lineHeights['4xl'].value}rem`
                    : `${theme.lineHeights['2xl'].value}rem`,
                  minWidth: 0
                }}
              >
                {submitButtonText}
              </Button>
            </Tooltip>
          </div>

          {isDesktop && (
            <div
              style={{
                marginTop: theme.space.sm.value,
                alignItems: 'center',
                display: 'flex',
                flexDirection: 'column'
              }}
            >
              <Text color={theme.colors.yellow500.value}>
                post to see what others wrote
              </Text>
              <Text color={theme.colors.yellow500.value}>
                all posts are anonymous
              </Text>
              <div
                style={{
                  marginTop: theme.space['2xl'].value
                }}
              >
                <SubmitPromptSuggestionButton />
              </div>
            </div>
          )}
        </div>
      </>
    </>
  );
}
