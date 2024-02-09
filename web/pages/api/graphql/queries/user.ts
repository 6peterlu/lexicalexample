import { gql, Resolvers } from '@apollo/client';
import {
  GetUserProfileDataRequest,
  GetUserResponse,
  UsernameSearchRequest,
  UsernameSearchResult,
  UserProfileData
} from '../../../../generated/types/graphql';
import prisma from '../../../../utils/prisma';
import { UserDB } from '../../models/user';

const typeDefs = gql`
  type User {
    userID: String!
    username: String!
    firstName: String
    lastName: String
  }
  type UserProfileData {
    username: String!
    userID: String!
    firstName: String!
    lastName: String
    following: Boolean!
    followerCount: Int!
    followingCount: Int!
    bio: String
    website: String
    city: String
    country: String
    twitter: String
    instagram: String
    createdAt: Date!
  }
  type UserDocumentPermissionMetadata {
    username: String!
    userID: String!
    role: Role!
    userDocumentPermissionID: String!
    documentID: String
    documentVersionID: String
  }
  type UserDocumentPermission {
    userID: String!
    documentVersionID: String!
    role: String
  }
  type GetUserResponse {
    user: User
    redirectURL: String
  }
  input GetUserProfileDataRequest {
    username: String!
  }
  input UsernameSearchRequest {
    username: String!
  }
  type UsernameSearchResult {
    username: String!
    userID: String!
  }
  extend type Query {
    getUser: GetUserResponse!
    getUserProfileData(
      args: GetUserProfileDataRequest
    ): UserProfileData!
    usernameSearch(
      args: UsernameSearchRequest
    ): [UsernameSearchResult!]!
  }
`;

async function getUser(
  _parent: any,
  _args: any,
  { user }: { user: UserDB }
): Promise<GetUserResponse> {
  if (!user) {
    return { user: null };
  }
  return { user: user.toGraphQL() };
}

async function getUserProfileData(
  _parent: any,
  { args }: { args: GetUserProfileDataRequest },
  { user }: { user: UserDB }
): Promise<UserProfileData> {
  if (user) {
    const userToGetProfileDataFor =
      await UserDB.fromUsername(args.username);
    return await userToGetProfileDataFor.toGraphQLProfileData(
      user
    );
  } else {
    // requester is not logged in
    const userToGetProfileDataFor =
      await UserDB.fromUsername(args.username);
    return await userToGetProfileDataFor.toGraphQLProfileData();
  }
}

async function usernameSearch(
  _parent: any,
  { args }: { args: UsernameSearchRequest }
): Promise<UsernameSearchResult[]> {
  const usernameSearchResults = await prisma.user.findMany({
    where: {
      username: {
        startsWith: args.username,
        mode: 'insensitive'
      }
    },
    select: {
      username: true,
      userID: true
    },
    orderBy: {
      username: 'asc'
    }
  });
  return usernameSearchResults.map(
    (usernameSearchResult) => ({
      username: usernameSearchResult.username,
      userID: usernameSearchResult.userID
    })
  );
}

const resolvers: Resolvers = {
  Query: {
    getUser,
    getUserProfileData,
    usernameSearch
  }
};

export default { typeDefs, resolvers };
