import NotLoggedInHeader from './NotLoggedInHeader';
import { Text, useTheme } from '@nextui-org/react';
import { faReply } from '@fortawesome/free-solid-svg-icons/faReply';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import LandingPageFooter from './LandingPageFooter';
import Head from 'next/head';
import EnhancedDocumentNoteLexicalComposer from './lexicalComposers/EnhancedDocumentNoteLexicalComposer';
import SectionSeparator from './SectionSeparator';
import { IDEAS_PANE_DIV_ID } from '../pages/document/[enhancedDocumentID]';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';

export default function LandingPage() {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  return (
    <div
      style={{
        height: '100vh',
        display: 'flex',
        flexDirection: 'column'
      }}
    >
      <Head>
        <title>Draft Zero</title>
      </Head>
      <NotLoggedInHeader />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          flex: 1
        }}
      >
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: theme.space['2xl'].value,
            maxWidth: 600
          }}
        >
          <Text
            style={{
              fontFamily: 'Alata',
              letterSpacing: 'normal',
              fontSize: isDesktop
                ? theme.fontSizes['6xl'].value
                : theme.fontSizes['3xl'].value,
              textAlign: 'center',
              lineHeight: theme.lineHeights.sm.value
            }}
          >
            a notepad that{' '}
            <span
              style={{
                color: theme.colors.yellow600.value
              }}
            >
              thinks with you
            </span>
          </Text>
        </div>
        <div
          style={{
            flex: 1,
            width: '100%',
            maxWidth: 600,
            display: 'flex',
            flexDirection: 'column',
            height: '100%'
          }}
        >
          <div
            style={{
              display: 'flex',
              justifyContent: 'flex-end',
              alignItems: 'flex-end',
              marginRight: isDesktop
                ? 0
                : theme.space.xs.value
            }}
          >
            <Text>try me</Text>
            <FontAwesomeIcon
              icon={faReply}
              style={{
                transform: 'rotate(90deg) scaleX(-1)',
                marginBottom: 2,
                marginLeft: theme.space.xs.value
              }}
            />
          </div>
          <div
            style={{
              padding: theme.space.lg.value,
              borderStyle: 'dashed',
              borderWidth: 1,
              borderColor: theme.colors.gray300.value,
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              maxHeight: `calc(100vh - ${
                isDesktop ? 430 : 300
              }px)`
            }}
          >
            <SectionSeparator sectionTitle='notes' />
            <div
              style={{
                flex: 1,
                overflowY: 'auto',
                height: '100%'
              }}
            >
              {/* <EnhancedDocumentNoteLexicalComposer
                hoveringOverNotePanel={true}
              /> */}
            </div>
            <div
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                overflowY: 'auto'
              }}
              id={IDEAS_PANE_DIV_ID}
            />
          </div>
        </div>
      </div>
      <LandingPageFooter />
    </div>
  );
}
