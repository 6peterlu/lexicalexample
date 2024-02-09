import { Grid, Text, useTheme } from '@nextui-org/react';
import { useRouter } from 'next/router';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';

export default function UpdatesPageLink() {
  const router = useRouter();
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        cursor: 'pointer',
        marginBottom: theme.space.xs.value
      }}
      onClick={() => {
        router.push('/updates');
      }}
      tabIndex={0}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1
        }}
      >
        <Text
          color={theme.colors.yellow600.value}
          weight='bold'
          style={{
            letterSpacing:
              theme.letterSpacings.normal.value,
            userSelect: 'none'
          }}
          size={isDesktop ? 'medium' : 'small'}
        >
          {`What's new`}
        </Text>
        <div
          style={{
            flex: 1,
            borderBottomColor: theme.colors.yellow600.value,
            borderBottomStyle: 'dotted',
            borderBottomWidth: isDesktop ? 4 : 2,
            marginBottom:
              ((parseFloat(theme.lineHeights.lg.value) -
                parseFloat(theme.fontSizes.md.value[0])) *
                // * 16 to convert from rem to px
                16) /
              // / 2 because space is present on the top and bottom of the line
              2,
            marginLeft: 8,
            marginRight: 8
          }}
        />
        <Text
          color={theme.colors.yellow600.value}
          weight='bold'
          style={{
            letterSpacing:
              theme.letterSpacings.normal.value,
            userSelect: 'none'
          }}
          size={isDesktop ? 'medium' : 'small'}
        >
          Last updated: 4/18/2023
        </Text>
      </div>
    </div>
  );
}
