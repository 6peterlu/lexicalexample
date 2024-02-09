import {
  Button,
  ButtonProps,
  useTheme
} from '@nextui-org/react';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';

export default function ResponsiveButton(
  props: ButtonProps
) {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  return (
    <Button
      style={{
        height: isDesktop
          ? `${theme.lineHeights['4xl'].value}rem`
          : `${theme.lineHeights['2xl'].value}rem`,
        minWidth: 0
      }}
      {...props}
    />
  );
}
