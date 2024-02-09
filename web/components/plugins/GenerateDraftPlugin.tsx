import { useCallback, useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { GENERATE_DRAFT_DIV_ID } from '../../pages/document/[enhancedDocumentID]';
import { Button } from '@nextui-org/react';
import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  $getNodeByKey,
  $getRoot,
  $isTextNode
} from 'lexical';
import { $isCustomListItemNode } from '../nodes/CustomListItemNode';
import { draftEditorContextVar } from '../../cache/cache';

const GENERATE_DRAFT = gql`
  mutation generateDraft(
    $enhancedDocumentID: String!
    $document: String!
  ) {
    generateDraft(
      request: {
        enhancedDocumentID: $enhancedDocumentID
        document: $document
      }
    ) {
      draft
    }
  }
`;

export default function GenerateDraftPlugin({
  enhancedDocumentID
}: {
  enhancedDocumentID: string;
}): JSX.Element {
  const [domReady, setDomReady] = useState(false);
  const [editor] = useLexicalComposerContext();
  const draftEditorContext = useReactiveVar(
    draftEditorContextVar
  );
  const [generateDraft, { loading: draftLoading }] =
    useMutation(GENERATE_DRAFT, {
      variables: {
        enhancedDocumentID,
        document: ''
      }
    });
  const generateDraftOnClickHandler =
    useCallback(async () => {
      const draftEditorState =
        draftEditorContext.getEditorState();
      console.log('draftEditorState', draftEditorState);
      let document = '';
      const editorState = editor.getEditorState();
      editorState.read(() => {
        const root = $getRoot();
        if (!root.isEmpty()) {
          const allNodeKeys = editorState._nodeMap.keys();
          const paragraphHeights: {
            [nodekey: string]: number;
          } = {};
          for (const nodeKey of allNodeKeys) {
            const node = $getNodeByKey(nodeKey);
            if ($isCustomListItemNode(node)) {
              const firstChild = node.getFirstChild();
              if (!firstChild || $isTextNode(firstChild)) {
                const element =
                  editor.getElementByKey(nodeKey);
                paragraphHeights[nodeKey] =
                  element.offsetTop;
                document +=
                  '\n' +
                  '#'.repeat(node.getIndent() + 1) +
                  ' ' +
                  node.getTextContent();
              }
            }
          }
        }
      });
      const response = await generateDraft({
        variables: {
          enhancedDocumentID,
          document
        }
      });
      const responseText =
        response.data.generateDraft.draft;
      // reset other editor
      draftEditorContext.update(() => {
        const root = $getRoot();
        root.clear();
        const selection = root.select();
        const parts = responseText.split(/(\r?\n|\t)/);
        const partsLength = parts.length;
        for (let i = 0; i < partsLength; i++) {
          const part = parts[i];
          if (part === '\n' || part === '\r\n') {
            selection.insertParagraph();
          } else {
            selection.insertText(part);
          }
        }
      });
    }, [
      draftEditorContext,
      editor,
      enhancedDocumentID,
      generateDraft
    ]);
  useEffect(() => {
    setDomReady(true);
  }, []);
  if (!domReady) {
    return null;
  }
  return createPortal(
    <Button
      onClick={generateDraftOnClickHandler}
      disabled={draftLoading}
    >
      {draftLoading ? 'drafting...' : 'Draft for me'}
    </Button>,
    document.getElementById(GENERATE_DRAFT_DIV_ID)
  );
}
