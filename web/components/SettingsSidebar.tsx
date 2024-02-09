import { Link, useTheme } from '@nextui-org/react';
import {
  SETTINGS_PATH,
  SETTING_PAGES
} from '../pages/settings/[setting]';
import HoverDiv from './HoverDiv';

export default function SettingsSidebar() {
  const { theme } = useTheme();
  return (
    <div
      style={{
        margin: 20,
        padding: 10,
        borderRightWidth: 1,
        borderRightColor: theme.colors.gray500.value,
        borderRightStyle: 'solid'
      }}
    >
      <HoverDiv>
        <div style={{ padding: 10 }}>
          <Link
            style={{ color: 'black' }}
            href={`/${SETTINGS_PATH}/${SETTING_PAGES.USERNAME}`}
          >
            Username
          </Link>
        </div>
      </HoverDiv>
    </div>
  );
}
