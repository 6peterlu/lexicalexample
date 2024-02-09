import { gql, Resolvers } from '@apollo/client';
import {
  GetContentForScratchpadEntriesRequest,
  GetScratchpadEntriesForUserRequest
} from '../../../../generated/types/graphql';
import { UserDB } from '../../models/user';
import { ScratchpadEntryDB } from '../../models/scratchpadEntry';
import prisma from '../../../../utils/prisma';
import { generateInitialLexicalConfigFromText } from '../../../../utils/lexical';

const INITIAL_SCRATCHPAD_CONTENT = {
  root: {
    children: [
      {
        children: [
          {
            detail: 0,
            format: 0,
            mode: 'normal',
            style: '',
            text: '',
            type: 'text',
            version: 1
          }
        ],
        direction: 'ltr',
        format: '',
        indent: 0,
        type: 'paragraph',
        version: 1
      }
    ],
    direction: 'ltr',
    format: '',
    indent: 0,
    type: 'root',
    version: 1
  }
};

const typeDefs = gql`
  input GetScratchpadEntriesForUserRequest {
    date: Date!
  }
  input GetContentForScratchpadEntriesRequest {
    dates: [Date!]!
  }
  type ScratchpadEntry {
    scratchpadEntryID: String!
    date: Date!
    content: String
    userID: String!
  }
  extend type Query {
    getScratchpadEntriesForUser(
      args: GetScratchpadEntriesForUserRequest
    ): [Date!]!
    getContentForScratchpadEntries(
      args: GetContentForScratchpadEntriesRequest
    ): [ScratchpadEntry!]!
  }
`;

async function getScratchpadEntriesForUser(
  _parent: any,
  { args }: { args: GetScratchpadEntriesForUserRequest },
  { user }: { user: UserDB }
) {
  const date = new Date(args.date);
  let records = await prisma.scratchpadEntry.findMany({
    where: {
      userID: user.userID,
      date: { lte: date }
    },
    orderBy: {
      date: 'desc'
    },
    select: {
      date: true
    }
  });
  // check to see if current date's scratchpad entry has already been created
  if (
    records.length === 0 ||
    records[0].date.getTime() !== args.date.getTime()
  ) {
    // haven't created today's scratchpad yet, need to create
    const newSEEntry = await prisma.scratchpadEntry.create({
      data: {
        userID: user.userID,
        content: INITIAL_SCRATCHPAD_CONTENT,
        date: args.date
      },
      select: {
        date: true
      }
    });
    records.unshift(newSEEntry);
  }
  return records.map((s) => s.date);
}

async function getContentForScratchpadEntries(
  _parent: any,
  { args }: { args: GetContentForScratchpadEntriesRequest },
  { user }: { user: UserDB }
) {
  let records = await prisma.scratchpadEntry.findMany({
    where: {
      userID: user.userID,
      date: { in: args.dates }
    },
    orderBy: { date: 'desc' }
  });
  return records.map((r) =>
    ScratchpadEntryDB.fromPrisma(r).toGraphQL()
  );
}

const resolvers: Resolvers = {
  Query: {
    getScratchpadEntriesForUser,
    getContentForScratchpadEntries
  }
};

export default { typeDefs, resolvers };
