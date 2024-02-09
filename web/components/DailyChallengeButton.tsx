import HoverDiv from './HoverDiv';
import Seal from '../public/Seal.svg';
import { useTheme } from '@nextui-org/react';
import { useRouter } from 'next/router';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';

export default function DailyChallengeButton() {
  const { theme } = useTheme();
  const router = useRouter();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  return (
    <div
      style={{
        height: isDesktop
          ? theme.space[14].value
          : theme.space[12].value,
        cursor: 'pointer'
      }}
      onClick={() => {
        router.push('/challenge/today');
      }}
    >
      <Seal />
    </div>
  );
}
