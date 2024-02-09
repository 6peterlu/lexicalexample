import { useTheme } from '@nextui-org/react';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';
import Logo from '../public/Logo.svg';

export default function ResponsiveLogo() {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  return (
    <div
      style={{
        height: isDesktop
          ? theme.space[14].value
          : theme.space[12].value
      }}
    >
      <Logo />
    </div>
  );
}
