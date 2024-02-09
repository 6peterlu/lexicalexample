import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import {
  COMMAND_PRIORITY_CRITICAL,
  CUT_COMMAND,
  FORMAT_TEXT_COMMAND,
  PASTE_COMMAND
} from 'lexical';
import { useEffect } from 'react';

export default function DisableKeyboardShortcutsPlugin(): null {
  const [editor] = useLexicalComposerContext();
  useEffect(() => {
    return () => {
      editor.registerCommand(
        FORMAT_TEXT_COMMAND,
        () => true,
        COMMAND_PRIORITY_CRITICAL
      );
      editor.registerCommand(
        CUT_COMMAND,
        () => true,
        COMMAND_PRIORITY_CRITICAL
      );
      editor.registerCommand(
        PASTE_COMMAND,
        () => true,
        COMMAND_PRIORITY_CRITICAL
      );
    };
  }, [editor]);
  return null;
}
