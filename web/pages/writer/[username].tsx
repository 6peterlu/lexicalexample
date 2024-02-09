import {
  Input,
  Link,
  Text,
  Textarea,
  useInput,
  useTheme
} from '@nextui-org/react';
import Head from 'next/head';
import { useRouter } from 'next/router';
import {
  convertPxStringToNumber,
  getFullLocationString,
  getFullNameString,
  getTitleString,
  pluralSuffix
} from '../../utils/string';
import {
  gql,
  useLazyQuery,
  useMutation,
  useQuery
} from '@apollo/client';
import ResponsiveButton from '../../components/ResponsiveButton';
import { Key, useEffect, useMemo, useState } from 'react';
import { useUserInfo } from '../../hooks/useUserInfo';
import {
  UpdateProfileDataRequest,
  UsernameSearchResult,
  UserProfileData
} from '../../generated/types/graphql';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';

import { faLink } from '@fortawesome/free-solid-svg-icons/faLink';
import { faLocationDot } from '@fortawesome/free-solid-svg-icons/faLocationDot';
import { faMagnifyingGlass } from '@fortawesome/free-solid-svg-icons/faMagnifyingGlass';
import { faUserGroup } from '@fortawesome/free-solid-svg-icons/faUserGroup';
import { faUserPen } from '@fortawesome/free-solid-svg-icons/faUserPen';

import LogoBackButton from '../../components/LogoBackButton';
import useMediaQuery from '../../hooks/useMediaQuery';
import ProfileMenu from '../../components/ProfileMenu';
import { useDebouncedCallback } from 'use-debounce';
import { Virtuoso } from 'react-virtuoso';
import { motion } from 'framer-motion';
import Twitter from '../../public/Twitter.svg';
import Instagram from '../../public/Instagram.svg';
import IcebergChart from '../../components/editor/IcebergChart';
import { getDateNDaysAgo } from '../../utils/time';
import PublishedDocumentList from '../../components/PublishedDocumentList';
import WritingSessionList from '../../components/WritingSessionList';

const GET_USER_PROFILE_DATA = gql`
  query getUserProfileData($username: String!) {
    getUserProfileData(args: { username: $username }) {
      username
      firstName
      lastName
      userID
      following
      followerCount
      followingCount
      bio
      city
      country
      website
      twitter
      instagram
    }
  }
`;

const FOLLOW_USER = gql`
  mutation followUser($userID: String!) {
    followUser(request: { userID: $userID })
  }
`;

const UNFOLLOW_USER = gql`
  mutation unfollowUser($userID: String!) {
    unfollowUser(request: { userID: $userID })
  }
`;

const USERNAME_SEARCH = gql`
  query usernameSearch($username: String!) {
    usernameSearch(args: { username: $username }) {
      username
      userID
    }
  }
`;

const UPDATE_PROFILE_DATA = gql`
  mutation updateProfileData(
    $bio: String
    $city: String
    $country: String
    $website: String
    $twitter: String
    $instagram: String
  ) {
    updateProfileData(
      request: {
        bio: $bio
        city: $city
        country: $country
        website: $website
        twitter: $twitter
        instagram: $instagram
      }
    )
  }
`;

