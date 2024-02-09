import { Text, useTheme } from '@nextui-org/react';

export default function TextPlaceholder({
  placeholderText
}: {
  placeholderText: string;
}) {
  const { theme } = useTheme();
  return (
    <div
      style={{
        // same as css above
        position: 'absolute',
        pointerEvents: 'none',
        display: 'flex',
        flexDirection: 'row',
        alignItems: 'center',
        height: '100%'
      }}
    >
      <Text
        weight='bold'
        color={theme.colors.gray500.value}
        size='x-large'
        style={{
          letterSpacing: theme.letterSpacings.normal.value
        }}
      >
        {placeholderText}
      </Text>
    </div>
  );
}
