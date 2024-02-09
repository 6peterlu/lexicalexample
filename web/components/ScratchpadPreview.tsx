import { LexicalComposer } from '@lexical/react/LexicalComposer';
import { Text, useTheme } from '@nextui-org/react';

import { ScratchpadEntry } from '../models/scratchpadEntry';
import { RichTextPlugin } from '@lexical/react/LexicalRichTextPlugin';
import ReadOnlyContentEditable from './editor/ReadOnlyContentEditable';
import { OnChangePlugin } from '@lexical/react/LexicalOnChangePlugin';
import { EditorState } from 'lexical';
import { AutoFocusPlugin } from '@lexical/react/LexicalAutoFocusPlugin';
import { MarkdownShortcutPlugin } from '@lexical/react/LexicalMarkdownShortcutPlugin';
import {
  ORDERED_LIST,
  UNORDERED_LIST
} from '@lexical/markdown';
import { TabIndentationPlugin } from '@lexical/react/LexicalTabIndentationPlugin';
import { HeadingNode, QuoteNode } from '@lexical/rich-text';
import { ListNode, ListItemNode } from '@lexical/list';
import { CodeNode, CodeHighlightNode } from '@lexical/code';
import { AutoLinkNode, LinkNode } from '@lexical/link';
import { gql, useMutation } from '@apollo/client';
import {
  TableCellNode,
  TableNode,
  TableRowNode
} from '@lexical/table';
import { useDebouncedCallback } from 'use-debounce';
import {
  CSSProperties,
  Ref,
  useRef,
  useEffect
} from 'react';
import { ContentEditable } from '@lexical/react/LexicalContentEditable';

function EditorErrorBoundary({
  onError,
  children
}: {
  onError: (error: Error) => void;
  children: JSX.Element;
}) {
  return <>{children}</>;
}
// Catch any errors that occur during Lexical updates and log them
// or throw them as needed. If you don't throw them, Lexical will
// try to recover gracefully without losing user data.
function onError(error: Error) {
  console.error(error);
  throw error;
}
const theme = {
  ltr: 'ltr',
  rtl: 'rtl',
  paragraph: 'editor-paragraph'
};

const customNodes = [
  HeadingNode,
  ListNode,
  ListItemNode,
  QuoteNode,
  CodeNode,
  CodeHighlightNode,
  TableNode,
  TableCellNode,
  TableRowNode,
  AutoLinkNode,
  LinkNode
];

const initialConfig: any = {
  theme,
  onError,
  customNodes
};

const UPDATE_SCRATCHPAD_CONTENT = gql`
  mutation updateScratchpadEntryContent(
    $scratchpadEntryID: String!
    $content: String!
  ) {
    updateScratchpadEntryContent(
      request: {
        scratchpadEntryID: $scratchpadEntryID
        content: $content
      }
    )
  }
`;

export default function ScratchpadPreview({
  scratchpadData,
  autoFocus,
  updateInitialContent
}: {
  scratchpadData: ScratchpadEntry;
  autoFocus: boolean;
  updateInitialContent: (
    scratchpadEntryID: string,
    contentString: string
  ) => void;
}) {
  const { theme } = useTheme();
  const [saveScratchpadContent] = useMutation(
    UPDATE_SCRATCHPAD_CONTENT
  );
  const debouncedUpdateScratchpadEntryContent =
    useDebouncedCallback(async (stringifiedEditorState) => {
      await saveScratchpadContent({
        variables: {
          scratchpadEntryID:
            scratchpadData.scratchpadEntryID,
          content: stringifiedEditorState
        }
      });
    }, 300);
  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        paddingBottom: theme.space.xl.value,
        minHeight: 20
      }}
    >
      <div
        style={{
          backgroundColor: theme.colors.white.value
        }}
      >
        <Text
          style={{
            fontSize: theme.fontSizes['2xl'].value,
            fontFamily: 'Cedarville Cursive',
            fontWeight: 'bold',
            color: theme.colors.blue500.value
          }}
        >
          {scratchpadData.date.toLocaleDateString('en-US', {
            timeZone: 'UTC'
          })}
        </Text>
      </div>
      <div>
        <LexicalComposer
          initialConfig={{
            ...initialConfig,
            editorState: scratchpadData.content
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <RichTextPlugin
              placeholder={null}
              contentEditable={
                <ReadOnlyContentEditable
                  style={{
                    flex: 1,
                    color: theme.colors.black.value,
                    outline: 0
                  }}
                  contenteditable={true}
                  wsConnected={true}
                />
              }
              ErrorBoundary={EditorErrorBoundary}
            />
            <OnChangePlugin
              onChange={(editorState: EditorState) => {
                const stringifiedEditorState =
                  JSON.stringify(editorState);
                debouncedUpdateScratchpadEntryContent(
                  stringifiedEditorState
                );
                updateInitialContent(
                  scratchpadData.scratchpadEntryID,
                  stringifiedEditorState
                );
              }}
              ignoreSelectionChange
            />
            {autoFocus && <AutoFocusPlugin />}
            {/* <MarkdownShortcutPlugin
              transformers={[ORDERED_LIST, UNORDERED_LIST]}
            /> */}
            <TabIndentationPlugin />
          </div>
        </LexicalComposer>
      </div>
    </div>
  );
}
