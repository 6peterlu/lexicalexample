export function generateTitle() {
  const adjectives = [
    'important',
    'secret',
    'confidential',
    'mystical',
    'whimsical',
    'insightful',
    'creative',
    'special',
    'notable',
    'unique'
  ];
  const nouns = [
    'document',
    'note',
    'dossier',
    'announcement',
    'scratchpad',
    'list',
    'inscription',
    'letter',
    'memo',
    'reminder',
    'message'
  ];
  const randomAdjective =
    adjectives[
      Math.floor(Math.random() * adjectives.length)
    ];
  const randomNoun =
    nouns[Math.floor(Math.random() * nouns.length)];
  return `${randomAdjective} ${randomNoun}`;
}
