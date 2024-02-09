import { useLexicalComposerContext } from '@lexical/react/LexicalComposerContext';
import { $getRoot } from 'lexical';
import {
  CSSProperties,
  useCallback,
  useState
} from 'react';

export type Props = {
  id?: string;
  style: CSSProperties;
  contenteditable: boolean;
  wsConnected: boolean;
};
// all credit to this GH issue: https://github.com/facebook/lexical/issues/2164
export default function ReadOnlyContentEditable(
  props: Props
): JSX.Element {
  const [editor] = useLexicalComposerContext();
  const [editorLoaded, setEditorLoaded] =
    useState<boolean>(false);
  const ref = useCallback(
    (rootElement: null | HTMLElement) => {
      editor.setRootElement(rootElement);
    },
    [editor]
  );
  editor.registerUpdateListener(() => {
    const editorState = editor.getEditorState();
    editorState.read(() => {
      const root = $getRoot();
      setEditorLoaded(!root.isEmpty());
    });
  });

  return (
    <>
      <div
        // don't allow editing before load
        contentEditable={
          editorLoaded && props.wsConnected
            ? props.contenteditable
            : false
        }
        id={props.id}
        style={props.style}
        ref={ref}
      />
    </>
  );
}
