import { Text, useTheme } from '@nextui-org/react';
import { motion } from 'framer-motion';

export default function SectionSeparator({
  sectionTitle
}: {
  sectionTitle: string;
}) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        width: '100%'
      }}
    >
      <motion.div
        style={{
          width: '100%',
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'flex-end'
        }}
      >
        <Text
          color={theme.colors.yellow800.value}
          style={{
            fontFamily: 'Alata',
            letterSpacing: 'normal'
          }}
        >
          {sectionTitle}
        </Text>
        <motion.div
          layout
          style={{
            height: '50%',
            borderColor: theme.colors.blue600.value,
            borderTopWidth: 1,
            borderTopStyle: 'solid',
            flex: 1,
            marginLeft: theme.space.md.value,
            marginRight: theme.space.md.value
          }}
        />
      </motion.div>
    </div>
  );
}
