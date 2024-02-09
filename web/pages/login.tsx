import { Loading, Text, useTheme } from '@nextui-org/react';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/router';
import LandingPageFooter from '../components/LandingPageFooter';
import NotLoggedInHeader from '../components/NotLoggedInHeader';
import SignUpGoogleButton from '../components/SignUpGoogleButton';
import Head from 'next/head';
import { getTitleString } from '../utils/string';
import { GetStaticPropsContext } from 'next';

export default function SignIn() {
  const { theme } = useTheme();
  const router = useRouter();
  const { data: session, status } = useSession();
  if (status === 'loading') {
    return <Loading />;
  }
  if (session) {
    router.push('/');
    return <Loading />;
  }
  const { signup } = router.query;
  return (
    <>
      <div
        style={{
          height: '100%',
          display: 'flex',
          flexDirection: 'column'
        }}
      >
        <Head>
          <title>
            {getTitleString(signup ? 'Sign Up' : 'Log In')}
          </title>
        </Head>
        <NotLoggedInHeader />
        <div
          style={{
            display: 'flex',
            flex: 1,
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            padding: theme.space['2xl'].value
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center'
            }}
          >
            <Text
              style={{
                fontSize: theme.fontSizes['4xl'].value,
                fontWeight: 'bold',
                letterSpacing:
                  theme.letterSpacings.normal.value
              }}
            >
              {signup ? 'Come write.' : 'Welcome back.'}
            </Text>
            <div
              style={{
                marginTop: theme.space.lg.value,
                marginBottom: theme.space.lg.value
              }}
            >
              <div>
                <SignUpGoogleButton
                  signIn={() =>
                    signIn('google', { callbackUrl: '/' })
                  }
                  text={
                    signup
                      ? 'Sign up with Google'
                      : 'Sign in with Google'
                  }
                />
              </div>
            </div>
            <div
              style={{
                marginBottom: theme.space['2xl'].value
              }}
            >
              {signup ? (
                <Text color={theme.colors.gray600.value}>
                  Already have an account?{' '}
                  <a
                    onClick={() => {
                      router.push('/login');
                    }}
                  >
                    Log in
                  </a>
                </Text>
              ) : (
                <Text color={theme.colors.gray600.value}>
                  New to Draft Zero?{' '}
                  <a
                    onClick={() => {
                      router.push('/login?signup=true');
                    }}
                  >
                    Sign up
                  </a>
                </Text>
              )}
            </div>
          </div>
        </div>
        <LandingPageFooter />
      </div>
    </>
  );
}
