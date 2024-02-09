import { Text, useTheme } from '@nextui-org/react';
import useMediaQuery from '../hooks/useMediaQuery';
import { DocumentMetadata } from '../models/document';
import { convertPxStringToNumber } from '../utils/string';
import DocumentList from './DocumentList';

export function ContentsSection({
  title,
  documents
}: {
  title: string;
  documents: DocumentMetadata[];
}) {
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  return (
    <>
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          justifyContent: 'flex-start'
        }}
      >
        <div
          style={{
            marginTop: theme.space['2xl'].value,
            marginBottom: theme.space.sm.value,
            borderBottomWidth:
              theme.borderWeights.bold.value,
            borderBottomColor: theme.colors.blue600.value,
            borderBottomStyle: 'solid',
            paddingRight: isDesktop
              ? theme.space.sm.value
              : theme.space.xs.value,
            paddingLeft: isDesktop
              ? theme.space.sm.value
              : theme.space.xs.value
          }}
        >
          <Text
            style={{
              fontWeight: theme.fontWeights.bold.value,
              color: theme.colors.blue600.value,
              letterSpacing:
                theme.letterSpacings.normal.value
            }}
            size={isDesktop ? '$2xl' : 'medium'}
          >
            {title}
          </Text>
        </div>
      </div>
      <DocumentList documents={documents} />
    </>
  );
}
