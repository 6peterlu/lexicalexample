import { Text, useTheme } from '@nextui-org/react';
import NonEditorHeader from '../components/NonEditorHeader';
import Head from 'next/head';
import {
  convertPxStringToNumber,
  getTitleString,
  hashCode
} from '../utils/string';
import useMediaQuery from '../hooks/useMediaQuery';

function SectionTitle({ title }: { title: string }) {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  return (
    <Text
      size={isDesktop ? '$3xl' : '$xl'}
      color={theme.colors.blue600.value}
      weight='bold'
      style={{ fontFamily: 'Cedarville Cursive' }}
    >
      {title}
    </Text>
  );
}

function SectionBody({
  subtitles
}: {
  subtitles: string[];
}) {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  return (
    <ul style={{ listStyleType: 'disc' }}>
      {subtitles.map((subtitle) => (
        <li
          key={hashCode(subtitle)}
          style={
            isDesktop
              ? { fontSize: theme.fontSizes.md.value }
              : { fontSize: theme.fontSizes.sm.value }
          }
        >
          {subtitle}
        </li>
      ))}
    </ul>
  );
}

export default function Updates() {
  const { theme } = useTheme();
  return (
    <>
      <Head>
        <title>{getTitleString('Updates')}</title>
      </Head>
      <NonEditorHeader title={"What's new"} />
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center'
        }}
      >
        <div
          style={{
            width: '80%',
            maxWidth: 800,
            marginTop: theme.space['2xl'].value
          }}
        >
          <SectionTitle title='4/18/2023' />
          <SectionBody
            subtitles={[
              `You can now track writing sessions, Strava-style, with the "Start writing session" button in the document editor.`
            ]}
          />
          <SectionTitle title='4/2/2023' />
          <SectionBody
            subtitles={[
              `Now, you can publish your blog posts to the world with the Publish button in the document editor.`
            ]}
          />
          <SectionTitle title='3/14/2023' />
          <SectionBody
            subtitles={[
              `Have a writing prompt idea? You can now propose a prompt through the writing challenge page.`
            ]}
          />
          <SectionTitle title='3/9/2023' />
          <SectionBody
            subtitles={[
              `Now keep track of your writing streaks on the
              Tracking page. Check it out by clicking on
              "Tracking" on the homepage.`
            ]}
          />
          <SectionTitle title='3/5/2023' />
          <SectionBody
            subtitles={[
              `Added a favicon (the icon in the browser tab)
              so it's easier to find your Draft Zero tabs.`
            ]}
          />
          <SectionTitle title='3/3/2023' />
          <SectionBody
            subtitles={[
              `Tracking page: see your daily word and time
              stats! Accessible from the homepage.`
            ]}
          />
        </div>
      </div>
    </>
  );
}
