import { useReactiveVar } from '@apollo/client';
import {
  Loading,
  Popover,
  Text,
  useTheme
} from '@nextui-org/react';
import {
  OutlineState,
  activeDocumentHeaderVar,
  currentDocumentVersionContentVar,
  headerHeightsVar
} from '../cache/cache';
import { motion } from 'framer-motion';
import { useMemo, useState } from 'react';
import { getOutlineStateFromEditorState } from '../utils/lexical';
import { hashCode } from '../utils/string';

export default function DocumentHeader({
  nodeKey,
  title,
  description
}: {
  nodeKey: string;
  title: string;
  description: string[];
}) {
  const { theme } = useTheme();
  const headerHeights = useReactiveVar(headerHeightsVar);
  const activeDocumentHeader = useReactiveVar(
    activeDocumentHeaderVar
  );
  const currentDocumentContent = useReactiveVar(
    currentDocumentVersionContentVar
  );
  const outlineState = useMemo<OutlineState[]>(() => {
    if (!currentDocumentContent) return;
    return getOutlineStateFromEditorState(
      currentDocumentContent
    );
  }, [currentDocumentContent]);
  const nodeIndex = useMemo(() => {
    if (!outlineState) return;
    return outlineState.findIndex(
      (outline) => outline.key === nodeKey
    );
  }, [outlineState, nodeKey]);
  const [hover, setHover] = useState(false);
  const onHover = () => {
    setHover(true);
  };

  const onLeave = () => {
    setHover(false);
  };

  return (
    <Popover
      placement='left-top'
      isOpen={nodeKey === activeDocumentHeader}
      shouldCloseOnInteractOutside={() => {
        return false;
      }}
    >
      <Popover.Trigger>
        <motion.div
          layout='position'
          transition={{ duration: 0.2, ease: 'easeOut' }}
          style={{
            backgroundColor: theme.colors.blue100.value,
            position: 'absolute',
            borderTopRightRadius: 14,
            borderBottomRightRadius: 14,
            top: headerHeights[nodeKey],
            cursor: 'pointer',
            // paddingTop: 5,
            left: 0,
            zIndex: -1,
            height: 28,
            minWidth: 0,
            paddingRight: 10,
            paddingLeft: 5
          }}
          onMouseEnter={onHover}
          onMouseLeave={onLeave}
          onClick={() => {
            if (nodeKey !== activeDocumentHeader) {
              activeDocumentHeaderVar(nodeKey);
            } else {
              activeDocumentHeaderVar(null);
            }
          }}
        >
          <motion.p
            layout='position'
            style={{ fontSize: theme.fontSizes.sm.value }}
          >
            {nodeIndex + 1}
            {hover && (
              <span
                style={{
                  fontSize: 8
                }}
              >{`/${outlineState.length}`}</span>
            )}
          </motion.p>
        </motion.div>
      </Popover.Trigger>
      <Popover.Content>
        <div style={{ padding: theme.space.sm.value }}>
          <Text color='#5D8298' weight='bold'>
            {nodeIndex + 1}: {title}
          </Text>
          <ul style={{ listStyleType: 'disc' }}>
            {description.map((d: string) => (
              <li color='#5D8298' key={hashCode(d)}>
                {d}
              </li>
            ))}
          </ul>
        </div>
      </Popover.Content>
    </Popover>
  );
}
