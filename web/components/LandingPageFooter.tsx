import { Text, useTheme } from '@nextui-org/react';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';

export default function LandingPageFooter() {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  if (isDesktop) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'space-between',
          paddingLeft: theme.space['2xl'].value,
          paddingRight: theme.space['2xl'].value,
          paddingTop: theme.space.md.value,
          paddingBottom: theme.space.md.value,
          marginTop: theme.space.md.value,
          borderTopStyle: 'solid',
          borderTopWidth: 1,
          borderTopColor: theme.colors.gray300.value,
          width: '100%'
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-start'
          }}
        >
          <Text size={theme.fontSizes.xs.value}>
            Contact us at support@draftzero.org
          </Text>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'flex-end'
          }}
        >
          <Text size={theme.fontSizes.xs.value}>
            Copyright © 2023 Draft Zero{' '}
          </Text>
        </div>
      </div>
    );
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        paddingLeft: theme.space['2xl'].value,
        paddingRight: isDesktop
          ? theme.space['2xl'].value
          : theme.space.md.value,
        paddingTop: theme.space.md.value,
        paddingBottom: theme.space.md.value,
        marginTop: isDesktop
          ? theme.space['2xl'].value
          : theme.space.md.value,
        borderTopStyle: 'solid',
        borderTopWidth: 1,
        borderTopColor: theme.colors.gray300.value,
        width: '100%'
      }}
    >
      <Text size={theme.fontSizes.xs.value}>
        Contact us at support@draftzero.org
      </Text>
      <Text size={theme.fontSizes.xs.value}>
        Copyright © 2023 Draft Zero{' '}
      </Text>
    </div>
  );
}
