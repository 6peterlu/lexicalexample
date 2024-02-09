/**
 * Copyright (c) Meta Platforms, Inc. and affiliates.
 *
 * This source code is licensed under the MIT license found in the
 * LICENSE file in the root directory of this source tree.
 *
 */

import type { LexicalEditor, NodeKey } from 'lexical';

import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $isDecoratorBlockNode } from '@lexical/react/LexicalDecoratorBlockNode';
import {
  $createHeadingNode,
  $createQuoteNode,
  $isHeadingNode,
  HeadingTagType
} from '@lexical/rich-text';
import {
  $getSelectionStyleValueForProperty,
  $isParentElementRTL,
  $patchStyleText,
  $selectAll
} from '@lexical/selection';
import {
  $findMatchingParent,
  $getNearestBlockElementAncestorOrThrow,
  $getNearestNodeOfType,
  mergeRegister
} from '@lexical/utils';
import {
  $getNodeByKey,
  $getRoot,
  $getSelection,
  $isRangeSelection,
  $isTextNode,
  CAN_REDO_COMMAND,
  CAN_UNDO_COMMAND,
  COMMAND_PRIORITY_CRITICAL,
  FORMAT_ELEMENT_COMMAND,
  FORMAT_TEXT_COMMAND,
  INDENT_CONTENT_COMMAND,
  OUTDENT_CONTENT_COMMAND,
  REDO_COMMAND,
  SELECTION_CHANGE_COMMAND,
  UNDO_COMMAND
} from 'lexical';
import { useCallback, useEffect, useState } from 'react';
import * as React from 'react';
import catTypingGif from '../../images/cat-typing.gif';
import { Button, Text, useTheme } from '@nextui-org/react';
import { createPortal } from 'react-dom';

import { CREATE_HEADER_COMMAND } from '../editor/Editor';
import { HeaderNode } from '../nodes/HeaderNode';

export const CAN_USE_DOM: boolean =
  typeof window !== 'undefined' &&
  typeof window.document !== 'undefined' &&
  typeof window.document.createElement !== 'undefined';

export const IS_APPLE: boolean =
  CAN_USE_DOM &&
  /Mac|iPod|iPhone|iPad/.test(navigator.platform);

const blockTypeToBlockName = {
  bullet: 'Bulleted List',
  check: 'Check List',
  code: 'Code Block',
  h1: 'Heading 1',
  h2: 'Heading 2',
  h3: 'Heading 3',
  h4: 'Heading 4',
  h5: 'Heading 5',
  h6: 'Heading 6',
  number: 'Numbered List',
  paragraph: 'Normal',
  quote: 'Quote'
};

export default function ToolbarPlugin({
  style
}: {
  style?: React.CSSProperties;
}): JSX.Element {
  const boxRef = React.useRef<HTMLDivElement>();
  const [editor] = useLexicalComposerContext();
  const [activeEditor, setActiveEditor] = useState(editor);

  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [isUnderline, setIsUnderline] = useState(false);
  const [isStrikethrough, setIsStrikethrough] =
    useState(false);
  const [domReady, setDomReady] = React.useState(false);
  const { theme } = useTheme();

  const updateToolbar = useCallback(() => {
    const selection = $getSelection();
    if ($isRangeSelection(selection)) {
      // Update text format
      setIsBold(selection.hasFormat('bold'));
      setIsItalic(selection.hasFormat('italic'));
      setIsUnderline(selection.hasFormat('underline'));
      setIsStrikethrough(
        selection.hasFormat('strikethrough')
      );
    }
  }, []);

  useEffect(() => {
    return editor.registerCommand(
      SELECTION_CHANGE_COMMAND,
      (_payload, newEditor) => {
        updateToolbar();
        setActiveEditor(newEditor);
        return false;
      },
      COMMAND_PRIORITY_CRITICAL
    );
  }, [editor, updateToolbar]);

  useEffect(() => {
    return mergeRegister(
      activeEditor.registerUpdateListener(
        ({ editorState }) => {
          editorState.read(() => {
            updateToolbar();
          });
        }
      )
    );
  }, [activeEditor, editor, updateToolbar]);

  const applyStyleText = useCallback(
    (styles: Record<string, string>) => {
      activeEditor.update(() => {
        const selection = $getSelection();
        if ($isRangeSelection(selection)) {
          $patchStyleText(selection, styles);
        }
      });
    },
    [activeEditor]
  );

  const clearFormatting = useCallback(() => {
    activeEditor.update(() => {
      const selection = $getSelection();
      if ($isRangeSelection(selection)) {
        $selectAll(selection);
        selection.getNodes().forEach((node) => {
          if ($isTextNode(node)) {
            node.setFormat(0);
            node.setStyle('');
            $getNearestBlockElementAncestorOrThrow(
              node
            ).setFormat('');
          }
          if ($isDecoratorBlockNode(node)) {
            node.setFormat('');
          }
        });
      }
    });
  }, [activeEditor]);

  // wait for document divs to load
  React.useEffect(() => {
    setDomReady(true);
  }, []);

  // calculate toolbar position
  useEffect(() => {
    if (domReady) {
      const editorViewport = document.getElementById(
        'editor-viewport'
      );
      boxRef.current.style.left = `${editorViewport.offsetLeft}px`;
      boxRef.current.style.top = `${
        editorViewport.offsetTop - 50
      }px`;
    }
  }, [domReady]);

  if (!domReady) {
    return null;
  }

  return createPortal(
    <div
      style={{
        ...style
      }}
      ref={boxRef}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          alignItems: 'center',
          height: 44,
          paddingLeft: 12
        }}
      >
        <Button
          onClick={() => {
            activeEditor.dispatchCommand(
              FORMAT_TEXT_COMMAND,
              'bold'
            );
          }}
          style={{ height: 32, width: 32, minWidth: 0 }}
          light
          size='sm'
        >
          {<Text weight='bold'>B</Text>}
        </Button>
        <Button
          onClick={() => {
            activeEditor.dispatchCommand(
              FORMAT_TEXT_COMMAND,
              'italic'
            );
          }}
          style={{
            height: 32,
            width: 32,
            minWidth: 0
          }}
          light
        >
          {
            <Text
              style={{
                fontStyle: 'italic',
                transform: 'translateX(-1px)'
              }}
            >
              I
            </Text>
          }
        </Button>
        <Button
          onClick={() => {
            activeEditor.dispatchCommand(
              FORMAT_TEXT_COMMAND,
              'underline'
            );
          }}
          style={{ height: 32, width: 32, minWidth: 0 }}
          light
          size='sm'
        >
          {
            <Text style={{ textDecoration: 'underline' }}>
              U
            </Text>
          }
        </Button>
      </div>
    </div>,
    document.getElementById('toolbar-container')
  );
}
