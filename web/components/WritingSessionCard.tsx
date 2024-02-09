import { Line } from 'react-chartjs-2';
import { WritingSession } from '../generated/types/graphql';
import {
  ChartOptions,
  LineElement,
  Chart as ChartJS,
  Filler,
  ChartData,
  CategoryScale,
  LinearScale,
  PointElement
} from 'chart.js';
import { useMemo, useState } from 'react';
import {
  Button,
  Input,
  NextUIThemeContext,
  Text,
  useTheme
} from '@nextui-org/react';
import tinygradient from 'tinygradient';
import { secondsToHoursMinutes } from '../utils/time';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';
import ResponsiveButton from './ResponsiveButton';
import { gql, useMutation } from '@apollo/client';

const SEGMENTS_PER_ROW = 10;
const CHART_HEIGHT = 250;
const LAYER_OVERLAP = 70;
const BOTTOM_BUFFER = 100;
const COLOR_GRADIENT_END_BUFFER = 0;
const COLOR_GRADIENT_START_BUFFER = 2;

const UPDATE_WRITING_SESSION = gql`
  mutation updateCompleteWritingSession(
    $title: String!
    $writingSessionID: String!
  ) {
    updateCompleteWritingSession(
      request: {
        title: $title
        writingSessionID: $writingSessionID
      }
    )
  }
`;

ChartJS.register(
  LinearScale,
  CategoryScale,
  Filler,
  LineElement,
  PointElement
);

