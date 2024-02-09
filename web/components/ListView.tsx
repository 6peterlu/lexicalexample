import { gql, useReactiveVar } from '@apollo/client';
import { Table } from '@nextui-org/react';
import { motion } from 'framer-motion';
import { useRouter } from 'next/router';
import { Note } from '../generated/types/graphql';
import { notesVar } from '../cache/cache';

export const GET_CACHED_NOTES = gql`
  query getCachedNotes {
    notes @client
  }
`;

export default function ListView({
  onSelectionChange
}: {
  onSelectionChange: (arg: any) => void;
}) {
  const notes = useReactiveVar(notesVar);
  const router = useRouter();
  return (
    <div
      style={{
        flex: 1
      }}
    >
      <Table
        selectionMode='single'
        // the error here got fixed in https://github.com/nextui-org/nextui/pull/564 but that hasn't been relased yet.
        onSelectionChange={onSelectionChange}
      >
        <Table.Header>
          <Table.Column>Notes</Table.Column>
        </Table.Header>

        <Table.Body>
          {notes.map((note: Note, index: number) => {
            return (
              <Table.Row key={note.noteID}>
                <Table.Cell>
                  <motion.div
                    initial={{ x: 100, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{
                      ease: 'easeOut',
                      duration: 0.5,
                      delay: (0.3 * index) / notes.length
                    }}
                  >
                    {note.title || 'Untitled'}
                  </motion.div>
                </Table.Cell>
              </Table.Row>
            );
          })}
        </Table.Body>
      </Table>
    </div>
  );
}
