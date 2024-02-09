import {
  Button,
  Loading,
  Text,
  useTheme
} from '@nextui-org/react';
import {
  useDocuments,
  useSharedDocuments
} from '../../hooks/useDocuments';
import HomepageHeader from '../../components/HomepageHeader';
import { ContentsSection } from '../../components/ContentsSection';
import { useSession } from 'next-auth/react';
import ScratchpadLink from '../../components/ScratchpadLink';
import TrackingLink from '../../components/TrackingLink';
import LandingPage from '../../components/LandingPage';
import UpdatesPageLink from '../../components/UpdatesPageLink';
import Head from 'next/head';
import {
  convertPxStringToNumber,
  getTitleString
} from '../../utils/string';
import { useUserInfo } from '../../hooks/useUserInfo';
import useMediaQuery from '../../hooks/useMediaQuery';

const Home = () => {
  const documents = useDocuments();
  const sharedDocuments = useSharedDocuments();
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );

  const { data: session, status } = useSession();
  const {
    loading: userInfoLoading,
    called: userInfoCalled
  } = useUserInfo();

  if (
    status === 'loading' ||
    userInfoLoading ||
    !userInfoCalled
  ) {
    return <Loading />;
  }
  if (!session) {
    // not signed in
    return <LandingPage />;
  }

  return (
    <>
      <Head>
        <title>{getTitleString('Contents')}</title>
      </Head>
      <HomepageHeader />
      {documents && sharedDocuments ? (
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: theme.colors.gray200.value,
            flex: 1,
            alignItems: 'center'
          }}
        >
          <div
            style={{
              ...{
                backgroundColor: theme.colors.white.value,
                flex: 1
              },
              ...(isDesktop
                ? {
                    width: '90%',
                    maxWidth: 1000,
                    paddingTop: theme.space['2xl'].value,
                    paddingLeft: theme.space['2xl'].value,
                    paddingRight: theme.space['2xl'].value
                  }
                : {
                    width: '100%',
                    paddingTop: theme.space[12].value,
                    paddingLeft: theme.space.md.value,
                    paddingRight: theme.space.md.value
                  })
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'center'
              }}
            >
              <Text
                style={{
                  ...{
                    color: theme.colors.blue600.value,
                    fontWeight:
                      theme.fontWeights.bold.value,
                    letterSpacing:
                      theme.letterSpacings.normal.value,
                    marginBottom: theme.space.md.value
                  },
                  ...(isDesktop
                    ? {
                        fontSize:
                          theme.fontSizes['4xl'].value
                      }
                    : {
                        fontSize:
                          theme.fontSizes['2xl'].value
                      })
                }}
              >
                Contents
              </Text>
            </div>
            <div
              style={
                isDesktop
                  ? { marginLeft: theme.space.sm.value }
                  : {}
              }
            >
              <UpdatesPageLink />
              <ScratchpadLink />
              <TrackingLink />
            </div>
            <div
              style={{
                marginBottom: theme.space['2xl'].value
              }}
            >
              <ContentsSection
                title='I. Your Documents'
                documents={documents}
              />
              <ContentsSection
                title='II. Shared with me'
                documents={sharedDocuments}
              />
            </div>
          </div>
        </div>
      ) : (
        <Loading />
      )}
    </>
  );
};

export default Home;
