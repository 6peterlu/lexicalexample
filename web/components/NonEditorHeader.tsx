import { Text, useTheme } from '@nextui-org/react';
import useMediaQuery from '../hooks/useMediaQuery';
import { useUserInfo } from '../hooks/useUserInfo';
import { convertPxStringToNumber } from '../utils/string';
import LogoBackButton from './LogoBackButton';
import ProfileMenu from './ProfileMenu';
export default function NonEditorHeader({
  title
}: {
  title: string;
}) {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  useUserInfo();
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
            fontSize: isDesktop
              ? theme.fontSizes.xl.value
              : theme.fontSizes.md.value,
            marginLeft: theme.space.md.value,
            fontWeight: 'bold',
            letterSpacing: theme.letterSpacings.normal.value
          }}
        >
          {title}
        </Text>
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
  );
}
