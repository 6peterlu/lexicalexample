import dynamic from 'next/dynamic';
import {
  Button,
  Popover,
  Text,
  useTheme
} from '@nextui-org/react';
import LogoBackButton from '../components/LogoBackButton';
import ProfileMenu from '../components/ProfileMenu';
import { useUserInfo } from '../hooks/useUserInfo';
import { useState } from 'react';
import { getDateNDaysAgo } from '../utils/time';
import { DayPicker } from 'react-day-picker';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faCalendar } from '@fortawesome/free-regular-svg-icons/faCalendar';
import { gql } from '@apollo/client';
import WritingChallengesChart from './WritingChallengesChart';

const IcebergChart = dynamic(
  () => import('../components/editor/IcebergChart'),
  { ssr: false }
);

export default function StatsPage() {
  const { theme } = useTheme();
  const { user } = useUserInfo();
  const [startDate, setStartDate] = useState<Date>(
    getDateNDaysAgo(7)
  );
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [startDateSelectorOpen, setStartDateSelectorOpen] =
    useState<boolean>(false);
  const [endDateSelectorOpen, setEndDateSelectorOpen] =
    useState<boolean>(false);
  return (
    <div>
      <div
        style={{
          justifyContent: 'space-between',
          display: 'flex',
          flexDirection: 'row',
          paddingLeft: theme.space['2xl'].value,
          paddingRight: theme.space['2xl'].value,
          paddingTop: theme.space.sm.value,
          paddingBottom: theme.space.sm.value,
          backgroundColor: theme.colors.gray200.value,
          borderBottomStyle: 'solid',
          borderBottomColor: theme.colors.gray600.value,
          borderBottomWidth: 0.5
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <LogoBackButton />
          <Text
            style={{
              fontSize: theme.fontSizes.xl.value,
              fontWeight: 'bold',
              marginLeft: theme.space.md.value,
              letterSpacing:
                theme.letterSpacings.normal.value
            }}
          >
            Tracking
          </Text>
          <div
            style={{
              marginLeft: theme.space.md.value,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center'
            }}
          >
            <Popover
              isOpen={startDateSelectorOpen}
              onClose={() => {
                setStartDateSelectorOpen(false);
              }}
            >
              <Popover.Trigger>
                <Button
                  // NOTE: decomposing to a separate component breaks popover
                  onClick={() => {
                    setStartDateSelectorOpen(
                      !startDateSelectorOpen
                    );
                  }}
                  style={{
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    color: theme.colors.gray600.value,
                    borderColor: theme.colors.gray600.value
                  }}
                  bordered
                  borderWeight='light'
                  ripple={false}
                  iconLeftCss={{
                    position: 'relative',
                    left: 0,
                    top: 0,
                    transform: 'none',
                    marginRight: theme.space.xs.value
                  }}
                  icon={
                    <FontAwesomeIcon icon={faCalendar} />
                  }
                >
                  {startDate.toLocaleDateString()}
                </Button>
              </Popover.Trigger>
              <Popover.Content>
                <DayPicker
                  mode='single'
                  selected={startDate}
                  onSelect={(selectedDay) => {
                    setStartDate(selectedDay);
                    setStartDateSelectorOpen(false);
                  }}
                  disabled={(date: Date) => date > endDate}
                  // disabled={(date: Date) =>
                  //   !datesArray.includes(
                  //     date.toLocaleDateString('fr-CA')
                  //   )
                  // }
                />
              </Popover.Content>
            </Popover>
            <div
              style={{
                paddingRight: theme.space.sm.value,
                paddingLeft: theme.space.sm.value
              }}
            >
              <Text>to</Text>
            </div>
            <Popover
              isOpen={endDateSelectorOpen}
              onClose={() => {
                setEndDateSelectorOpen(false);
              }}
            >
              <Popover.Trigger>
                <Button
                  onClick={() => {
                    setEndDateSelectorOpen(
                      !endDateSelectorOpen
                    );
                  }}
                  style={{
                    minWidth: 0,
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'center',
                    color: theme.colors.gray600.value,
                    borderColor: theme.colors.gray600.value
                  }}
                  bordered
                  borderWeight='light'
                  ripple={false}
                  iconLeftCss={{
                    position: 'relative',
                    left: 0,
                    top: 0,
                    transform: 'none',
                    marginRight: theme.space.xs.value
                  }}
                  icon={
                    <FontAwesomeIcon icon={faCalendar} />
                  }
                >
                  {endDate.toLocaleDateString()}
                </Button>
              </Popover.Trigger>
              <Popover.Content>
                <DayPicker
                  mode='single'
                  selected={endDate}
                  onSelect={(selectedDay) => {
                    setEndDate(selectedDay);
                    setEndDateSelectorOpen(false);
                  }}
                  disabled={(date: Date) =>
                    date < startDate || date > new Date()
                  }
                />
              </Popover.Content>
            </Popover>
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <ProfileMenu />
        </div>
      </div>
      <div
        style={{
          marginBottom: theme.space['2xl'].value,
          display: 'flex',
          alignItems: 'center',
          flexDirection: 'column',
          width: '100%'
        }}
      >
        <div>
          <Text
            size='$4xl'
            color={theme.colors.blue600.value}
            weight='bold'
            style={{
              letterSpacing:
                theme.letterSpacings.normal.value
            }}
          >
            Activity iceberg
          </Text>
          <Text
            size='$2xl'
            weight='bold'
            color={theme.colors.gray600.value}
            style={{ marginBottom: theme.space.md.value }}
          >
            Overview
          </Text>
          <IcebergChart
            startDate={startDate}
            endDate={endDate}
            width={800}
            height={200}
          />
        </div>

        <WritingChallengesChart
          startDate={startDate}
          endDate={endDate}
        />
      </div>
    </div>
  );
}
