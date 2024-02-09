import document from './document';
import note from './note';
import comment from './comment';
import user from './user';
import documentVersion from './documentVersion';
import { mergeResolvers } from '@graphql-tools/merge';
import dailyStatUnit from './dailyStatUnit';
import scratchpadEntry from './scratchpadEntry';
import dailyChallenge from './dailyChallenge';
import publishedDocumentVersion from './publishedDocumentVersion';
import writingSession from './writingSession';
import enhancedDocument from './enhancedDocument';

export default {
  typeDefs: [
    document.typeDefs,
    note.typeDefs,
    comment.typeDefs,
    user.typeDefs,
    documentVersion.typeDefs,
    dailyStatUnit.typeDefs,
    scratchpadEntry.typeDefs,
    dailyChallenge.typeDefs,
    publishedDocumentVersion.typeDefs,
    writingSession.typeDefs,
    enhancedDocument.typeDefs
  ],
  resolvers: mergeResolvers([
    document.resolvers,
    note.resolvers,
    comment.resolvers,
    user.resolvers,
    documentVersion.resolvers,
    dailyStatUnit.resolvers,
    scratchpadEntry.resolvers,
    dailyChallenge.resolvers,
    publishedDocumentVersion.resolvers,
    writingSession.resolvers,
    enhancedDocument.resolvers
  ])
};
