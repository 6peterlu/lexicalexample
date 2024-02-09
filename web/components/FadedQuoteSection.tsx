import { Button, Text, useTheme } from '@nextui-org/react';
import { useRouter } from 'next/router';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';
import ResponsiveButton from './ResponsiveButton';

export default function FadedQuoteSection() {
  const { theme } = useTheme();
  const router = useRouter();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const textStyle = {
    fontFamily: 'Cedarville Cursive',
    fontSize: isDesktop
      ? theme.fontSizes['3xl'].value
      : theme.fontSizes.xs.value,
    textShadow: `1px 1px 10px ${theme.colors.gray600.value}`,
    color: 'rgba(0, 0, 0, 0)',
    paddingTop: theme.space['2xl'].value
  };

  return (
    <div
      style={{
        paddingLeft: isDesktop
          ? theme.space['2xl'].value
          : theme.space.md.value,
        paddingRight: isDesktop
          ? theme.space['2xl'].value
          : theme.space.md.value,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center'
      }}
    >
      <Text style={textStyle}>
        {`Your father is about to ask me the question. This is
        the most important moment in our lives, and I want
        to pay attention, note every detail. Your dad and I
        have just come back from an evening out, dinner and
        a show; it's after midnight. We came out onto the
        patio to look at the full moon; then I told your dad
        I wanted to dance, so he humors me and now we're
        slow-dancing, a pair of thirty somethings swaying
        back and forth in the moon-light like kids. I don't
        feel the night chill at all. And then your dad says,
        “Do you want to make a baby? ”Right now your dad and
        I have been married for about two years, living on
        Ellis Avenue; when we move out you'll still be too
        young to remember the house, but we'll show you
        pictures of it, tell you stories about it. I'd love
        to tell you the story of this evening, the night
        you're conceived, but the right time to do that
        would be when you're ready to have children of your
        own, and we'll never get that chance.`}
      </Text>
      <div
        style={{
          position: 'absolute',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          background:
            'radial-gradient(69.34% 69.31% at 50% 50%, #FFFFFF 0%, rgba(255, 255, 255, 0.9) 30%, rgba(255, 255, 255, 0) 100%)'
        }}
      >
        <Text
          style={{
            ...textStyle,
            paddingLeft: theme.space['2xl'].value,
            paddingRight: theme.space['2xl'].value,
            textShadow: 'none'
          }}
        >
          {`Your father is about to ask me the question. This
          is the most important moment in our lives, and I
          want to pay attention, note every detail. Your dad
          and I have just come back from an evening out,
          dinner and a show; it's after midnight. We came
          out onto the patio to look at the full moon; then
          I told your dad I wanted to dance, so he humors me
          and now we're slow-dancing, a pair of thirty
          somethings swaying back and forth in the
          moon-light like kids. I don't feel the night chill
          at all. And then your dad says, “Do you want to
          make a baby? ”Right now your dad and I have been
          married for about two years, living on Ellis
          Avenue; when we move out you'll still be too young
          to remember the house, but we'll show you pictures
          of it, tell you stories about it. I'd love to tell
          you the story of this evening, the night you're
          conceived, but the right time to do that would be
          when you're ready to have children of your own,
          and we'll never get that chance.`}
        </Text>
      </div>
      <div
        style={{
          position: 'absolute',
          width: '50vw',
          height: '50vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <div
          style={{ paddingBottom: theme.space.lg.value }}
        >
          <Text
            style={{
              fontSize: isDesktop
                ? theme.fontSizes['4xl'].value
                : theme.fontSizes.xl.value,
              fontWeight: theme.fontWeights.bold.value,
              letterSpacing:
                theme.letterSpacings.normal.value,
              textAlign: 'center'
            }}
          >
            Unlock your inner writer.
          </Text>
        </div>

        <ResponsiveButton
          onClick={() => {
            router.push('/challenge/today');
          }}
          style={
            isDesktop
              ? {}
              : {
                  background: theme.colors.yellow500.value
                }
          }
        >
          {`Try today's prompt`}
        </ResponsiveButton>
      </div>
    </div>
  );
}
