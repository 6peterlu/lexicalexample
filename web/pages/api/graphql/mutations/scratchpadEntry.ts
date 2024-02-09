import { gql, Resolvers } from '@apollo/client';
import { UserDB } from '../../models/user';
import { UpdateScratchpadEntryContentRequest } from '../../../../generated/types/graphql';
import prisma from '../../../../utils/prisma';

const typeDefs = gql`
  input UpdateScratchpadEntryContentRequest {
    scratchpadEntryID: String!
    content: String!
  }
  extend type Mutation {
    updateScratchpadEntryContent(
      request: UpdateScratchpadEntryContentRequest
    ): Void
  }
`;

async function updateScratchpadEntryContent(
  _parent: any,
  {
    request
  }: { request: UpdateScratchpadEntryContentRequest },
  { user }: { user: UserDB }
): Promise<void> {
  await prisma.scratchpadEntry.updateMany({
    where: {
      scratchpadEntryID: request.scratchpadEntryID,
      userID: user.userID
    },
    data: {
      content: JSON.parse(request.content)
    }
  });
}

const resolvers: Resolvers = {
  Mutation: {
    updateScratchpadEntryContent
  }
};

export default { typeDefs, resolvers };
