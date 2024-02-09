import { getServerSession } from 'next-auth';
import { GraphQLError } from 'graphql';
import { Resolver } from '@apollo/client';

export async function authenticated(
  fn: Resolver
  // @ts-ignore: Unreachable code error
): Resolver {
  const session = await getServerSession();
  if (!session) {
    throw new GraphQLError(
      'Need to be logged in to access this route.'
    );
  }
  return fn;
}
