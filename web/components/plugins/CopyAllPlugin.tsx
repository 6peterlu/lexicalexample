import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  Button,
  Tooltip,
  useTheme
} from '@nextui-org/react';
import { createPortal } from 'react-dom';
import { faCopy } from '@fortawesome/free-regular-svg-icons/faCopy';
import { useCallback, useEffect, useState } from 'react';
import { COPY_ALL_DIV_ID } from '../../pages/document/[enhancedDocumentID]';
import { motion } from 'framer-motion';
import { $generateHtmlFromNodes } from '@lexical/html';
import { $getRoot, LexicalEditor } from 'lexical';
// import { $getLexicalContent } from '@lexical/clipboard';

export default function CopyAllPlugin(): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [domReady, setDomReady] = useState(false);
  const { theme } = useTheme();
  useEffect(() => {
    setDomReady(true);
  }, []);
  const copyAllToClipboard = useCallback(() => {
    editor.getEditorState().read(() => {
      const htmlString = $generateHtmlFromNodes(editor);
      const root = $getRoot();
      const plainText = root.getTextContent();

      if (htmlString !== null) {
        navigator.clipboard.write([
          new ClipboardItem({
            'text/html': new Blob([htmlString], {
              type: 'text/html'
            }),
            'text/plain': new Blob([plainText], {
              type: 'text/plain'
            })
          })
        ]);
      }
    });
  }, [editor]);
  if (!domReady) {
    return null;
  }
  return createPortal(
    <Tooltip trigger='click' content='copied!'>
      <motion.div
        whileHover={{
          backgroundColor: theme.colors.black.value,
          color: theme.colors.white.value
        }}
        style={{
          paddingLeft: 2,
          paddingRight: 2,
          cursor: 'pointer'
        }}
        onClick={() => copyAllToClipboard()}
      >
        <FontAwesomeIcon icon={faCopy} />
      </motion.div>
    </Tooltip>,
    document.getElementById(COPY_ALL_DIV_ID)
  );
}
