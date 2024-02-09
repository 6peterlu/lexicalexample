import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import { useEffect } from 'react';
import { useDebouncedCallback } from 'use-debounce';

export default function DebouncedSavePlugin({
  saveMutation,
  variables,
  contentArgName
}: {
  saveMutation: (variables: any) => void;
  variables: any;
  contentArgName: string;
}): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const debouncedSave = useDebouncedCallback(
    saveMutation,
    300
  );
  useEffect(() => {
    editor.registerTextContentListener(() => {
      debouncedSave({
        variables: {
          ...variables,
          [contentArgName]: JSON.stringify(
            editor.getEditorState()
          )
        }
      });
    });
  }, [editor, debouncedSave, variables, contentArgName]);
  return null;
}
