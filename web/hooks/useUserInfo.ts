import {
  gql,
  useLazyQuery,
  useReactiveVar
} from '@apollo/client';
import { useRouter } from 'next/router';
import { useCallback, useEffect, useState } from 'react';
import { userInfoVar } from '../cache/cache';
import { UserDB } from '../models/user';
import { useSession } from 'next-auth/react';

const LOAD_USER = gql`
  query getUser {
    getUser {
      user {
        userID
        username
        firstName
        lastName
      }
      redirectURL
    }
  }
`;

/**
 * Loads user data into the reactive var and returns it.
 * @returns
 */
export function useUserInfo() {
  let user = useReactiveVar(userInfoVar);
  const router = useRouter();
  const [loadUser, { loading, called }] = useLazyQuery(
    LOAD_USER,
    {
      fetchPolicy: 'no-cache'
    }
  );
  const loadUserData = useCallback(async () => {
    const userData = await loadUser();
    if (userData.data.getUser.user) {
      userInfoVar(
        UserDB.fromGraphQL(userData.data.getUser.user)
      );
      if (!userData.data.getUser.user.firstName) {
        // redirect to name entry screen if no first name is present
        router.push('/welcome');
        return;
      }
    }
  }, [loadUser, router]);
  useEffect(() => {
    loadUserData();
  }, [loadUserData]);
  return { user, loadUserData, loading, called };
}
