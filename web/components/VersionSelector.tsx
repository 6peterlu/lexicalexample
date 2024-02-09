import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import {
  Button,
  Dropdown,
  Input,
  Loading,
  Modal,
  Text,
  useTheme
} from '@nextui-org/react';
import {
  Key,
  ReactElement,
  useState,
  version
} from 'react';
import {
  commentsVar,
  currentDocumentVar,
  currentDocumentVersionIDVar
} from '../cache/cache';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import CreateDocumentVersionModal from './CreateDocumentVersionModal';
import RenameDocumentVersionModal from './RenameDocumentVersionModal';

enum ActionKeys {
  NewDocumentKey = 'NEW_DOCUMENT_KEY',
  Delete = 'DELETE',
  RenameDocumentVersion = 'RENAME_DOCUMENT_VERSION'
}

const DELETE_DOCUMENT_VERSION = gql`
  mutation deleteDocumentVersion(
    $documentVersionID: String!
  ) {
    deleteDocumentVersion(
      request: { documentVersionID: $documentVersionID }
    )
  }
`;

export default function VersionSelector({
  children
}: {
  children: ReactElement;
}) {
  const currentDocumentID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const currentDocumentData = useReactiveVar(
    currentDocumentVar
  );
  const router = useRouter();
  const { theme } = useTheme();
  const hoverStyle = {
    boxShadow: `2px 2px ${theme.colors.gray500.value}`,
    translateX: -2,
    translateY: -2,
    border: '0.5 0.5 0.1 0.1 solid black',
    backgroundColor: 'white'
  };
  const [dropdownOpen, setDropdownOpen] =
    useState<boolean>(false);
  const [
    createDocumentVersionModalOpen,
    setCreateDocumentVersionModalOpen
  ] = useState<boolean>(false);
  const [
    renameDocumentVersionModalOpen,
    setRenameDocumentVersionModalOpen
  ] = useState<boolean>(false);
  const [deleteDocumentVersion] = useMutation(
    DELETE_DOCUMENT_VERSION,
    {
      variables: {
        documentVersionID:
          currentDocumentID.documentVersionID
      }
    }
  );
  if (!currentDocumentID || !currentDocumentData) {
    return <Loading />;
  }

  return (
    <>
      <Dropdown
        onOpenChange={(isOpen) => {
          setDropdownOpen(isOpen);
        }}
        closeOnSelect
        shouldCloseOnBlur={true}
      >
        <Dropdown.Trigger>
          <motion.div
            key={`versionselectordropdowntrigger-${dropdownOpen}`}
            style={{
              paddingLeft: 10,
              paddingRight: 10,
              display: 'flex',
              flexDirection: 'row',
              alignItems: 'center',
              borderRadius: 10,
              cursor: 'pointer',
              ...(dropdownOpen ? hoverStyle : {})
            }}
            whileHover={hoverStyle}
            transition={{ ease: 'easeOut' }}
          >
            {children}
          </motion.div>
        </Dropdown.Trigger>
        <Dropdown.Menu
          onSelectionChange={async (keys: Set<Key>) => {
            const key = keys.values().next().value;
            switch (key) {
              case ActionKeys.NewDocumentKey:
                setCreateDocumentVersionModalOpen(true);
                break;
              case ActionKeys.RenameDocumentVersion:
                setRenameDocumentVersionModalOpen(true);
                break;
              case ActionKeys.Delete:
                await deleteDocumentVersion();
                // go to live version
                // TODO: needs to go to whatever version the user has access to
                router.push(
                  `/document/${currentDocumentID.documentID}/live`
                );
                break;
              default:
                commentsVar([]);
                router.push(
                  `/document/${currentDocumentID.documentID}/${key}`
                );
            }
          }}
          selectionMode='single'
          selectedKeys={[
            currentDocumentID.versionName ?? 'live'
          ]}
        >
          <Dropdown.Section>
            {currentDocumentData.documentVersions.map(
              (dv) => {
                if (!dv.versionName) {
                  return null;
                }
                return (
                  <Dropdown.Item key={dv.versionName}>
                    {dv.versionName}
                  </Dropdown.Item>
                );
              }
            )}
          </Dropdown.Section>
          <Dropdown.Item
            withDivider
            key={ActionKeys.NewDocumentKey}
            color='primary'
          >
            Create new version
          </Dropdown.Item>
          <Dropdown.Item
            key={ActionKeys.RenameDocumentVersion}
            color='primary'
          >
            Rename
          </Dropdown.Item>
          {currentDocumentID.versionName && (
            <Dropdown.Item
              withDivider
              key={ActionKeys.Delete}
              color='error'
            >
              Delete
            </Dropdown.Item>
          )}
        </Dropdown.Menu>
      </Dropdown>
      <CreateDocumentVersionModal
        modalOpen={createDocumentVersionModalOpen}
        setModalOpen={setCreateDocumentVersionModalOpen}
      />
      <RenameDocumentVersionModal
        modalOpen={renameDocumentVersionModalOpen}
        setModalOpen={setRenameDocumentVersionModalOpen}
      />
    </>
  );
}
