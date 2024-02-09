import { useRouter } from 'next/router';
import Logo from '../public/Logo.svg';
import WhiteLogo from '../public/WhiteLogo.svg';
import { useTheme } from '@nextui-org/react';
import useMediaQuery from '../hooks/useMediaQuery';
import { convertPxStringToNumber } from '../utils/string';
export default function LogoBackButton({
  inverted
}: {
  inverted?: boolean;
}) {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  const router = useRouter();
  return (
    <div
      style={{
        height: isDesktop
          ? theme.space[14].value
          : theme.space[12].value,
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        cursor: 'pointer'
      }}
      onClick={() => {
        router.push('/');
      }}
    >
      {inverted ? <WhiteLogo /> : <Logo />}
    </div>
  );
}
