import {
  gql,
  useLazyQuery,
  useMutation,
  useQuery,
  useReactiveVar
} from '@apollo/client';
import {
  Loading,
  Spacer,
  Text,
  useTheme
} from '@nextui-org/react';
import NonEditorHeader from '../../components/NonEditorHeader';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';

import { AutoLinkNode, LinkNode } from '@lexical/link';

import {
  TableCellNode,
  TableNode,
  TableRowNode
} from '@lexical/table';
import { challengeResponseVar } from '../../cache/cache';
import { useMemo, useState } from 'react';
import {
  dateInCurrentDayPacificTime,
  getPacificTimeDate,
  getPacificTimezoneDateString,
  useInterval
} from '../../utils/time';
import { useEffect } from 'react';
import DailyChallengeResponse from '../../components/DailyChallengeResponse';
import { useRouter } from 'next/router';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import { faChevronLeft } from '@fortawesome/free-solid-svg-icons/faChevronLeft';
import HoverDiv from '../../components/HoverDiv';
import { useUserInfo } from '../../hooks/useUserInfo';
import NotLoggedInHeader from '../../components/NotLoggedInHeader';
import LandingPageFooter from '../../components/LandingPageFooter';
import {
  CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY,
  PAGE_WIDTH_PX
} from '../../utils/constants';
import Head from 'next/head';
import {
  convertPxStringToNumber,
  getTitleString
} from '../../utils/string';
import useMediaQuery from '../../hooks/useMediaQuery';

const LOAD_CURRENT_DAY_CHALLENGE = gql`
  query getDailyChallengeForDate($date: Date!) {
    getDailyChallengeForDate(args: { date: $date }) {
      prompt {
        date
        id
        content
      }
      response {
        dailyChallengeID
        dailyChallengeResponseID
        content
        userID
        likes
        postedOn
      }
    }
  }
`;

const LOAD_OTHERS_PROMPT_RESPONSES = gql`
  query getOthersDailyChallengeResponses(
    $dailyChallengeID: Int!
    $responseString: String
  ) {
    getOthersDailyChallengeResponses(
      args: {
        dailyChallengeID: $dailyChallengeID
        responseString: $responseString
      }
    ) {
      dailyChallengeID
      dailyChallengeResponseID
      content
      userID
      likes
      postedOn
    }
  }
`;

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

type ChallengePromptData = {
  date: string;
  id: number;
  content: string;
};

// note: you can unpost and repost, but you will lose your likes
export type ChallengeResponseData = {
  dailyChallengeID: string;
  dailyChallengeResponseID: string;
  content: string; // stringified lexical state
  userID: string;
  postedOn: Date | null; // date string
  likes: string[];
};

