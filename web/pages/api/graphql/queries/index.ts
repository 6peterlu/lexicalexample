import document from './document';
import comment from './comment';
import user from './user';
import note from './note';
import documentVersion from './documentVersion';
import { mergeResolvers } from '@graphql-tools/merge';
import dailyStatUnit from './dailyStatUnit';
import scratchpadEntry from './scratchpadEntry';
import dailyChallenge from './dailyChallenge';
import publishedDocumentVersion from './publishedDocumentVersion';
import writingSession from './writingSession';
import feed from './feed';
import enhancedDocument from './enhancedDocument';

export default {
  typeDefs: [
    document.typeDefs,
    comment.typeDefs,
    user.typeDefs,
    note.typeDefs,
    documentVersion.typeDefs,
    dailyStatUnit.typeDefs,
    scratchpadEntry.typeDefs,
    dailyChallenge.typeDefs,
    publishedDocumentVersion.typeDefs,
    writingSession.typeDefs,
    feed.typeDefs,
    enhancedDocument.typeDefs
  ],
  resolvers: mergeResolvers([
    document.resolvers,
    comment.resolvers,
    user.resolvers,
    documentVersion.resolvers,
    note.resolvers,
    dailyStatUnit.resolvers,
    scratchpadEntry.resolvers,
    dailyChallenge.resolvers,
    publishedDocumentVersion.resolvers,
    writingSession.resolvers,
    feed.resolvers,
    enhancedDocument.resolvers
  ])
};
