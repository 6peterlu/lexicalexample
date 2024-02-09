import { useReactiveVar } from '@apollo/client';
import { Card, Text, useTheme } from '@nextui-org/react';
import { wordCounterStateVar } from '../cache/cache';

export default function WordCounterCard() {
  const { theme } = useTheme();
  const wordCounterState = useReactiveVar(
    wordCounterStateVar
  );
  if (wordCounterState === null) {
    return null;
  }
  return (
    <Card>
      <Card.Header
        css={{
          backgroundColor: theme.colors.blue500.value,
          color: 'white'
        }}
      >
        Word counter
      </Card.Header>
      <Card.Body css={{ paddingTop: 6, paddingBottom: 6 }}>
        <Text>Words: {wordCounterState}</Text>
      </Card.Body>
    </Card>
  );
}