export default function ChallengePage() {
  // get query param
  const router = useRouter();
  const { date } = router.query;
  const { user } = useUserInfo();
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const [hasRendered, setHasRendered] = useState(false);
  useEffect(() => {
    setHasRendered(true);
  }, []);

  // redirect to /today if date is not today with useeffect
  useEffect(() => {
    if (date) {
      // set to null so we can correctly reload it later
      challengeResponseVar(null);
      const parsed = Date.parse(date as string);
      if (isNaN(parsed) && date !== 'today') {
        router.replace('/challenge/today');
      }
    }
  }, [date, router]);
  const urlDate = useMemo(() => {
    if (date === 'today') {
      return new Date();
    } else {
      const parsed = Date.parse(date as string);
      if (isNaN(parsed)) {
        return null;
      }
      return getPacificTimeDate(date as string);
    }
  }, [date]);
  const hasNextDay = useMemo(() => {
    if (urlDate) {
      const currentDate = new Date();
      return (
        currentDate.getTime() - urlDate.getTime() >
        1000 * 60 * 60 * 24
      );
    }
  }, [urlDate]);
  const {
    data: challengeData,
    loading: challengeDataLoading
  } = useQuery(LOAD_CURRENT_DAY_CHALLENGE, {
    variables: {
      date: getPacificTimezoneDateString(urlDate)
    },
    fetchPolicy: 'no-cache'
  });

  const challengePromptData = useMemo(() => {
    if (challengeData) {
      return challengeData.getDailyChallengeForDate
        .prompt as ChallengePromptData;
    }
    return null;
  }, [challengeData]);
  const challengeResponseData = useMemo(() => {
    if (
      challengeData &&
      challengeData.getDailyChallengeForDate.response
    ) {
      return {
        ...challengeData.getDailyChallengeForDate.response,
        postedOn: challengeData.getDailyChallengeForDate
          .response.postedOn
          ? new Date(
              challengeData.getDailyChallengeForDate.response.postedOn
            )
          : null
      };
    }
  }, [challengeData]);

  // reactive var for challenge response data
  const challengeResponse = useReactiveVar(
    challengeResponseVar
  );
  // set challengeresponse state on initial load only
  useEffect(() => {
    if (user && challengeResponseData) {
      challengeResponseVar(challengeResponseData);
      localStorage.removeItem(
        CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY
      );
    }
  }, [challengeResponseData, user]);

  const [
    getOthersResponseData,
    { data: othersResponseDataGraphQL }
  ] = useLazyQuery(LOAD_OTHERS_PROMPT_RESPONSES, {
    variables: {
      dailyChallengeID: challengePromptData?.id,
      responseString: null as string | null
    },
    fetchPolicy: 'no-cache'
  });

  const othersResponseData: ChallengeResponseData[] =
    useMemo(() => {
      if (othersResponseDataGraphQL) {
        return othersResponseDataGraphQL.getOthersDailyChallengeResponses.map(
          (responseData: any) => {
            return {
              ...responseData,
              postedOn: responseData.postedOn
                ? new Date(responseData.postedOn)
                : null
            };
          }
        );
      }
      return null;
    }, [othersResponseDataGraphQL]);

  // try loading response data
  useEffect(() => {
    if (challengePromptData?.id && user) {
      getOthersResponseData();
    }
  }, [challengePromptData, user, getOthersResponseData]);
  useEffect(() => {
    if (!user) {
      // if no user, set local storage data if not there yet
      let localStorageData = JSON.parse(
        localStorage.getItem(
          CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY
        )
      );
      const postedOnDate = localStorageData?.postedOn
        ? new Date(localStorageData.postedOn)
        : null;

      if (
        !localStorageData ||
        (localStorageData.postedOn &&
          !dateInCurrentDayPacificTime(postedOnDate))
      ) {
        localStorageData = {
          postedOn: null,
          content: null,
          userID: null,
          likes: []
        };
        localStorage.setItem(
          CHALLENGE_RESPONSE_LOCAL_STORAGE_KEY,
          JSON.stringify(localStorageData)
        );
      }
      challengeResponseVar(localStorageData);
    }
  }, [user]);
  if (!hasRendered) {
    // BAD HACK: without this, local development throws a hydration error.
    return null;
  }
  if (!challengeData) {
    return (
      <>
        {user ? (
          <NonEditorHeader title='Daily challenge' />
        ) : (
          <NotLoggedInHeader />
        )}
        {challengeDataLoading ? (
          <Loading />
        ) : (
          <Text>No challenge posted for current day.</Text>
        )}
      </>
    );
  }
  return (
    <>
      <Head>
        <title>{getTitleString('Daily Challenge')}</title>
      </Head>
      {user ? (
        <NonEditorHeader title='Daily challenge' />
      ) : (
        <NotLoggedInHeader />
      )}
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          marginLeft: theme.space[2].value,
          height: '100%'
        }}
      >
        {isDesktop && (
          <div style={{ position: 'absolute', left: 0 }}>
            <HoverDiv>
              <div
                style={{
                  padding: theme.space.sm.value
                }}
                onClick={() => {
                  router.push(
                    `${getPacificTimezoneDateString(
                      new Date(
                        urlDate.getTime() -
                          1000 * 60 * 60 * 24
                      )
                    )}`
                  );
                }}
              >
                <Text>
                  {getPacificTimezoneDateString(
                    new Date(
                      urlDate.getTime() -
                        1000 * 60 * 60 * 24
                    )
                  )}
                </Text>
                <FontAwesomeIcon icon={faChevronLeft} />
              </div>
            </HoverDiv>
          </div>
        )}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            flexDirection: 'column',
            flex: 1
          }}
        >
          <Text
            style={{
              ...{
                fontWeight: theme.fontWeights.bold.value,
                marginTop: theme.space.md.value,
                letterSpacing:
                  theme.letterSpacings.normal.value,
                textAlign: 'center',
                marginBottom: theme.space.md.value
              },
              ...(isDesktop
                ? {
                    width: '50%',
                    margin: theme.space.lg.value,
                    maxWidth: PAGE_WIDTH_PX
                  }
                : {
                    paddingLeft: theme.space.md.value,
                    paddingRight: theme.space.md.value
                  })
            }}
          >
            <span>Prompt #{challengePromptData.id}: </span>
            {challengePromptData.content}
          </Text>
          <DailyChallengeResponse
            challengeResponseData={challengeResponseData}
            isOther={false}
            loadOthersResponses={async ({
              variables
            }: {
              variables: {
                dailyChallengeID: number;
                responseString: string;
              };
            }) => {
              await getOthersResponseData({ variables });
            }}
            urlDate={urlDate}
            dailyChallengeID={challengePromptData.id}
          />
          {challengeResponse?.postedOn &&
            othersResponseData &&
            othersResponseData.map(
              (dailyChallengeResponse) => (
                <DailyChallengeResponse
                  key={
                    dailyChallengeResponse.dailyChallengeResponseID
                  }
                  challengeResponseData={
                    dailyChallengeResponse
                  }
                  isOther={true}
                  dailyChallengeID={challengePromptData.id}
                />
              )
            )}
        </div>
        {hasNextDay && isDesktop && (
          <div
            style={{
              marginRight: theme.space[2].value,
              position: 'absolute',
              right: 0
            }}
          >
            <HoverDiv>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'flex-end',
                  padding: theme.space.sm.value
                }}
                onClick={() => {
                  router.push(
                    getPacificTimezoneDateString(
                      new Date(
                        urlDate.getTime() +
                          1000 * 60 * 60 * 24
                      )
                    )
                  );
                }}
              >
                <Text>
                  {getPacificTimezoneDateString(
                    new Date(
                      urlDate.getTime() +
                        1000 * 60 * 60 * 24
                    )
                  )}
                </Text>
                <FontAwesomeIcon icon={faChevronRight} />
              </div>
            </HoverDiv>
          </div>
        )}
      </div>
      {!user && !isDesktop && <LandingPageFooter />}
    </>
  );
}
