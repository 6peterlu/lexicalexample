import { Button } from '@nextui-org/react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTableCellsLarge } from '@fortawesome/free-solid-svg-icons/faTableCellsLarge';
import {
  faPenToSquare
} from '@fortawesome/free-regular-svg-icons/faPenToSquare';
import { faList } from '@fortawesome/free-solid-svg-icons/faList';
import { useRouter } from 'next/router';
import {
  gql,
  useMutation,
  useReactiveVar
} from '@apollo/client';
import { currentNoteVar, notesVar } from '../cache/cache';
import { Dispatch, SetStateAction, useEffect } from 'react';
import { motion } from 'framer-motion';

const CREATE_NOTE = gql`
  mutation createNote {
    createNote {
      note {
        title
        noteID
      }
    }
  }
`;

export default function HomeNavigationBar({
  displayState,
  setDisplayState
}: {
  displayState: string;
  setDisplayState: Dispatch<
    SetStateAction<'list' | 'grid'>
  >;
}) {
  const router = useRouter();
  const [
    createNote,
    {
      loading: notesMutationLoading,
      error: notesMutationError,
      data: notesMutationData
    }
  ] = useMutation(CREATE_NOTE);

  function toggleDisplayState() {
    if (displayState === 'list') {
      setDisplayState('grid');
    } else {
      setDisplayState('list');
    }
  }

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        justifyContent: 'space-between'
      }}
    >
      <Button
        auto
        icon={
          <FontAwesomeIcon
            icon={
              displayState === 'grid'
                ? faList
                : faTableCellsLarge
            }
            size='2x'
          />
        }
        light
        color='primary'
        onClick={toggleDisplayState}
      />
      <Button
        auto
        icon={
          <FontAwesomeIcon icon={faPenToSquare} size='2x' />
        }
        light
        color='primary'
        onClick={async () => {
          const response = await createNote();
          notesVar([
            ...notesVar(),
            response.data.createNote.note
          ]);
          // navigate to newly created note page
          router.push(
            `notes/${response.data.createNote.note.noteID}`
          );
        }}
      />
    </div>
  );
}
