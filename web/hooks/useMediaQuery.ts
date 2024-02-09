import { useTheme } from '@nextui-org/react';
import { useEffect, useState } from 'react';
import { convertPxStringToNumber } from '../utils/string';

function useMediaQuery(query: number): boolean {
  const queryString = `(min-width: ${query}px)`;
  const getMatches = (query: string): boolean => {
    // Prevents SSR issues
    if (typeof window !== 'undefined') {
      return window.matchMedia(query).matches;
    }
    return false;
  };

  const [matches, setMatches] = useState<boolean>(
    getMatches(queryString)
  );

  function handleChange() {
    setMatches(getMatches(queryString));
  }

  useEffect(() => {
    // Triggered at the first client-side load and if query changes
    const matchMedia = window.matchMedia(queryString);
    handleChange();
    // Listen matchMedia
    if (matchMedia.addListener) {
      matchMedia.addListener(handleChange);
    } else {
      matchMedia.addEventListener('change', handleChange);
    }

    return () => {
      if (matchMedia.removeListener) {
        matchMedia.removeListener(handleChange);
      } else {
        matchMedia.removeEventListener(
          'change',
          handleChange
        );
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query]);

  return matches;
}

export default useMediaQuery;
