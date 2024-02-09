import './globals.css';
import 'react-day-picker/dist/style.css';
import { ApolloProvider } from '@apollo/client';
import { ComponentType } from 'react';
import client from '../apollo-client';
import { SessionProvider } from 'next-auth/react';
import { Toaster } from 'sonner';

// 1. Import `createTheme`
import {
  createTheme,
  NextUIProvider
} from '@nextui-org/react';
import { useRouter } from 'next/router';

// 2. Call `createTheme` and pass your custom values
const theme = createTheme({
  type: 'light', // it could be "light" or "dark"
  theme: {
    colors: {
      lightText: '#BFC5C7',
      blue50: '#E6ECEF',
      blue100: '#D9E2E8',
      blue200: '#C0CFD8',
      blue300: '#A6BCC9',
      blue400: '#8DA9B9',
      blue500: '#7194A8',
      blue600: '#5D8298',
      blue700: '#4E6D7E',
      blue800: '#3E5765',
      blue900: '#2F414C',
      purple50: '#E6E7EF',
      purple100: '#D9DBE7',
      purple200: '#C0C3D8',
      purple300: '#A7ABC8',
      purple400: '#8E93B8',
      purple500: '#757BA9',
      purple600: '#5E6597',
      purple700: '#4F547D',
      purple800: '#3F4364',
      purple900: '#2F324B',
      yellow50: '#F6F1E0',
      yellow100: '#F1EAD0',
      yellow200: '#E5D9A7',
      yellow300: '#DECF91',
      yellow400: '#D5C172',
      yellow500: '#CBB352',
      yellow600: '#BCA238',
      yellow700: '#9D872F',
      yellow800: '#7E6C26',
      yellow900: '#5E511C',
      pink50: '#F8DEE2',
      pink100: '#F4CDD4',
      pink200: '#EDABB7',
      pink300: '#E58A9B',
      pink400: '#DE687E',
      pink500: '#D74761',
      pink600: '#C92C49',
      pink700: '#A7253D',
      pink800: '#861D31',
      pink900: '#641624',
      orange50: '#F7E7DE',
      orange100: '#F3DCCE',
      orange200: '#EBC4AD',
      orange300: '#E2AC8D',
      orange400: '#DA956C',
      orange500: '#D27D4B',
      orange600: '#BD632F',
      orange700: '#A35629',
      orange800: '#834521',
      orange900: '#623318',
      primary: '#5C6192',
      primaryLightContrast: '#5C6192',
      primaryLight: '#D6D8E3',
      secondary: '#EE7674',
      secondarySolidHover: '#F85654',
      border: '#D9E2E8'
    },
    fonts: {
      sans: 'Merriweather'
    }
  }
});

function MyApp({
  Component,
  pageProps
}: {
  Component: ComponentType;
  pageProps: any;
}) {
  const router = useRouter();
  return (
    <ApolloProvider client={client}>
      <SessionProvider session={pageProps.session}>
        <NextUIProvider theme={theme}>
          <Toaster />
          {/* reload page on every path change: https://nextjs.org/docs/api-reference/next/router#usage */}
          <Component key={router.asPath} {...pageProps} />
        </NextUIProvider>
      </SessionProvider>
    </ApolloProvider>
  );
}

export default MyApp;
