import './open-telemetry';
// add new exports below this line
import { ApolloServer } from '@apollo/server';
import { gql } from '@apollo/client';
import { mergeResolvers } from '@graphql-tools/merge';
import { makeExecutableSchema } from '@graphql-tools/schema';
import mutations from './graphql/mutations';
import queries from './graphql/queries';
import prisma from '../../utils/prisma';
import { UserDB as UserDBModel } from './models/user';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './auth/[...nextauth]';
import {
  typeDefs as scalarTypeDefs,
  resolvers as scalarResolvers
} from 'graphql-scalars';
import { startServerAndCreateNextHandler } from '@as-integrations/next';

console.log('initializing graphql server');

const typeDefs = gql`
  scalar Void
  scalar JSON
  scalar Date
  scalar DateTime

  type Mutation
  type Query
`;

export const schema = makeExecutableSchema({
  typeDefs: [
    ...scalarTypeDefs,
    typeDefs,
    ...mutations.typeDefs,
    ...queries.typeDefs
  ],
  resolvers: {
    ...mergeResolvers([
      scalarResolvers,
      mutations.resolvers,
      queries.resolvers
    ])
  }
});

const server = new ApolloServer({
  schema,
  csrfPrevention: false
});

export default startServerAndCreateNextHandler(server, {
  context: async (req, res) => {
    let startTime = Date.now();
    const session = await getServerSession(
      req,
      res,
      authOptions
    );
    if (!session) {
      return { user: null, newUser: false };
    }
    // const session = await getSession(req, res);
    let user = await prisma.user.findUnique({
      where: { email: session.user.email }
    });
    startTime = Date.now();
    let newUser = false;
    if (!user) {
      user = await prisma.user.create({
        data: {
          email: session.user.email,
          appDrawerNoteIDs: [],
          username: session.user.email
        }
      });
      newUser = true;
    }
    const userModel = UserDBModel.fromPrisma(user);
    return { user: userModel, newUser };
  }
});
