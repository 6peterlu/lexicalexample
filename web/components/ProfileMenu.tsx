import {
  Avatar,
  Dropdown,
  Loading,
  useTheme
} from '@nextui-org/react';
import { motion } from 'framer-motion';
import { Key } from 'react';
import { useRouter } from 'next/router';
import {
  SETTINGS_PATH,
  SETTING_PAGES
} from '../pages/settings/[setting]';
import { useReactiveVar } from '@apollo/client';
import { userInfoVar } from '../cache/cache';
import { UserDB } from '../models/user';
import { signOut } from 'next-auth/react';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';
import { useUserInfo } from '../hooks/useUserInfo';
import ResponsiveButton from './ResponsiveButton';

function generateAvatarInitialsFromUser(user: UserDB) {
  let initials = user.firstName[0].toUpperCase();
  if (user.lastName) {
    initials += user.lastName[0].toUpperCase();
  }
  return initials;
}

export default function ProfileMenu() {
  const { user, loading } = useUserInfo();
  const router = useRouter();
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  if (loading) {
    return <Loading />;
  }
  if (!user) {
    return (
      <div
        style={{ display: 'flex', flexDirection: 'row' }}
      >
        <ResponsiveButton
          style={{
            fontSize: theme.fontSizes.sm.value,
            minWidth: 0,
            marginRight: theme.space.md.value,
            marginLeft: theme.space.md.value
          }}
          onClick={() => router.push('/login?signup=true')}
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
    );
  }
  return (
    <div style={{ marginLeft: theme.space.md.value }}>
      <Dropdown placement='bottom-left'>
        <Dropdown.Trigger>
          <Avatar
            style={{
              cursor: 'pointer',
              backgroundColor: theme.colors.gray600.value,
              color: theme.colors.white.value,
              height: isDesktop
                ? theme.space[14].value
                : theme.space[12].value,
              width: isDesktop
                ? theme.space[14].value
                : theme.space[12].value,
              minHeight: 0,
              minWidth: 0
            }}
            // don't know why i need both of these
            color={theme.colors.gray600.value as 'default'}
            textColor='white'
            text={generateAvatarInitialsFromUser(user)}
            bordered={true}
          />
        </Dropdown.Trigger>
        <Dropdown.Menu
          selectionMode='single'
          onSelectionChange={(keys: Set<Key>) => {
            const key = keys.values().next().value;
            if (
              key ===
              `profilemenu-${SETTING_PAGES.USERNAME}`
            ) {
              router.push(
                `/${SETTINGS_PATH}/${SETTING_PAGES.USERNAME}`
              );
            } else if (key === 'profilemenu-profile') {
              router.push(`/writer/${user.username}`);
            } else if (key === 'profilemenu-logout') {
              signOut({ callbackUrl: '/' });
            }
          }}
        >
          <Dropdown.Item key={`profilemenu-profile`}>
            My profile
          </Dropdown.Item>
          <Dropdown.Item
            key={`profilemenu-${SETTING_PAGES.USERNAME}`}
          >
            Settings
          </Dropdown.Item>
          <Dropdown.Item
            key={'profilemenu-logout'}
            color='error'
          >
            Logout
          </Dropdown.Item>
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
}