export default function ProfilePage() {
  const router = useRouter();
  const { username } = router.query;
  const { user } = useUserInfo();
  const { theme } = useTheme();
  const { data, loading, error, called } = useQuery(
    GET_USER_PROFILE_DATA,
    {
      variables: {
        username: username as string
      },
      fetchPolicy: 'no-cache'
    }
  );
  const [updateProfileData] = useMutation(
    UPDATE_PROFILE_DATA
  );
  const [usernameSearch, { data: usernameSearchData }] =
    useLazyQuery(USERNAME_SEARCH, {
      variables: {
        username: ''
      }
    });
  const debouncedUsernameSearch = useDebouncedCallback(
    usernameSearch,
    500
  );
  const [updatedProfileData, setUpdatedProfileData] =
    useState<UpdateProfileDataRequest>(null);
  const { value: usernameSearchValue, bindings } =
    useInput('');

  const [usernameSearchResult, setUsernameSearchResult] =
    useState<UsernameSearchResult[]>([]);
  useEffect(() => {
    if (usernameSearchValue.length === 0) {
      setUsernameSearchResult([]);
    } else if (usernameSearchData) {
      setUsernameSearchResult(
        usernameSearchData.usernameSearch
      );
    }
  }, [usernameSearchData, usernameSearchValue]);
  const [followUser] = useMutation(FOLLOW_USER, {
    variables: {
      userID: ''
    }
  });

  const [unfollowUser] = useMutation(UNFOLLOW_USER, {
    variables: {
      userID: ''
    }
  });

  const [userProfileData, setUserProfileData] =
    useState<UserProfileData | null>(null);

  useEffect(() => {
    if (data) {
      setUserProfileData(data.getUserProfileData);
      setUpdatedProfileData(data.getUserProfileData);
    }
  }, [data]);
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );

  const isSelf = useMemo(() => {
    return user?.username === username;
  }, [user, username]);

  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (usernameSearchValue.length > 0) {
      debouncedUsernameSearch({
        variables: { username: usernameSearchValue }
      });
    }
  }, [usernameSearchValue, debouncedUsernameSearch]);

  if (loading || !userProfileData)
    return <div>Loading...</div>;

  if (!userProfileData && called) {
    router.push('/');
    return <div>Loading...</div>;
  }

  return (
    <>
      <Head>
        <title>{getTitleString(username as string)}</title>
      </Head>
      <div
        style={{
          justifyContent: 'space-between',
          display: 'flex',
          flexDirection: 'row',
          paddingLeft: isDesktop
            ? theme.space['2xl'].value
            : theme.space.md.value,
          paddingRight: isDesktop
            ? theme.space['2xl'].value
            : theme.space.md.value,
          paddingTop: theme.space.sm.value,
          paddingBottom: theme.space.sm.value,
          backgroundColor: theme.colors.gray200.value,
          borderBottomStyle: 'solid',
          borderBottomColor: theme.colors.gray600.value,
          borderBottomWidth: 0.5
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
              marginLeft: theme.space.md.value,
              position: 'relative'
            }}
          >
            <Input
              {...bindings}
              placeholder='Find other writers'
              contentLeft={
                <FontAwesomeIcon
                  icon={faMagnifyingGlass}
                  color={theme.colors.gray600.value}
                />
              }
              bordered={true}
              animated={false}
            />
            {usernameSearchData?.usernameSearch.length >
              0 && (
              <div
                style={{
                  backgroundColor: theme.colors.white.value,
                  position: 'absolute',
                  width: 400,
                  height: 200,
                  zIndex: 1,
                  padding: theme.space.md.value,
                  borderColor: 'black',
                  borderWidth: 1,
                  borderStyle: 'solid'
                }}
              >
                <Virtuoso
                  height='100%'
                  data={usernameSearchResult}
                  itemContent={(index, searchData) => {
                    return (
                      <motion.div
                        style={{
                          cursor: 'pointer'
                        }}
                        whileHover={{
                          backgroundColor:
                            theme.colors.gray600.value
                        }}
                        onClick={() => {
                          router.push(
                            `/writer/${searchData.username}`
                          );
                        }}
                      >
                        <Text size='$md' weight='bold'>
                          {searchData.username}
                        </Text>
                      </motion.div>
                    );
                  }}
                ></Virtuoso>
              </div>
            )}
          </div>
        </div>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'center'
          }}
        >
          <ProfileMenu />
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1
        }}
      >
        <div
          style={{
            ...{
              marginTop: theme.space['2xl'].value,
              marginBottom: theme.space['2xl'].value
            },
            ...(isDesktop
              ? {
                  width: theme.space['7xl'].value,
                  borderRightWidth: 1,
                  borderRightColor:
                    theme.colors.black.value,
                  borderRightStyle: 'solid',
                  paddingRight: theme.space['2xl'].value,
                  paddingLeft: theme.space['2xl'].value
                }
              : {
                  width: '100%',
                  paddingRight: theme.space.lg.value,
                  paddingLeft: theme.space.lg.value
                })
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
          >
            <Text
              size='$2xl'
              weight='bold'
              style={{
                letterSpacing:
                  theme.letterSpacings.normal.value
              }}
              color={theme.colors.blue600.value}
            >
              {getFullNameString(
                userProfileData.firstName,
                userProfileData.lastName
              )}
            </Text>
            <motion.div layout>
              {isSelf && (
                <ResponsiveButton
                  icon={
                    !isEditing && (
                      <motion.div layout>
                        <FontAwesomeIcon
                          icon={faUserPen}
                          size='sm'
                        />
                      </motion.div>
                    )
                  }
                  ripple={false}
                  onClick={async () => {
                    if (isEditing) {
                      await updateProfileData({
                        variables: {
                          city: updatedProfileData.city,
                          country:
                            updatedProfileData.country,
                          website:
                            updatedProfileData.website,
                          bio: updatedProfileData.bio,
                          instagram:
                            updatedProfileData.instagram,
                          twitter:
                            updatedProfileData.twitter
                        }
                      });
                      setUserProfileData({
                        ...userProfileData,
                        city: updatedProfileData.city,
                        country: updatedProfileData.country,
                        website: updatedProfileData.website,
                        bio: updatedProfileData.bio,
                        instagram:
                          updatedProfileData.instagram,
                        twitter: updatedProfileData.twitter
                      });
                    }
                    setIsEditing(!isEditing);
                  }}
                  ghost={!isEditing}
                >
                  {isEditing ? (
                    <motion.div layout>
                      Update profile
                    </motion.div>
                  ) : null}
                </ResponsiveButton>
              )}
            </motion.div>
          </div>
          <Text
            size='$xl'
            weight='bold'
            color={theme.colors.gray600.value}
            style={{
              letterSpacing:
                theme.letterSpacings.normal.value,
              paddingTop: theme.space.sm.value,
              paddingBottom: theme.space.sm.value
            }}
          >
            {userProfileData.username}
          </Text>
          {userProfileData.bio || isEditing ? (
            <div>
              {isEditing ? (
                <div>
                  <Textarea
                    size='sm'
                    fullWidth
                    value={userProfileData.bio}
                    onChange={(e) => {
                      setUpdatedProfileData({
                        ...updatedProfileData,
                        bio: e.target.value
                      });
                    }}
                    placeholder='Add a bio'
                  />
                </div>
              ) : (
                <Text
                  weight='bold'
                  style={{
                    letterSpacing:
                      theme.letterSpacings.normal.value
                  }}
                >
                  {userProfileData.bio}
                </Text>
              )}
            </div>
          ) : null}
          {!isSelf && (
            <div
              style={{ marginTop: theme.space.md.value }}
            >
              <ResponsiveButton
                onClick={async () => {
                  if (!user) {
                    router.push('/login?signup=true');
                    return;
                  }
                  if (!userProfileData.following) {
                    await followUser({
                      variables: {
                        userID: userProfileData.userID
                      }
                    });
                    setUserProfileData({
                      ...userProfileData,
                      following: true,
                      followerCount:
                        userProfileData.followerCount + 1
                    });
                  } else {
                    await unfollowUser({
                      variables: {
                        userID: userProfileData.userID
                      }
                    });
                    setUserProfileData({
                      ...userProfileData,
                      following: false,
                      followerCount:
                        userProfileData.followerCount - 1
                    });
                  }
                }}
                ghost={userProfileData.following}
              >
                {userProfileData.following
                  ? 'Unfollow'
                  : 'Follow'}
              </ResponsiveButton>
            </div>
          )}
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              marginTop: theme.space.md.value
            }}
          >
            <FontAwesomeIcon
              icon={faUserGroup}
              style={{
                marginRight: theme.space.md.value
              }}
              width={theme.space.md.value}
            />
            <Text
              size='small'
              style={{
                letterSpacing:
                  theme.letterSpacings.normal.value
              }}
            >
              {userProfileData.followerCount} follower
              {pluralSuffix(
                userProfileData.followerCount
              )}{' '}
              / {userProfileData.followingCount} following
            </Text>
          </div>
          {(userProfileData.city ||
            userProfileData.country ||
            isEditing) && (
            <motion.div
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: theme.space.md.value
              }}
            >
              <motion.div layout='position'>
                <FontAwesomeIcon
                  icon={faLocationDot}
                  style={{
                    marginRight: theme.space.md.value
                  }}
                  width={theme.space.md.value}
                />
              </motion.div>
              {isEditing ? (
                <motion.div
                  layout='position'
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    alignItems: 'flex-end'
                  }}
                >
                  <Input
                    placeholder='City'
                    underlined
                    value={updatedProfileData.city}
                    onChange={(e) => {
                      setUpdatedProfileData({
                        ...updatedProfileData,
                        city: e.target.value
                      });
                    }}
                  />
                  <Text>,</Text>
                  <Input
                    placeholder='Country'
                    underlined
                    width='70px'
                    value={updatedProfileData.country}
                    onChange={(e) => {
                      setUpdatedProfileData({
                        ...updatedProfileData,
                        country: e.target.value
                      });
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div layout='position'>
                  <Text size='small'>
                    {getFullLocationString(
                      userProfileData.city,
                      userProfileData.country
                    )}
                  </Text>
                </motion.div>
              )}
            </motion.div>
          )}
          {userProfileData.website || isEditing ? (
            <motion.div
              layout
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: theme.space.md.value
              }}
            >
              <motion.div layout>
                <FontAwesomeIcon
                  icon={faLink}
                  style={{
                    marginRight: theme.space.md.value
                  }}
                  width={theme.space.md.value}
                />
              </motion.div>
              {isEditing ? (
                <motion.div
                  layout='position'
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flex: 1
                  }}
                >
                  <Input
                    placeholder='Website'
                    underlined
                    fullWidth
                    value={updatedProfileData.website}
                    onChange={(e) => {
                      setUpdatedProfileData({
                        ...updatedProfileData,
                        website: e.target.value
                      });
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div layout='position'>
                  <Link
                    href={`https://${userProfileData.website}`}
                    style={{
                      fontSize: theme.fontSizes.sm.value
                    }}
                  >
                    {userProfileData.website}
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ) : null}
          {userProfileData.twitter || isEditing ? (
            <motion.div
              layout='preserve-aspect'
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: theme.space.md.value
              }}
            >
              <motion.div
                layout
                style={{
                  marginRight: theme.space.md.value
                }}
              >
                <Twitter />
              </motion.div>
              {isEditing ? (
                <motion.div
                  layout='position'
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flex: 1
                  }}
                >
                  <Input
                    placeholder='Twitter'
                    underlined
                    fullWidth
                    labelLeft='@'
                    value={updatedProfileData.twitter}
                    onChange={(e) => {
                      setUpdatedProfileData({
                        ...updatedProfileData,
                        twitter: e.target.value
                      });
                    }}
                  />
                </motion.div>
              ) : (
                <motion.a
                  layout='preserve-aspect'
                  href={`https://twitter.com/${userProfileData.twitter}`}
                  style={{
                    fontSize: theme.fontSizes.sm.value
                  }}
                >
                  @{userProfileData.twitter}
                </motion.a>
              )}
            </motion.div>
          ) : null}
          {userProfileData.instagram || isEditing ? (
            <motion.div
              layout='position'
              style={{
                display: 'flex',
                flexDirection: 'row',
                alignItems: 'center',
                marginTop: theme.space.md.value
              }}
            >
              <motion.div
                layout
                style={{
                  marginRight: theme.space.md.value
                }}
              >
                <Instagram />
              </motion.div>
              {isEditing ? (
                <motion.div
                  layout
                  style={{
                    display: 'flex',
                    flexDirection: 'row',
                    flex: 1
                  }}
                >
                  <Input
                    placeholder='Instagram'
                    underlined
                    fullWidth
                    labelLeft='@'
                    value={updatedProfileData.instagram}
                    onChange={(e) => {
                      setUpdatedProfileData({
                        ...updatedProfileData,
                        instagram: e.target.value
                      });
                    }}
                  />
                </motion.div>
              ) : (
                <motion.div layout='position'>
                  <Link
                    href={`https://instagram.com/${userProfileData.instagram}`}
                    style={{
                      fontSize: theme.fontSizes.sm.value
                    }}
                  >
                    @{userProfileData.instagram}
                  </Link>
                </motion.div>
              )}
            </motion.div>
          ) : null}
          {!isDesktop && (
            <div
              style={{ marginTop: theme.space.xl.value }}
            >
              <PublishedDocumentList
                username={username as string}
              />
              <Text
                size='$xl'
                color={theme.colors.blue600.value}
                weight='bold'
                style={{
                  letterSpacing:
                    theme.letterSpacings.normal.value
                }}
              >
                Activity iceberg
              </Text>
              <Text
                color={theme.colors.gray600.value}
                style={{
                  letterSpacing:
                    theme.letterSpacings.normal.value
                }}
              >
                Last month
              </Text>
              <IcebergChart
                height={100}
                width='50%'
                startDate={getDateNDaysAgo(30)}
                endDate={new Date()}
              />
            </div>
          )}
        </div>
        {isDesktop && (
          <div
            style={{
              padding: theme.space['3xl'].value,
              width: '100%'
            }}
          >
            <PublishedDocumentList
              username={username as string}
            />
            <Text
              size='$xl'
              color={theme.colors.blue600.value}
              weight='bold'
              style={{
                letterSpacing:
                  theme.letterSpacings.normal.value
              }}
            >
              Activity iceberg
            </Text>
            <Text
              color={theme.colors.gray600.value}
              style={{
                letterSpacing:
                  theme.letterSpacings.normal.value
              }}
            >
              Last month
            </Text>
            <IcebergChart
              height={100}
              width='100%'
              startDate={getDateNDaysAgo(30)}
              endDate={new Date()}
            />
            <WritingSessionList />
          </div>
        )}
      </div>
    </>
  );
}
