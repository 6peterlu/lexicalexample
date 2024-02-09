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

const CREATE_DOCUMENT_VERSION = gql`
  mutation createDocumentVersion(
    $sourceDocumentVersionID: String!
    $versionName: String!
  ) {
    createDocumentVersion(
      request: {
        sourceDocumentVersionID: $sourceDocumentVersionID
        versionName: $versionName
      }
    ) {
      createdAt
      versionName
      documentVersionID
    }
  }
`;

export default function CreateDocumentVersionModal({
  modalOpen,
  setModalOpen
}: {
  modalOpen: boolean;
  setModalOpen: (newOpenValue: boolean) => void;
}) {
  const [createDocumentVersion] = useMutation(
    CREATE_DOCUMENT_VERSION
  );
  const currentDocumentID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const [versionName, setVersionName] =
    useState<string>('');
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
        <Text h3>Create new document version</Text>
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
            onClick={async () => {
              if (versionName) {
                const documentVersionResponse =
                  await createDocumentVersion({
                    variables: {
                      sourceDocumentVersionID:
                        currentDocumentID.documentVersionID,
                      versionName
                    }
                  });
                // refresh document version list
                const newCurrentDocument =
                  currentDocumentData.clone();
                newCurrentDocument.documentVersions = [
                  documentVersionResponse.data
                    .createDocumentVersion,
                  ...currentDocumentData.documentVersions
                ];
                currentDocumentVar(newCurrentDocument);
                router.push(
                  `/document/${currentDocumentID.documentID}/${versionName}`
                );
                setVersionName('');
                setModalOpen(false);
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
