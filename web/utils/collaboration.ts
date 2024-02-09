import { WebsocketProvider } from 'y-websocket';
import { Provider } from '@lexical/yjs';
import { Doc } from 'yjs';
import { useCallback, useState } from 'react';

export const useWebsocketProvider = (): {
  wsProviderFactory: (
    id: string,
    yjsDocMap: Map<string, Doc>
  ) => Provider;
  connected: boolean;
} => {
  const [connected, setConnected] = useState(false);
  const wsProviderFactory = useCallback(
    (id: string, yjsDocMap: Map<string, Doc>) => {
      let doc = yjsDocMap.get(id);

      if (doc === undefined) {
        doc = new Doc();
        yjsDocMap.set(id, doc);
      } else {
        doc.load();
      }
      yjsDocMap.set(id, doc);
      const wsProvider = new WebsocketProvider(
        process.env.NEXT_PUBLIC_WEBSOCKET_ENDPOINT,
        id,
        doc,
        {
          connect: false
        }
      );
      wsProvider.on(
        'status',
        (event: { status: string }) => {
          if (event.status === 'disconnected') {
            console.error('WEBSOCKET WAS DISCONNECTED', id);
            setConnected(false);
          } else if (event.status === 'connected') {
            setConnected(true);
          }
        }
      );
      return wsProvider;
    },
    []
  );

  // @ts-ignore
  return { wsProviderFactory, connected };
};
