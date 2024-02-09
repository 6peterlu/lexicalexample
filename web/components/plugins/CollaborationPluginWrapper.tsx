import { CollaborationPlugin } from '@lexical/react/LexicalCollaborationPlugin';
import { EditorState } from 'lexical';
import { Provider } from '@lexical/yjs';
import type { Doc } from 'yjs';

interface IProps {
  id: string;
  providerFactory: (
    id: string,
    yjsDocMap: Map<string, Doc>
  ) => Provider;
  shouldBootstrap: boolean;
  username?: string;
  initialEditorState: EditorState;
}

const CollaborationPluginWrapper = (props: IProps) => {
  return <CollaborationPlugin {...props} />;
};

export default CollaborationPluginWrapper;
