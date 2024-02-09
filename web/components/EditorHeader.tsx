import { useReactiveVar } from '@apollo/client';
import { Loading, Text, useTheme } from '@nextui-org/react';
import {
  currentDocumentVar,
  currentDocumentVersionIDVar
} from '../cache/cache';
import LogoBackButton from './LogoBackButton';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faChevronDown } from '@fortawesome/free-solid-svg-icons/faChevronDown';
import VersionSelector from './VersionSelector';
import ShareModal from './ShareModal';
import ProfileMenu from './ProfileMenu';
import dynamic from 'next/dynamic';
import ResponsiveButton from './ResponsiveButton';
import PublishModal from './PublishModal';
import WritingSessionToggle from './WritingSessionToggle';

const TitleInput = dynamic(() => import('./TitleInput'), {
  ssr: false
});

export default function EditorHeader() {
  const currentDocumentID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const { theme } = useTheme();
  const currentDocument = useReactiveVar(
    currentDocumentVar
  );
  if (!currentDocument || !currentDocument.documentID) {
    return <Loading />;
  }
  return (
    <div
      style={{
        justifyContent: 'space-between',
        display: 'flex',
        flexDirection: 'row',
        paddingTop: theme.space.sm.value,
        paddingBottom: theme.space.sm.value,
        paddingLeft: theme.space['2xl'].value,
        paddingRight: theme.space['2xl'].value,
        backgroundColor: theme.colors.gray200.value,
        borderBottomStyle: 'solid',
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.gray600.value
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
        <div
          style={{
            paddingRight: theme.space.md.value,
            paddingLeft: theme.space.md.value,
            width: currentDocument?.title ? undefined : 250,
            height: currentDocument?.title ? undefined : 40,
            position: 'relative'
          }}
        >
          <TitleInput
            key={`title-${currentDocument.documentID}`}
          />
        </div>
        <div
          style={{
            marginRight: theme.space.xs.value
          }}
        >
          <Text
            style={{
              color: theme.colors.gray600.value,
              margin: 0,
              fontSize: theme.fontSizes.xl.value
            }}
          >
            ·
          </Text>
        </div>

        <VersionSelector>
          <>
            <Text
              style={{
                margin: 0,
                fontSize: theme.fontSizes.xl.value,
                fontWeight: 'bold',
                letterSpacing:
                  theme.letterSpacings.normal.value,
                color: theme.colors.gray600.value
              }}
            >
              {currentDocumentID.versionName ?? 'live'}
            </Text>
            <div style={{ marginLeft: 10 }}>
              <FontAwesomeIcon
                icon={faChevronDown}
                color={theme.colors.gray600.value}
              />
            </div>
          </>
        </VersionSelector>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center'
        }}
      >
        <WritingSessionToggle />
        <PublishModal />
        <div>
          <ShareModal />
        </div>
        <ProfileMenu />
      </div>
    </div>
  );
}
