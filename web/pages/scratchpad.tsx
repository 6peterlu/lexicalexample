import {
  Button,
  Input,
  Text,
  Popover,
  useTheme
} from '@nextui-org/react';
import NonEditorHeader from '../components/NonEditorHeader';
import {
  gql,
  useLazyQuery,
  useQuery
} from '@apollo/client';
import ScratchpadPreview from '../components/ScratchpadPreview';
import { ScratchpadEntry } from '../models/scratchpadEntry';
import {
  useState,
  useEffect,
  useCallback,
  createRef,
  Ref,
  useRef
} from 'react';
import { getDateNDaysAgo } from '../utils/time';
import { ScratchpadEntry as gql_ScratchpadEntry } from '../generated/types/graphql';
import { GroupedVirtuoso, Virtuoso } from 'react-virtuoso';
import { DayPicker } from 'react-day-picker';
import dayjs from 'dayjs';
import timezone from 'dayjs/plugin/timezone';
import utc from 'dayjs/plugin/utc';
import Head from 'next/head';
import { getTitleString } from '../utils/string';
import { getUTCDateString } from '../utils/time';

dayjs.extend(utc);
dayjs.extend(timezone);

const LOAD_SCRATCHPAD_ENTRIES = gql`
  query getScratchpadEntriesForUser($date: Date!) {
    getScratchpadEntriesForUser(args: { date: $date })
  }
`;

const LOAD_SCRATCHPAD_ENTRY_CONTENT = gql`
  query getContentForScratchpadEntries($dates: [Date!]!) {
    getContentForScratchpadEntries(
      args: { dates: $dates }
    ) {
      scratchpadEntryID
      content
      userID
      date
    }
  }
`;

