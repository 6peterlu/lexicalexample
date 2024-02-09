import { Loading, Text, useTheme } from '@nextui-org/react';
import { useRouter } from 'next/router';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';
import { gql, useQuery } from '@apollo/client';
import { useUserInfo } from '../hooks/useUserInfo';
import dayjs from 'dayjs';

const GET_USER_PROFILE_DATA = gql`
  query getUserProfileData($username: String!) {
    getUserProfileData(args: { username: $username }) {
      createdAt
    }
  }
`;

export default function ScratchpadLink() {
  const router = useRouter();
  const { theme } = useTheme();
  const { user } = useUserInfo();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const { data, loading, error, called } = useQuery(
    GET_USER_PROFILE_DATA,
    {
      variables: {
        username: user.username as string
      },
      fetchPolicy: 'no-cache'
    }
  );
  if (!data) {
    return <Loading />;
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        cursor: 'pointer',
        marginBottom: theme.space.xs.value
      }}
      onClick={() => {
        router.push('/scratchpad');
      }}
      tabIndex={0}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1
        }}
      >
        <Text
          size={isDesktop ? 'medium' : 'small'}
          style={{
            userSelect: 'none'
          }}
        >
          Scratchpad
        </Text>
        <div
          style={{
            flex: 1,
            borderBottomColor: 'black',
            borderBottomStyle: 'dotted',
            borderBottomWidth: 2,
            marginBottom:
              ((parseFloat(theme.lineHeights.lg.value) -
                parseFloat(theme.fontSizes.md.value[0])) *
                // * 16 to convert from rem to px
                16) /
              // / 2 because space is present on the top and bottom of the line
              2,
            marginLeft: 8,
            marginRight: 8
          }}
        />
        <Text
          size={isDesktop ? 'medium' : 'small'}
          style={{
            userSelect: 'none'
          }}
        >
          since{' '}
          {dayjs
            .tz(
              data.getUserProfileData.createdAt,
              dayjs.tz.guess()
            )
            .toDate()
            .toLocaleDateString()}
        </Text>
      </div>
    </div>
  );
}
