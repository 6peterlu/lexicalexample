import { Text, useTheme } from '@nextui-org/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { motion } from 'framer-motion';
import { faChevronRight } from '@fortawesome/free-solid-svg-icons/faChevronRight';

export default function SidebarDrawerTitle({
  title,
  expanded,
  action
}: {
  title: string;
  expanded: boolean;
  action?: JSX.Element;
}) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingRight: theme.space.xs.value,
        paddingLeft: theme.space.xs.value,
        paddingTop: theme.space.xs.value,
        paddingBottom: theme.space.xs.value,
        backgroundColor: theme.colors.blue500.value,
        borderBottom: 'none'
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start',
          alignItems: 'center'
        }}
      >
        <div style={{ paddingRight: theme.space.xs.value }}>
          <motion.div
            animate={expanded ? { rotate: 90 } : {}}
          >
            <FontAwesomeIcon
              icon={faChevronRight}
              color={theme.colors.white.value}
            />
          </motion.div>
        </div>
        <Text color={theme.colors.white.value}>
          {title}
        </Text>
      </div>
      {action}
    </div>
  );
}
