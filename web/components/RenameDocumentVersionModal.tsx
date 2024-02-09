import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import {
  Button,
  Input,
  Modal,
  Text
} from '@nextui-org/react';
import { useRouter } from 'next/router';
import { useState } from 'react';
import {
  currentDocumentVar,
  currentDocumentVersionIDVar
} from '../cache/cache';

const RENAME_DOCUMENT_VERSION = gql`
  mutation renameDocumentVersion(
    $documentVersionID: String!
    $versionName: String!
  ) {
    renameDocumentVersion(
      request: {
        documentVersionID: $documentVersionID
        versionName: $versionName
      }
    )
  }
`;

export default function RenameDocumentVersionModal({
  modalOpen,
  setModalOpen
}: {
  modalOpen: boolean;
  setModalOpen: (modalOpenValue: boolean) => void;
}) {
  const [versionName, setVersionName] =
    useState<string>('');
  const [renameDocumentVersion] = useMutation(
    RENAME_DOCUMENT_VERSION
  );
  const documentDualID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const currentDocumentData = useReactiveVar(
    currentDocumentVar
  );
  const router = useRouter();
  return (
    <Modal
      width='500px'
      blur
      open={modalOpen}
      onClose={() => {
        setModalOpen(false);
      }}
      visible={modalOpen}
    >
      <Modal.Header>
        <Text h3>Rename document version</Text>
      </Modal.Header>
      <Modal.Body>
        <div
          style={{ display: 'flex', flexDirection: 'row' }}
        >
          <div style={{ flex: 1 }}>
            <Input
              placeholder='Version Name'
              onChange={(e) => {
                setVersionName(e.target.value as string);
              }}
              value={versionName}
              fullWidth
            />
          </div>
          <Button
            disabled={!versionName}
            onClick={async () => {
              if (versionName) {
                await renameDocumentVersion({
                  variables: {
                    documentVersionID:
                      documentDualID.documentVersionID,
                    versionName
                  }
                });
                const updatedDocumentData =
                  currentDocumentData.clone();
                for (const dv of updatedDocumentData.documentVersions) {
                  if (
                    dv.documentVersionID ===
                    documentDualID.documentVersionID
                  ) {
                    dv.versionName = versionName;
                    break;
                  }
                }
                currentDocumentVar(updatedDocumentData);
                setVersionName('');
                setModalOpen(false);
                router.replace(
                  `/document/${documentDualID.documentID}/${versionName}`
                );
              }
            }}
          >
            Create
          </Button>
        </div>
      </Modal.Body>
    </Modal>
  );
}
