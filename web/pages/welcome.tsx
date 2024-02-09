import { gql, useMutation } from '@apollo/client';
import { faArrowRight } from '@fortawesome/free-solid-svg-icons/faArrowRight';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import {
  Button,
  Input,
  Loading,
  Text,
  useInput,
  useTheme
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useUserInfo } from '../hooks/useUserInfo';
import {
  validateName,
  validateUsername
} from '../utils/string';

const UPDATE_BASIC_USER_INFO = gql`
  mutation updateBasicUserInfo(
    $firstName: String!
    $lastName: String
    $username: String!
  ) {
    updateBasicUserInfo(
      request: {
        firstName: $firstName
        lastName: $lastName
        username: $username
      }
    )
  }
`;

export default function WelcomePage() {
  const { theme } = useTheme();
  const { user } = useUserInfo();
  const {
    value: firstNameValue,
    bindings: firstNameBindings
  } = useInput('');
  const {
    value: lastNameValue,
    bindings: lastNameBindings
  } = useInput('');
  const {
    value: usernameValue,
    bindings: usernameBindings
  } = useInput('');
  function showNameErrorState(name: string) {
    if (!name) {
      return false;
    }
    return !validateName(name);
  }
  function showUsernameErrorState(username: string) {
    if (!username) {
      return false;
    }
    return !validateUsername(username);
  }
  const [updateBasicUserInfoMutation] = useMutation(
    UPDATE_BASIC_USER_INFO,
    {
      variables: {
        firstName: firstNameValue,
        lastName: lastNameValue,
        username: usernameValue
      }
    }
  );
  const router = useRouter();
  if (!user) {
    return <Loading />;
  }
  // if user already has a first name redirect to dashboard
  if (user.firstName) {
    router.push('/');
  }
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        flex: 1
      }}
    >
      <Text
        style={{ fontSize: theme.fontSizes['5xl'].value }}
      >
        <span
          style={{
            fontFamily: 'Merriweather',
            fontSize: theme.fontSizes['4xl'].value,
            paddingRight: theme.space.md.value
          }}
        >
          Welcome to
        </span>
        <span style={{ fontFamily: 'Cedarville Cursive' }}>
          draft zero
        </span>
        .
      </Text>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-start'
        }}
      >
        <div
          style={{
            marginBottom: theme.space.md.value,
            width: '100%'
          }}
        >
          <div
            style={{
              marginBottom: theme.space.md.value,
              width: '100%'
            }}
          >
            <Input
              {...firstNameBindings}
              placeholder='first name'
              underlined
              fullWidth={true}
              style={{ color: theme.colors.blue600.value }}
              color={
                showNameErrorState(firstNameValue)
                  ? 'error'
                  : 'default'
              }
              helperColor={
                showNameErrorState(firstNameValue)
                  ? 'error'
                  : 'default'
              }
              helperText={
                showNameErrorState(firstNameValue)
                  ? 'Only letters are allowed.'
                  : ''
              }
            />
          </div>
          <Input
            {...lastNameBindings}
            placeholder='last name'
            underlined
            fullWidth={true}
            style={{ color: theme.colors.blue600.value }}
            color={
              showNameErrorState(lastNameValue)
                ? 'error'
                : 'default'
            }
            helperColor={
              showNameErrorState(lastNameValue)
                ? 'error'
                : 'default'
            }
            helperText={
              showNameErrorState(lastNameValue)
                ? 'Only letters are allowed.'
                : ''
            }
          />
        </div>
        <Text
          style={{ fontSize: theme.fontSizes.sm.value }}
        >
          Choose your home on the internet:
        </Text>
        <div
          style={{
            display: 'flex',
            flexDirection: 'row',
            alignItems: 'flex-end',
            marginBottom: theme.space.xl.value,
            width: '100%'
          }}
        >
          <Input
            {...usernameBindings}
            labelLeft='draftzero.com/writer'
            placeholder='username'
            underlined
            fullWidth={true}
            style={{ color: theme.colors.blue600.value }}
            color={
              showUsernameErrorState(usernameValue)
                ? 'error'
                : 'default'
            }
            helperColor={
              showUsernameErrorState(usernameValue)
                ? 'error'
                : 'default'
            }
            helperText={
              showUsernameErrorState(usernameValue)
                ? 'Only letters or numbers are allowed.'
                : ''
            }
          />
        </div>
      </div>
      <Button
        iconRight={<FontAwesomeIcon icon={faArrowRight} />}
        disabled={!firstNameValue || !usernameValue}
        onClick={async () => {
          await updateBasicUserInfoMutation({
            variables: {
              firstName: firstNameValue,
              lastName: lastNameValue,
              username: usernameValue
            }
          });
          // after setting name, go to homescreen
          router.push('/');
        }}
      >
        Continue
      </Button>
    </div>
  );
}
