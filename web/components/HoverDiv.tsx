import React, { CSSProperties } from 'react';
import { motion } from 'framer-motion';
import { useTheme } from '@nextui-org/react';

export default function HoverDiv({
  children,
  motionDivStyle
}: {
  children: React.ReactElement[] | React.ReactElement;
  motionDivStyle?: CSSProperties;
}) {
  const { theme } = useTheme();
  const hoverStyle = {
    boxShadow: `2px 2px ${theme.colors.gray500.value}`,
    translateX: -2,
    translateY: -2,
    border: '0.5 0.5 0.1 0.1 solid black',
    backgroundColor: 'white'
  };
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start'
      }}
    >
      <motion.div
        style={{
          borderRadius: theme.radii.md.value,
          cursor: 'pointer',
          alignSelf: 'flex-start',
          width: '100%',
          ...motionDivStyle
        }}
        whileHover={hoverStyle}
        transition={{ ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </div>
  );
}
