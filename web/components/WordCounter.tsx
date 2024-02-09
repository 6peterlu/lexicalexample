import {
  Collapse,
  Text,
  useTheme
} from '@nextui-org/react';
import { useReactiveVar } from '@apollo/client';
import { wordCounterStateVar } from '../cache/cache';
import CollapseWrapper from './CollapseWrapper';

export default function WordCounter() {
  const wordCounterState = useReactiveVar(
    wordCounterStateVar
  );
  const { theme } = useTheme();
  return (
    <Collapse.Group
      style={{
        padding: 0,
        borderBottomStyle: 'solid',
        borderBottomWidth: 0.5,
        borderBottomColor: theme.colors.white.value
      }}
    >
      <CollapseWrapper title='Word counter'>
        <Text>Words: {wordCounterState}</Text>
      </CollapseWrapper>
    </Collapse.Group>
  );
}
