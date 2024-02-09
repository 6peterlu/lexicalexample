import { Button, useTheme } from '@nextui-org/react';
import Google from '../public/Google.svg';

export default function SignInGoogleButton({
  text,
  signIn
}: {
  text: string;
  signIn: () => void;
}) {
  const { theme } = useTheme();
  return (
    <Button
      icon={
        <div
          style={{
            width: theme.space.lg.value,
            alignItems: 'center',
            flexDirection: 'row',
            display: 'flex',
            marginRight: theme.space.sm.value,
            height: theme.space.lg.value
          }}
        >
          <Google />
        </div>
      }
      iconLeftCss={{
        position: 'relative',
        left: 0,
        top: 0,
        transform: 'none'
      }}
      ghost
      style={{
        borderColor: `${theme.colors.black.value} !important`, // this brings me great pain and suffering
        borderWidth: 1,
        color: `${theme.colors.black.value} !important`,
        minWidth: theme.space['6xl'].value
      }}
      css={{
        '&:hover': {
          backgroundColor: theme.colors.purple500.value,
          color: `${theme.colors.white.value} !important`,
          borderColor: `${theme.colors.purple500.value} !important`
        },
        '&:focus': {
          // what the button looks like when its clicked
          backgroundColor: theme.colors.purple500.value,
          color: `${theme.colors.white.value} !important`,
          borderColor: `${theme.colors.purple500.value} !important`
        }
      }}
      onClick={() => signIn()}
    >
      {text}
    </Button>
  );
}
