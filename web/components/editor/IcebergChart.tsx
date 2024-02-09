import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  ArcElement,
  BarElement,
  PointElement,
  Tooltip,
  Legend,
  ChartOptions
} from 'chart.js';
import { useMemo, useState } from 'react';
import { Bar } from 'react-chartjs-2';
import { DailyStatUnit } from '../../models/dailyStatUnit';
import {
  getDateNDaysAgo,
  getDateRange,
  secondsToHoursMinutes
} from '../../utils/time';
import {
  useTheme,
  Text,
  Popover,
  Button
} from '@nextui-org/react';
import { DayPicker } from 'react-day-picker';
import { gql, useLazyQuery } from '@apollo/client';
import { useEffect } from 'react';

import { Stat as gql_DailyStatUnit } from '../../generated/types/graphql';
import { useRouter } from 'next/router';
import useMediaQuery from '../../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../../utils/string';

export const wordsChangedOptions: ChartOptions<'bar'> = {
  plugins: {
    title: {
      display: true,
      text: 'Chart.js Bar Chart - Stacked'
    },
    tooltip: {
      callbacks: {
        label: function ({ raw, dataset }) {
          const typedData = raw as number;
          if (dataset.label === 'Time spent') {
            return `Time spent: ${-1 * typedData} seconds`;
          } else {
            return `Words changed: ${typedData} words`;
          }
        }
      }
    },
    legend: {
      display: false
    }
  },
  responsive: true,
  scales: {
    x: {
      display: false
    },
    y: {
      display: false
    }
  },
  datasets: {
    bar: {
      barPercentage: 1.24
    }
  },
  layout: {
    padding: {
      bottom: -20
    }
  },
  maintainAspectRatio: false,
  animation: false
};

export const timeSpentOptions: ChartOptions<'bar'> = {
  plugins: {
    title: {
      display: true,
      text: 'Chart.js Bar Chart - Stacked'
    },
    tooltip: {
      callbacks: {
        label: function ({ raw, dataset }) {
          const typedData = raw as number;
          if (dataset.label === 'Time spent') {
            return `Time spent: ${-1 * typedData} seconds`;
          } else {
            return `Words changed: ${typedData} words`;
          }
        }
      }
    },
    legend: {
      display: false
    }
  },
  responsive: true,
  scales: {
    x: {
      display: false
    },
    xAxis: {
      display: false
    },
    y: {
      display: false
    }
  },
  datasets: {
    bar: {
      barPercentage: 1.24
    }
  },
  maintainAspectRatio: false,
  animation: false
};

ChartJS.register(
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  PointElement,
  LinearScale,
  BarElement
);

const GET_STAT_SEGMENT = gql`
  query getStatSegment(
    $startDate: Date!
    $endDate: Date!
    $username: String
  ) {
    getStatSegment(
      args: {
        startDate: $startDate
        endDate: $endDate
        username: $username
      }
    ) {
      stats {
        date
        wordsChanged
        timeSpentSeconds
      }
    }
  }
`;

