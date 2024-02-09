import { useReactiveVar } from '@apollo/client';
import { Text, useTheme } from '@nextui-org/react';
import dayjs from 'dayjs';
import { useRouter } from 'next/router';
import { selectedDocumentIDVar } from '../cache/cache';
import useMediaQuery from '../hooks/useMediaQuery';
import { DocumentMetadata } from '../models/document';
import { convertPxStringToNumber } from '../utils/string';

export default function DocumentList({
  documents
}: {
  documents: DocumentMetadata[];
}) {
  const selectedDocumentID = useReactiveVar(
    selectedDocumentIDVar
  );
  const router = useRouter();
  const { theme } = useTheme();
  const isDesktop = useMediaQuery(
    convertPxStringToNumber(theme.breakpoints.sm.value)
  );
  if (documents.length === 0) {
    return (
      <Text size={isDesktop ? 'medium' : 'small'}>
        No documents yet!
      </Text>
    );
  }
  return (
    <>
      {documents.map((d) => {
        const selected =
          d.documentID === selectedDocumentID;
        const lastOpenedDocumentVersionName =
          d.documentVersions.filter(
            (dv) =>
              dv.documentVersionID ===
              d.lastOpenedDocumentVersionID
          )[0]?.versionName ??
          d.documentVersions[0].versionName;
        return (
          <div
            key={`documentlist-${d.documentID}`}
            style={{
              display: 'flex',
              flexDirection: 'row',
              paddingRight: isDesktop
                ? theme.space.sm.value
                : 0,
              paddingLeft: isDesktop
                ? theme.space.sm.value
                : 0,
              paddingBottom: theme.space.xs.value,
              paddingTop: theme.space.xs.value,
              ...(selected
                ? {
                    backgroundColor:
                      theme.colors.yellow100.value
                  }
                : {})
            }}
            onClick={() => {
              selectedDocumentIDVar(d.documentID);
            }}
            onDoubleClick={() => {
              router.push(
                `/document/${d.documentID}/${lastOpenedDocumentVersionName}`
              );
            }}
            onBlur={() => {
              selectedDocumentIDVar(null);
            }}
            tabIndex={0}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flex: 1
              }}
            >
              <Text
                style={{
                  lineHeight: theme.lineHeights.sm.value,
                  userSelect: 'none'
                }}
                size={isDesktop ? 'medium' : 'small'}
              >
                {d.title ? d.title : 'Untitled document'}
              </Text>
              <div
                style={{
                  flex: 1,
                  borderBottomColor: 'black',
                  borderBottomStyle: 'dotted',
                  borderBottomWidth: 2,
                  marginBottom:
                    ((parseFloat(
                      theme.lineHeights.sm.value
                    ) -
                      parseFloat(
                        theme.fontSizes.md.value
                      )) *
                      // * 16 to convert from rem to px
                      8) /
                    // / 2 because space is present on the top and bottom of the line
                    2,
                  marginLeft: 8,
                  marginRight: 8
                }}
              />
            </div>
            <Text
              style={{
                lineHeight: theme.lineHeights.sm.value,
                userSelect: 'none'
              }}
              size={isDesktop ? 'medium' : 'small'}
            >
              {dayjs(d.updatedAt).format(
                isDesktop ? 'M/D/YYYY, h:mm A' : 'M/D/YYYY'
              )}
            </Text>
          </div>
        );
      })}
    </>
  );
}
