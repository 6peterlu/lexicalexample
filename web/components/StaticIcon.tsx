import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Note } from '../generated/types/graphql';

export default function StaticIcon({
  animate,
  note
}: {
  animate: boolean;
  note: Note;
}) {
  const router = useRouter();
  return (
    <motion.div
      style={{
        width: '17vw',
        height: '17vw',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: 'pink',
        margin: '10px',
        borderRadius: 5
      }}
      layout
      animate={
        animate
          ? {
              rotate: [0, -2, 0, 2, 0]
            }
          : { rotate: 0 }
      }
      transition={
        animate
          ? {
              repeat: Infinity,

              repeatType: 'loop',
              duration: 0.25,
              ease: 'linear'
            }
          : null
      }
      onClick={() => {
        router.push(`notes/${note.noteID}`);
      }}
     />
  );
}