export default function IcebergChart({
  startDate,
  endDate,
  height,
  width
}: {
  startDate: Date;
  endDate: Date;
  height: number | string;
  width: number | string;
}) {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const router = useRouter();
  const { username } = router.query;
  const dateRange = useMemo(
    () => getDateRange(startDate, endDate),
    [startDate, endDate]
  );
  const [requestStats, { data: statSegmentData }] =
    useLazyQuery(GET_STAT_SEGMENT, {
      fetchPolicy: 'no-cache',
      variables: {
        startDate: startDate.toLocaleDateString('fr-CA'),
        endDate: endDate.toLocaleDateString('fr-CA'),
        username
      }
    });
  // load the data
  useEffect(() => {
    requestStats({
      variables: {
        startDate: startDate.toLocaleDateString('fr-CA'),
        endDate: endDate.toLocaleDateString('fr-CA'),
        username
      },
      fetchPolicy: 'no-cache'
    });
  }, [startDate, endDate, username, requestStats]);
  const statMap = useMemo(() => {
    if (!statSegmentData) return {};
    const parsedStatData =
      statSegmentData?.getStatSegment?.stats?.map(
        (s: gql_DailyStatUnit) =>
          DailyStatUnit.fromGraphQL(s)
      );
    const result = parsedStatData.reduce(
      (
        map: { [key: string]: DailyStatUnit },
        obj: DailyStatUnit
      ) => (
        (map[obj.date.toLocaleDateString()] = obj), map
      ),
      {}
    );
    return result;
  }, [statSegmentData]);
  const totalWordsChanged = useMemo(
    () =>
      Object.values(statMap).reduce(
        (acc: number, stat: DailyStatUnit) =>
          acc + stat.wordsChanged,
        0
        // not sure why this type coercion is needed
      ) as number,
    [statMap]
  );
  const totalTimeSpentSeconds = useMemo(
    () =>
      Object.values(statMap).reduce(
        (acc: number, stat: DailyStatUnit) =>
          acc + stat.timeSpentSeconds,
        0
      ) as number,
    [statMap]
  );
  const wordsChangedData = useMemo(
    () => ({
      labels: dateRange.map((d) => d.toLocaleDateString()),
      datasets: [
        {
          label: 'Words changed',
          data: dateRange.map(
            (d) =>
              statMap[d.toLocaleDateString()]
                ?.wordsChanged ?? 0
          ),
          backgroundColor: theme.colors.white.value
        }
      ]
    }),
    [dateRange, statMap, theme.colors.white.value]
  );
  const timeSpentData = useMemo(
    () => ({
      labels: dateRange.map((d) => d.toLocaleDateString()),
      datasets: [
        {
          label: 'Time spent',
          data: dateRange.map((d) =>
            statMap[d.toLocaleDateString()]
              ?.timeSpentSeconds
              ? statMap[d.toLocaleDateString()]
                  ?.timeSpentSeconds * -1
              : 0
          ),
          backgroundColor: theme.colors.blue500.value,
          borderWidth: -10
        }
      ]
    }),
    [dateRange, statMap, theme.colors.blue500.value]
  );

  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          paddingTop: theme.space.lg.value
        }}
      >
        <div style={{ width: '100%' }}>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: theme.colors.blue100.value,
              borderTopLeftRadius: theme.radii.md.value,
              borderTopRightRadius: theme.radii.md.value,
              width: '100%'
            }}
          >
            <div
              style={{
                marginBottom: 0,
                paddingBottom: -20,
                paddingTop: theme.space.lg.value,
                borderTopLeftRadius: theme.radii.sm.value,
                paddingRight: theme.space.lg.value,
                paddingLeft: theme.space.lg.value,
                backgroundColor: theme.colors.blue100.value,
                flex: 2,
                width,
                height,
                position: 'relative'
              }}
            >
              <Bar
                options={
                  {
                    ...wordsChangedOptions,
                    plugins: {
                      ...wordsChangedOptions.plugins,
                      customCanvasBackgroundColor: {
                        color: theme.colors.blue100.value
                      }
                    }
                  } as ChartOptions<'bar'>
                }
                data={wordsChangedData}
                plugins={[
                  {
                    id: 'customCanvasBackgroundColor',
                    beforeDraw: (chart, args, options) => {
                      const { ctx } = chart;
                      ctx.save();
                      ctx.globalCompositeOperation =
                        'destination-over';
                      ctx.fillStyle =
                        options.color ||
                        theme.colors.blue100.value;
                      ctx.fillRect(
                        0,
                        0,
                        chart.width,
                        chart.height
                      );
                      ctx.restore();
                    }
                  }
                ]}
              />
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  ...{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  },
                  ...(isDesktop && {
                    paddingRight: theme.space.sm.value,
                    paddingLeft: theme.space.sm.value
                  })
                }}
              >
                <Text
                  size={isDesktop ? '$2xl' : '$md'}
                  weight='bold'
                  style={{
                    letterSpacing:
                      theme.letterSpacings.normal.value
                  }}
                >
                  {totalWordsChanged}
                </Text>
                <Text
                  size={isDesktop ? '$md' : 'small'}
                  color={theme.colors.blue600.value}
                  style={{
                    letterSpacing:
                      theme.letterSpacings.normal.value,
                    lineHeight: theme.lineHeights.md.value
                  }}
                >
                  words changed
                </Text>
              </div>
            </div>
          </div>
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              borderWidth: 2,
              borderStyle: 'solid',
              borderColor: theme.colors.blue600.value,
              borderBottomLeftRadius: theme.radii.md.value,
              borderBottomRightRadius: theme.radii.md.value
            }}
          >
            <div
              style={{
                paddingRight: theme.space.lg.value,
                paddingLeft: theme.space.lg.value,
                paddingBottom: theme.space.lg.value,
                borderBottomLeftRadius:
                  theme.radii.sm.value,
                backgroundColor: theme.colors.blue600.value,
                flex: 2,
                position: 'relative',
                width,
                height
              }}
            >
              <Bar
                options={
                  {
                    ...timeSpentOptions,
                    plugins: {
                      ...timeSpentOptions.plugins,
                      customCanvasBackgroundColor: {
                        color: theme.colors.blue600.value
                      }
                    }
                  } as ChartOptions<'bar'>
                }
                data={timeSpentData}
                plugins={[
                  {
                    id: 'customCanvasBackgroundColor',
                    beforeDraw: (chart, args, options) => {
                      const { ctx } = chart;
                      ctx.save();
                      ctx.globalCompositeOperation =
                        'destination-over';
                      ctx.fillStyle =
                        options.color ||
                        theme.colors.blue100.value;
                      ctx.fillRect(
                        0,
                        0,
                        chart.width,
                        chart.height
                      );
                      ctx.restore();
                    }
                  }
                ]}
              />
            </div>
            <div
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center'
              }}
            >
              <div
                style={{
                  ...{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    textAlign: 'center'
                  },
                  ...(isDesktop && {
                    paddingRight: theme.space.sm.value,
                    paddingLeft: theme.space.sm.value
                  })
                }}
              >
                <Text
                  size={isDesktop ? '$md' : 'small'}
                  color={theme.colors.blue600.value}
                  style={{
                    letterSpacing:
                      theme.letterSpacings.normal.value,
                    lineHeight: theme.lineHeights.md.value
                  }}
                >
                  writing time
                </Text>
                <Text
                  size={isDesktop ? '$2xl' : '$md'}
                  weight='bold'
                  style={{
                    letterSpacing:
                      theme.letterSpacings.normal.value
                  }}
                >
                  {
                    secondsToHoursMinutes(
                      totalTimeSpentSeconds
                    ).hours
                  }
                  h{' '}
                  {
                    secondsToHoursMinutes(
                      totalTimeSpentSeconds
                    ).minutes
                  }
                  m
                </Text>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
