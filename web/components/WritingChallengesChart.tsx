import { gql, useQuery } from '@apollo/client';
import { Loading, Text, useTheme } from '@nextui-org/react';
import {
  ChartOptions,
  TimeScale,
  Chart as ChartJS,
  ChartEvent
} from 'chart.js';
import 'chartjs-adapter-date-fns';
import { addDays, format } from 'date-fns';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { useMemo } from 'react';
import { Bar } from 'react-chartjs-2';
import { DailyChallengeStatus } from '../utils/constants';
import { pluralSuffix } from '../utils/string';
import {
  getDaysBetween,
  getPacificTimezoneDateString,
  getStartOfDateLocalTime,
  toGraphQLString
} from '../utils/time';

ChartJS.register([TimeScale]);
// gql query to get daily challenge statuses
const GET_DAILY_CHALLENGE_STATUS = gql`
  query getTrackingPageData(
    $startDate: Date!
    $endDate: Date!
  ) {
    getTrackingPageData(
      args: { startDate: $startDate, endDate: $endDate }
    ) {
      dailyChallengeStatuses {
        date
        status
        completedOnTime
      }
      longestStreak
      currentStreak
    }
  }
`;
export const wordsChangedOptions: ChartOptions<'bar'> = {
  plugins: {
    title: {
      display: true,
      text: 'Chart.js Bar Chart - Stacked'
    },
    legend: {
      display: false
    }
  },
  responsive: true,
  scales: {
    x: {
      type: 'time',
      time: {
        unit: 'day',
        displayFormats: {
          day: 'MM/dd'
        }
      },
      ticks: {
        maxRotation: 0,
        source: 'auto'
      },
      grid: {
        display: false
      }
    },
    y: {
      display: false
    }
  },
  datasets: {
    bar: {
      barPercentage: 1.25
    }
  },
  maintainAspectRatio: false,
  animation: false
};

function StatBox({
  title,
  subtitle
}: {
  title: string;
  subtitle: string;
}) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        marginBottom: theme.space.md.value
      }}
    >
      <Text
        size='$2xl'
        weight='bold'
        style={{
          letterSpacing: theme.letterSpacings.normal.value
        }}
      >
        {title}
      </Text>
      <Text
        size='md'
        color={theme.colors.yellow500.value}
        style={{
          letterSpacing: theme.letterSpacings.normal.value
        }}
      >
        {subtitle}
      </Text>
    </div>
  );
}

