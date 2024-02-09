import { useReactiveVar } from '@apollo/client';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $createRangeSelection,
  $createTextNode,
  $getRoot,
  $getSelection,
  $isElementNode,
  $isRangeSelection,
  EditorState,
  LexicalEditor
} from 'lexical';
import { useEffect, useState } from 'react';
import {
  currentDocumentVar,
  currentEditorModeVar,
  analyticsLayerStateVar
} from '../../../cache/cache';
import {
  $wrapSelectionInAnalyticsNode,
  AnalyticsType
} from '../../nodes/AnalyticsNode';
import { universalIndex } from '../../../utils/lexical';
import { EditorModes } from '../../EditorModeMenu';
import { getAnalyticsHighlights } from './analyticsHighlighter';

function highlightAnalytics(editor: LexicalEditor) {
  editor.update(() => {
    const root = $getRoot();
    // comments in this block: used for pre-universal index highlighting
    for (const node of root.getChildren()) {
      if (
        node.getType() === 'paragraph' &&
        $isElementNode(node)
      ) {
        const textContent = node.getTextContent();
        const matches = getAnalyticsHighlights(textContent);
        for (const match of matches.long) {
          const anchor = universalIndex(match.anchor, node);
          const focus = universalIndex(match.focus, node);
          const rangeSelection = $createRangeSelection();
          rangeSelection.anchor.offset = anchor.index;
          rangeSelection.anchor.key = anchor.nodeKey;
          rangeSelection.anchor.type = 'text';
          rangeSelection.focus.offset = focus.index;
          rangeSelection.focus.key = focus.nodeKey;
          rangeSelection.focus.type = 'text';
          $wrapSelectionInAnalyticsNode(
            rangeSelection,
            false,
            AnalyticsType.LONG_SENTENCE
          );
        }
        for (const match of matches.medium) {
          const anchor = universalIndex(match.anchor, node);
          const focus = universalIndex(match.focus, node);
          const rangeSelection = $createRangeSelection();
          rangeSelection.anchor.offset = anchor.index;
          rangeSelection.anchor.key = anchor.nodeKey;
          rangeSelection.anchor.type = 'text';
          rangeSelection.focus.offset = focus.index;
          rangeSelection.focus.key = focus.nodeKey;
          rangeSelection.focus.type = 'text';
          $wrapSelectionInAnalyticsNode(
            rangeSelection,
            false,
            AnalyticsType.MEDIUM_SENTENCE
          );
        }
        for (const match of matches.short) {
          const anchor = universalIndex(match.anchor, node);
          const focus = universalIndex(match.focus, node);
          const rangeSelection = $createRangeSelection();
          rangeSelection.anchor.offset = anchor.index;
          rangeSelection.anchor.key = anchor.nodeKey;
          rangeSelection.anchor.type = 'text';
          rangeSelection.focus.offset = focus.index;
          rangeSelection.focus.key = focus.nodeKey;
          rangeSelection.focus.type = 'text';
          $wrapSelectionInAnalyticsNode(
            rangeSelection,
            false,
            AnalyticsType.SHORT_SENTENCE
          );
        }
      }
    }
  });
}

export default function AnalyticsPlugin() {
  const [editor] = useLexicalComposerContext();
  const editorState = useReactiveVar(
    analyticsLayerStateVar
  );
  useEffect(() => {
    highlightAnalytics(editor);
  }, [editorState, editor]);
  return <></>;
}