const lineChartOptions: ChartOptions<'line'> = {
  plugins: {
    title: {
      display: true,
      text: 'Chart.js Bar Chart - Stacked'
    },
    tooltip: {
      callbacks: {
        title: (tooltipItems) => {
          return `${tooltipItems[0].label} words`;
        },
        label: () => {
          return null;
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
      display: false,
      beginAtZero: true
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
  animation: false,
  elements: {
    line: {
      cubicInterpolationMode: 'monotone'
    }
  }
};

function getGradient(
  ctx: CanvasRenderingContext2D,
  chartArea: {
    bottom: number;
    left: number;
    right: number;
    top: number;
    width: number;
  },
  colorBottom: string,
  colorTop: string
) {
  const gradient = ctx.createLinearGradient(
    0,
    chartArea.bottom,
    0,
    chartArea.top
  );
  gradient.addColorStop(0, colorBottom);
  gradient.addColorStop(0.5, colorTop);
  gradient.addColorStop(1, colorTop);

  return gradient;
}

function processSegment(
  segment: number[],
  idx: number,
  totalIndices: number
) {
  const effectiveChartHeight = CHART_HEIGHT - BOTTOM_BUFFER;
  const scaleFactor =
    (effectiveChartHeight / totalIndices + LAYER_OVERLAP) /
    CHART_HEIGHT;
  const translateFactor =
    (totalIndices - idx - 1) *
      (effectiveChartHeight / totalIndices +
        LAYER_OVERLAP / 2) +
    BOTTOM_BUFFER;
  return segment.map(
    (val) => val * scaleFactor + translateFactor
  );
}

function segmentData(
  rawSegmentData: number[],
  { theme }: Pick<NextUIThemeContext, 'theme'>
): ChartData<'line'> {
  const data: ChartData<'line'> = {
    datasets: []
  };
  const numRows = Math.ceil(
    rawSegmentData.length / SEGMENTS_PER_ROW
  );
  const colorBases = tinygradient([
    theme.colors.red300.value,
    theme.colors.blue600.value
  ]).rgb(
    numRows +
      COLOR_GRADIENT_START_BUFFER +
      COLOR_GRADIENT_END_BUFFER
  );
  for (
    let i = 0;
    i < rawSegmentData.length;
    i += SEGMENTS_PER_ROW
  ) {
    const segment = rawSegmentData.slice(
      i,
      i + SEGMENTS_PER_ROW
    );
    const curRow = i / SEGMENTS_PER_ROW;
    data.datasets.push({
      data: processSegment(segment, curRow, numRows),
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
        const localGradient = tinygradient([
          'white',
          colorBases[
            curRow + COLOR_GRADIENT_START_BUFFER
          ].toRgbString()
        ]).rgb(3);
        return getGradient(
          ctx,
          chartArea,
          localGradient[1].toRgbString(),
          colorBases[
            curRow + COLOR_GRADIENT_START_BUFFER
          ].toRgbString()
        );
      },
      fill: 'start',
      borderWidth: 0,
      pointRadius: 0
    });
  }
  data.datasets.reverse();
  data.labels = [...Array(SEGMENTS_PER_ROW)].map(
    (_, idx) => (idx + 1) * 20
  );
  return data;
}

export default function WritingSessionCard({
  writingSession,
  isSelf
}: {
  writingSession: WritingSession;
  isSelf: boolean;
}) {
  const { theme } = useTheme();

  const [editing, setEditing] = useState(false);
  const [displayedTitle, setDisplayedTitle] = useState(
    writingSession.title
  );
  const [updatedTitle, setUpdatedTitle] = useState(
    writingSession.title
  );
  const [updateWritingSession] = useMutation(
    UPDATE_WRITING_SESSION,
    {
      variables: {
        title: updatedTitle,
        writingSessionID: writingSession.writingSessionID
      }
    }
  );
  const timeSpentData = useMemo(
    () =>
      segmentData(writingSession.segmentTime, { theme }),
    [writingSession.segmentTime, theme]
  );
  const writingTime = secondsToHoursMinutes(
    writingSession.timeSpentSeconds
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between'
          }}
        >
          {editing ? (
            <Input
              value={updatedTitle}
              onChange={(e) => {
                setUpdatedTitle(e.target.value);
              }}
            />
          ) : (
            <Text
              size='$lg'
              color={theme.colors.gray600.value}
              weight='bold'
              style={{
                letterSpacing:
                  theme.letterSpacings.normal.value
              }}
            >
              {displayedTitle}
            </Text>
          )}
          {isSelf && (
            <ResponsiveButton
              light
              onClick={async () => {
                if (editing) {
                  await updateWritingSession({
                    variables: {
                      writingSessionID:
                        writingSession.writingSessionID,
                      title: updatedTitle
                    }
                  });
                  setDisplayedTitle(updatedTitle);
                  setUpdatedTitle('');
                }
                setEditing(!editing);
              }}
            >
              {editing ? 'Save' : 'Edit'}
            </ResponsiveButton>
          )}
        </div>
        {writingSession.username && (
          <Text
            style={{
              letterSpacing:
                theme.letterSpacings.normal.value,
              color: theme.colors.blue600.value,
              fontSize: theme.fontSizes.sm.value,
              fontWeight: 'bold'
            }}
          >
            {writingSession.username}
          </Text>
        )}
        <div
          style={{ display: 'flex', flexDirection: 'row' }}
        >
          <div
            style={{
              marginRight: theme.space.xl.value,
              minWidth: 150
            }}
          >
            <div
              style={{ marginTop: theme.space.lg.value }}
            >
              <Text
                size='$sm'
                weight='bold'
                style={{
                  letterSpacing:
                    theme.letterSpacings.normal.value
                }}
              >
                Session length
              </Text>
              <Text size='$sm'>
                {writingTime.hours}h, {writingTime.minutes}m
              </Text>
            </div>
            <div
              style={{ marginTop: theme.space.md.value }}
            >
              <Text
                size='$sm'
                weight='bold'
                style={{
                  letterSpacing:
                    theme.letterSpacings.normal.value
                }}
              >
                Words changed
              </Text>
              <Text size='$sm'>
                {writingSession.wordsChanged}
              </Text>
            </div>
            <div
              style={{ marginTop: theme.space.md.value }}
            >
              <Text
                size='$sm'
                weight='bold'
                style={{
                  letterSpacing:
                    theme.letterSpacings.normal.value
                }}
              >
                Flow
              </Text>
              <Text size='$sm'>
                {writingSession.flow ?? '--'} / 100
              </Text>
            </div>
          </div>
          <div style={{ width: '100%' }}>
            <div
              style={{
                width: '100%',
                height: CHART_HEIGHT,
                position: 'relative'
              }}
            >
              <Line
                data={timeSpentData}
                options={lineChartOptions}
              />
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  position: 'absolute',
                  top: 90,
                  left: -140,
                  letterSpacing:
                    theme.letterSpacings.normal.value,
                  transform: 'rotate(270deg)',
                  justifyContent: 'space-between',
                  width: CHART_HEIGHT,
                  padding: theme.space.sm.value,
                  paddingRight: theme.space.xl.value
                }}
              >
                <Text
                  color={theme.colors.blue600.value}
                  style={{
                    letterSpacing:
                      theme.letterSpacings.normal.value
                  }}
                  size='$sm'
                >
                  Easier
                </Text>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flex: 1,
                    marginRight: theme.space.sm.value,
                    marginLeft: theme.space.sm.value,
                    alignItems: 'center'
                  }}
                >
                  <div
                    style={{
                      alignItems: 'center',
                      borderBottomStyle: 'solid',
                      borderBottomWidth: 2,
                      borderImage: `linear-gradient(to right, ${theme.colors.blue600.value}, ${theme.colors.red300.value}) 1`,
                      flex: 1,
                      marginRight: -8
                    }}
                  />
                  <FontAwesomeIcon
                    icon={faChevronRight}
                    color={theme.colors.red300.value}
                  />
                </div>
                <Text
                  color={theme.colors.red500.value}
                  style={{
                    letterSpacing:
                      theme.letterSpacings.normal.value
                  }}
                  size='$sm'
                >
                  Harder
                </Text>
              </div>
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'row',
                  alignItems: 'center'
                }}
              >
                <div
                  style={{
                    borderBottomWidth: 2,
                    borderBottomStyle: 'solid',
                    borderBottomColor:
                      theme.colors.gray500.value,
                    flex: 1,
                    marginRight: theme.space.md.value,
                    marginLeft: theme.space.lg.value
                  }}
                />
                <Text color={theme.colors.gray600.value}>
                  200 words per layer
                </Text>
                <div
                  style={{
                    borderBottomWidth: 2,
                    borderBottomStyle: 'solid',
                    borderBottomColor:
                      theme.colors.gray500.value,
                    flex: 2,
                    marginRight: -8,
                    marginLeft: theme.space.md.value
                  }}
                />
                <FontAwesomeIcon
                  icon={faChevronRight}
                  color={theme.colors.gray500.value}
                  style={{
                    marginRight: theme.space.lg.value
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
