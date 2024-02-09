import { useState } from 'react';
import { CSS, useTheme } from '@nextui-org/react';

export function HoverStyleButton({
  children,
  style
}: {
  children: JSX.Element;
  style?: CSS;
}) {
  const [divStyle, setDivStyle] = useState(null);
  const { theme } = useTheme();
  return (
    <div
      onMouseEnter={() => {
        setDivStyle({
          backgroundColor: theme.colors.gray500.value
        });
      }}
      onMouseLeave={() => {
        setDivStyle(null);
      }}
      style={{ ...style, ...divStyle }}
    >
      {children}
    </div>
  );
}
