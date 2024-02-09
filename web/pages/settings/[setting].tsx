import { gql, useMutation } from '@apollo/client';
import {
  Button,
  Input,
  Loading,
  Text,
  useInput
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useEffect, useMemo, useState } from 'react';
import NonEditorHeader from '../../components/NonEditorHeader';
import SettingsSidebar from '../../components/SettingsSidebar';
import { useUserInfo } from '../../hooks/useUserInfo';
import {
  capitalize,
  getTitleString,
  validateUsername
} from '../../utils/string';
import Head from 'next/head';

// copy pasta-ed from the api folder. Below is the location of the copy.
// TODO: find a way to share libraries
// import { validateUsername } from '../api/models/user';
import { useSession } from 'next-auth/react';

function usernameHasError(username: string) {
  if (!username) {
    return false;
  }
  const VALID_USERNAME_REGEX = /^\S+$/g;
  const validateResult =
    VALID_USERNAME_REGEX.test(username);
  return !validateResult;
}

export const SETTINGS_PATH = 'settings';

export const SETTING_PAGES = {
  USERNAME: 'username'
};

const UPDATE_USERNAME = gql`
  mutation updateUsername($username: String!) {
    updateBasicUserInfo(request: { username: $username })
  }
`;

function Settings() {
  const { status } = useSession({ required: true });
  const router = useRouter();
  const { setting } = router.query;
  const { user, loadUserData } = useUserInfo();
  const {
    value: updatedUsername,
    reset: resetUsernameValue,
    bindings
  } = useInput('');
  const [updateUsername] = useMutation(UPDATE_USERNAME, {
    variables: { username: updatedUsername }
  });
  const usernameError = useMemo(() => {
    if (!updatedUsername) {
      return false;
    }
    return !validateUsername(updatedUsername);
  }, [updatedUsername]);
  if (!user || status === 'loading') {
    return <Loading />;
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        flex: 1
      }}
    >
      <Head>
        <title>
          {getTitleString(
            `${capitalize(setting as string)} settings`
          )}
        </title>
      </Head>
      <NonEditorHeader title='Settings' />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          flex: 1
        }}
      >
        <SettingsSidebar />
        <div
          style={{
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              padding: 20
            }}
          >
            <Text>
              {capitalize(setting as string)} settings
            </Text>
          </div>
          <div style={{ padding: 20 }}>
            <Text h4>Your current username:</Text>
            <Text>{user.username}</Text>
            <Text h4>Your new username:</Text>
            <Input
              {...bindings}
              placeholder='new username'
              value={updatedUsername}
              status={usernameError ? 'error' : 'default'}
            />
            <Button
              onClick={async () => {
                await updateUsername({
                  variables: { username: updatedUsername }
                });
                await loadUserData();
                resetUsernameValue();
              }}
              disabled={!updatedUsername || usernameError}
            >
              Update
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Settings;
