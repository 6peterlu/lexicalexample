import { Button, Text, useTheme } from '@nextui-org/react';
import { useRouter } from 'next/router';
import Logo from '../public/Logo.svg';
import DailyChallengeButton from './DailyChallengeButton';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';
import ResponsiveButton from './ResponsiveButton';
import ResponsiveLogo from './ResponsiveLogo';

export default function NotLoggedInHeader() {
  const { theme } = useTheme();
  const router = useRouter();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  return (
    <div
      style={{
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'row',
        paddingLeft: isDesktop
          ? theme.space['2xl'].value
          : theme.space.md.value,
        paddingRight: isDesktop
          ? theme.space['2xl'].value
          : theme.space.md.value,
        paddingTop: theme.space.sm.value,
        paddingBottom: theme.space.sm.value,
        backgroundColor: theme.colors.white.value,
        borderBottomStyle: 'solid',
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.gray600.value,
        position: 'sticky',
        top: 0,
        zIndex: 10
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          cursor: 'pointer'
        }}
        onClick={() => router.push('/')}
      >
        <ResponsiveLogo />
        <Text
          style={{
            fontSize: isDesktop
              ? theme.fontSizes['2xl'].value
              : theme.fontSizes.md.value,
            marginLeft: theme.space.md.value,
            marginTop: -2,
            fontFamily: 'Cedarville Cursive'
          }}
        >
          draft zero
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
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <ResponsiveButton
            style={{
              fontSize: theme.fontSizes.sm.value,
              minWidth: 0,
              marginRight: theme.space.md.value,
              marginLeft: theme.space.md.value
            }}
            onClick={() =>
              router.push('/login?signup=true')
            }
          >
            Sign up
          </ResponsiveButton>
          <ResponsiveButton
            onClick={() => router.push('/login')}
            style={{
              fontSize: theme.fontSizes.sm.value,
              minWidth: 0
            }}
            ghost
          >
            Sign in
          </ResponsiveButton>
        </div>
      </div>
    </div>
  );
}