export default function WritingChallengesChart({
  startDate,
  endDate
}: {
  startDate: Date;
  endDate: Date;
}) {
  const router = useRouter();
  const { theme } = useTheme();
  function getGradient(
    ctx: CanvasRenderingContext2D,
    chartArea: {
      bottom: number;
      left: number;
      right: number;
      top: number;
      width: number;
    }
  ) {
    const gradient = ctx.createLinearGradient(
      0,
      chartArea.bottom,
      0,
      chartArea.top
    );
    gradient.addColorStop(0, 'white');
    gradient.addColorStop(1, '#CBB352');

    return gradient;
  }
  // query to get daily challenge statuses
  const {
    data: dailyChallengeStatusesData,
    loading: dailyChallengeStatusesLoading,
    error: dailyChallengeStatusesError
  } = useQuery(GET_DAILY_CHALLENGE_STATUS, {
    variables: {
      startDate: toGraphQLString(startDate),
      endDate: toGraphQLString(endDate)
    },
    fetchPolicy: 'no-cache'
  });
  const statArray = useMemo(() => {
    if (
      dailyChallengeStatusesLoading ||
      dailyChallengeStatusesError
    ) {
      return null;
    }
    // generate array of objects with date and status ranging from startDate to endDate with 0 if no data
    const data = [];
    const labels = [];
    let currentDate = getStartOfDateLocalTime(
      new Date(startDate)
    );
    while (currentDate <= endDate) {
      const dateString = toGraphQLString(currentDate);
      const dailyChallengeStatus =
        dailyChallengeStatusesData.getTrackingPageData.dailyChallengeStatuses.find(
          (dailyChallengeStatus: any) =>
            dailyChallengeStatus.date === dateString
        );
      labels.push(new Date(currentDate));
      // labels.push(currentDate);
      data.push(dailyChallengeStatus?.status || 0);

      // increment by one day
      currentDate = addDays(currentDate, 1);
    }
    return {
      labels: labels,
      datasets: [
        {
          label: 'Time spent',
          data: data,
          backgroundColor: function (context: {
            chart: {
              ctx: CanvasRenderingContext2D;
              chartArea: any;
            };
          }) {
            const chart = context.chart;
            const { ctx, chartArea } = chart;

            if (!chartArea) {
              // This case happens on initial chart load
              return;
            }
            return getGradient(ctx, chartArea);
          }
        }
      ]
    };
  }, [
    dailyChallengeStatusesData,
    dailyChallengeStatusesLoading,
    dailyChallengeStatusesError,
    startDate,
    endDate
  ]);
  const longestStreak = useMemo(() => {
    if (!statArray) {
      return null;
    }
    return dailyChallengeStatusesData.getTrackingPageData
      .longestStreak;
  }, [statArray, dailyChallengeStatusesData]);

  const currentStreak = useMemo(() => {
    if (!statArray) {
      return null;
    }
    return dailyChallengeStatusesData.getTrackingPageData
      .currentStreak;
  }, [statArray, dailyChallengeStatusesData]);

  const completedCount = useMemo(() => {
    if (!statArray) {
      return null;
    }
    const completed = statArray.datasets[0].data.filter(
      (status: number) =>
        status === DailyChallengeStatus.COMPLETED
    ).length;
    return completed;
  }, [statArray]);

  const barClickHandler = function (e: ChartEvent) {
    const activePointLabel = this.getElementsAtEventForMode(
      e,
      'nearest',
      { intersect: true },
      true
    );
    if (activePointLabel.length > 0) {
      const dateToNavigateTo =
        statArray.labels[activePointLabel[0].index];
      router.push(
        `/challenge/${getPacificTimezoneDateString(
          dateToNavigateTo
        )}`
      );
    }
  };

  const tooltipTitleHandler = function (
    context: { dataIndex: number }[]
  ) {
    const label = statArray.labels[context[0].dataIndex];
    return `Click to jump to the daily challenge for ${dayjs(
      label
    ).format('M/D')}`;
  };

  const tooltipHoverHandler = function (e: ChartEvent) {
    if (!(e.native.target instanceof HTMLCanvasElement)) {
      // typesafety, should never happen
      return;
    }
    const activePointLabel = this.getElementsAtEventForMode(
      e,
      'nearest',
      { intersect: true },
      true
    );
    if (activePointLabel.length > 0) {
      e.native.target.style.cursor = 'pointer';
    } else {
      e.native.target.style.cursor = 'default';
    }
  };

  const tooltipLabelHandler = function (context: {
    dataIndex: number;
  }) {
    const data: number =
      statArray.datasets[0].data[context.dataIndex];
    if (data === DailyChallengeStatus.COMPLETED) {
      return 'Completed';
    } else if (data === DailyChallengeStatus.IN_PROGRESS) {
      return 'Started';
    } else {
      return 'Not started';
    }
  };

  if (!statArray) {
    return <Loading />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        marginTop: theme.space.xl.value
      }}
    >
      <div>
        <div
          style={{
            marginTop: theme.space.lg.value
          }}
        >
          <Text
            size='$4xl'
            color={theme.colors.yellow500.value}
            weight='bold'
            style={{
              letterSpacing:
                theme.letterSpacings.normal.value
            }}
          >
            Writing challenges
          </Text>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            width: 800,
            height: 300,
            borderWidth: 2,
            borderStyle: 'solid',
            borderColor: theme.colors.yellow500.value,
            borderRadius: theme.radii.md.value
          }}
        >
          <div
            style={{
              flex: 2,
              paddingRight: theme.space.lg.value,
              paddingLeft: theme.space.lg.value,
              paddingBottom: theme.space.lg.value,
              paddingTop: theme.space.lg.value
            }}
          >
            <Bar
              options={{
                ...wordsChangedOptions,
                onClick: barClickHandler,
                onHover: tooltipHoverHandler,
                plugins: {
                  ...wordsChangedOptions.plugins,
                  tooltip: {
                    callbacks: {
                      title: tooltipTitleHandler,
                      label: tooltipLabelHandler
                    }
                  }
                }
              }}
              data={statArray}
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
                      theme.colors.white.value;
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
              justifyContent: 'center',
              borderLeftWidth: 2,
              borderLeftStyle: 'solid',
              borderLeftColor: theme.colors.yellow500.value
            }}
          >
            <div>
              <StatBox
                title={`${
                  completedCount ?? 0
                }/${getDaysBetween(startDate, endDate)}`}
                subtitle='challenges completed'
              />
              <StatBox
                title={`${
                  currentStreak ?? 0
                } day${pluralSuffix(currentStreak ?? 0)}`}
                subtitle={`current streak`}
              />
              <StatBox
                title={`${
                  longestStreak ?? 0
                } day${pluralSuffix(longestStreak ?? 0)}`}
                subtitle='longest streak'
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