export default function Scratchpad() {
  const { theme } = useTheme();
  const { data: scratchpadEntryData } = useQuery(
    LOAD_SCRATCHPAD_ENTRIES,
    {
      variables: {
        // src for this date code https://stackoverflow.com/questions/2388115/get-locale-short-date-format-using-javascript/9893752#9893752
        date: new Date().toLocaleDateString('fr-CA')
      },
      fetchPolicy: 'no-cache'
    }
  );
  const [
    loadScratchpadEntryContent,
    { data: scratchpadEntryContentData }
  ] = useLazyQuery(LOAD_SCRATCHPAD_ENTRY_CONTENT, {
    fetchPolicy: 'no-cache'
  });
  const virtuoso = useRef(null);
  const [itemsLoaded, setItemsLoaded] = useState<
    ScratchpadEntry[]
  >([]);
  const [firstLoad, setFirstLoad] = useState<boolean>(true);
  // string array of all dates to load lazily
  const [datesArray, setDatesArray] = useState<string[]>(
    []
  );
  const [datepickerSelectedDay, setDatepickerSelectedDay] =
    useState<Date>(null);
  const [firstIndexLoaded, setFirstIndexLoaded] =
    useState<number>(0);
  const loadMoreItems = useCallback(
    (startIndex: number) => {
      const realIndex = startIndex + firstIndexLoaded + 1;
      if (realIndex >= datesArray.length) {
        // we've loaded everything, stop
        return;
      }
      // load 7 new entries at a time
      const endIndex = Math.min(
        datesArray.length,
        realIndex + 7
      );
      const datesToLoad = [...datesArray].slice(
        realIndex,
        endIndex
      );
      loadScratchpadEntryContent({
        variables: {
          dates: datesToLoad
        }
      });
    },
    [
      datesArray,
      firstIndexLoaded,
      loadScratchpadEntryContent
    ]
  );

  // update the dates array during initial data load
  useEffect(() => {
    if (
      datesArray.length === 0 &&
      scratchpadEntryData?.getScratchpadEntriesForUser
    ) {
      setDatesArray(
        scratchpadEntryData.getScratchpadEntriesForUser
      );
      const currentDate = dayjs.tz(
        datesArray[0],
        dayjs.tz.guess()
      );
      setDatepickerSelectedDay(currentDate.toDate());
    }
  }, [scratchpadEntryData, datesArray]);

  useEffect(() => {
    // cold start
    if (datesArray.length !== 0 && firstLoad) {
      // this defines the index _before_ the first one, so that's why it's -1
      loadMoreItems(-1);
      setFirstLoad(false);
      // virtuoso.current.scrollToIndex({
      //   index: 0,
      //   align: 'start',
      //   behavior: 'auto'
      // });
    }
  }, [datesArray, loadMoreItems, firstLoad]);
  // load the content entries into the map
  useEffect(() => {
    if (
      scratchpadEntryContentData?.getContentForScratchpadEntries &&
      scratchpadEntryContentData
        .getContentForScratchpadEntries.length > 0 &&
      scratchpadEntryContentData
        .getContentForScratchpadEntries[
        scratchpadEntryContentData
          .getContentForScratchpadEntries.length - 1
      ].date !==
        getUTCDateString(
          itemsLoaded[itemsLoaded.length - 1]?.date
        )
    ) {
      setItemsLoaded([
        ...itemsLoaded,
        ...scratchpadEntryContentData.getContentForScratchpadEntries.map(
          (s: gql_ScratchpadEntry) =>
            ScratchpadEntry.fromGraphQL(s)
        )
      ]);
    }
  }, [scratchpadEntryContentData, itemsLoaded]);
  const updateInitialContent = useCallback(
    (scratchpadEntryID: string, contentString: string) => {
      const updatedItems = [];
      for (const item of itemsLoaded) {
        if (item.scratchpadEntryID !== scratchpadEntryID) {
          updatedItems.push(item);
        } else {
          updatedItems.push({
            ...item,
            content: contentString
          });
        }
      }
      setItemsLoaded(updatedItems);
    },
    [itemsLoaded]
  );
  const jumpToDay = useCallback(
    (date: Date) => {
      const dateStringToJumpTo =
        date.toLocaleDateString('fr-CA');
      const indexOf = itemsLoaded
        .map((i) =>
          i.date.toLocaleDateString('fr-CA', {
            timeZone: 'UTC'
          })
        )
        .indexOf(dateStringToJumpTo);
      if (indexOf >= 0) {
        virtuoso.current.scrollToIndex({
          index: indexOf,
          align: 'start',
          behavior: 'auto'
        });
      } else {
        const dateIndexOf = datesArray.indexOf(
          dateStringToJumpTo
        );
        // haven't loaded this data yet, purge and jump
        if (dateIndexOf >= 0) {
          // valid index
          setItemsLoaded([]);
          // compensate for first index loaded because use state doesn't go fast enough
          // :grimacing:
          loadMoreItems(dateIndexOf - firstIndexLoaded);
          setFirstIndexLoaded(dateIndexOf);
        }
      }
    },
    [
      datesArray,
      itemsLoaded,
      loadMoreItems,
      virtuoso,
      firstIndexLoaded
    ]
  );
  return (
    <div
      style={{
        backgroundColor: theme.colors.gray50.value,
        flex: 1,
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Head>
        <title>{getTitleString('Scratchpad')}</title>
      </Head>
      <NonEditorHeader title='Scratchpad' />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <div
          style={{
            width: '90vw',
            backgroundColor: theme.colors.white.value,
            flex: 1,
            paddingLeft: 50,
            paddingRight: 50,
            paddingTop: 50
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'flex-end'
            }}
          >
            <Popover>
              <Popover.Trigger>
                <Button>Jump to date</Button>
              </Popover.Trigger>
              <Popover.Content>
                <DayPicker
                  mode='single'
                  selected={datepickerSelectedDay}
                  onSelect={(selectedDay) => {
                    jumpToDay(selectedDay);
                  }}
                  disabled={(date: Date) =>
                    !datesArray.includes(
                      date.toLocaleDateString('fr-CA')
                    )
                  }
                />
              </Popover.Content>
            </Popover>
          </div>
          <Virtuoso
            data={itemsLoaded}
            style={{ height: '90%' }}
            // TODO: reenable when you can get this working for sticky headers
            // groupCounts={new Array(itemsLoaded.length).fill(
            //   1
            // )}
            // groupContent={(index) => {
            //   return (
            //     <div
            //       style={{
            //         backgroundColor:
            //           theme.colors.white.value
            //       }}
            //     >
            //       <Text
            //         style={{
            //           fontSize:
            //             theme.fontSizes['2xl'].value,
            //           fontFamily: 'Cedarville Cursive',
            //           fontWeight: 'bold',
            //           color: theme.colors.blue500.value
            //         }}
            //       >
            //         {itemsLoaded[
            //           index
            //         ].date.toLocaleDateString('en-US', {
            //           timeZone: 'UTC'
            //         })}
            //       </Text>
            //     </div>
            //   );
            // }}
            itemContent={(index, scratchpadData) => {
              return (
                <ScratchpadPreview
                  scratchpadData={scratchpadData}
                  autoFocus={index === 0}
                  updateInitialContent={
                    updateInitialContent
                  }
                />
              );
            }}
            endReached={(index) => {
              loadMoreItems(index);
            }}
            ref={virtuoso}
            rangeChanged={(range) => {
              setDatepickerSelectedDay(
                dayjs
                  .tz(
                    datesArray[range.startIndex],
                    dayjs.tz.guess()
                  )
                  .toDate()
              );
            }}
          />
        </div>
      </div>
    </div>
  );
}
