import {
  TypedDocumentNode,
  gql,
  Resolvers
} from '@apollo/client';
import {
  IncrementDailyStatUnitForWritingChallengeRequest,
  IncrementDailyStatUnitRequest
} from '../../../../generated/types/graphql';
import { DailyStatUnitDB } from '../../models/dailyStatUnit';
import { UserDB } from '../../models/user';
import { DocumentVersionDB } from '../../models/documentVersion';
import { DailyChallengeResponseDB } from '../../models/dailyChallengeResponse';
import prisma from '../../../../utils/prisma';

const typeDefs: TypedDocumentNode = gql`
  input IncrementDailyStatUnitRequest {
    documentVersionID: String
    timeSpentSeconds: Int!
    date: Date!
  }
  input IncrementDailyStatUnitForWritingChallengeRequest {
    dailyChallengeResponseID: String!
    timeSpentSeconds: Int!
    date: Date!
  }
  extend type Mutation {
    incrementDailyStatUnit(
      request: IncrementDailyStatUnitRequest!
    ): Void
    incrementDailyStatUnitForWritingChallenge(
      request: IncrementDailyStatUnitForWritingChallengeRequest!
    ): Void
  }
`;

async function incrementDailyStatUnit(
  _parent: any,
  { request }: { request: IncrementDailyStatUnitRequest },
  { user }: { user: UserDB }
) {
  if (request.documentVersionID) {
    const documentVersionToEdit =
      await DocumentVersionDB.uncheckedFromDocumentVersionID(
        request.documentVersionID
      );
    await prisma.dailyStatUnit.update(
      await DailyStatUnitDB.createOrUpdateStatsForDocumentVersion(
        {
          userID: user.userID,
          documentVersionID:
            documentVersionToEdit.documentVersionID,
          wordsAdded: 0,
          wordsRemoved: 0,
          timeSpentSeconds: request.timeSpentSeconds,
          date: request.date
        }
      )
    );
  }
}
async function incrementDailyStatUnitForWritingChallenge(
  _parent: any,
  {
    request
  }: {
    request: IncrementDailyStatUnitForWritingChallengeRequest;
  },
  { user }: { user: UserDB }
) {
  const dailyChallengeResponse =
    await DailyChallengeResponseDB.uncheckedFromDailyChallengeResponseID(
      {
        dailyChallengeResponseID:
          request.dailyChallengeResponseID
      }
    );
  await prisma.dailyStatUnit.update(
    await DailyStatUnitDB.createOrUpdateStatsForDailyChallengeResponse(
      {
        userID: user.userID,
        dailyChallengeResponseID:
          dailyChallengeResponse.dailyChallengeResponseID,
        wordsAdded: 0,
        wordsRemoved: 0,
        timeSpentSeconds: request.timeSpentSeconds,
        date: request.date
      }
    )
  );
}

const resolvers: Resolvers = {
  Mutation: {
    incrementDailyStatUnit,
    incrementDailyStatUnitForWritingChallenge
  }
};

export default { typeDefs, resolvers };
