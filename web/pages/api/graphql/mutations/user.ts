import {
  Resolvers,
  DocumentNode,
  gql
} from '@apollo/client';
import { GraphQLError } from 'graphql';
import {
  FollowUserRequest,
  InviteUserToDocumentRequest,
  UnfollowUserRequest,
  UpdateBasicUserInfoRequest,
  UpdateProfileDataRequest
} from '../../../../generated/types/graphql';
import prisma from '../../../../utils/prisma';
import { UserDB } from '../../models/user';
import { UserDocumentPermissionDB } from '../../models/userDocumentPermission';

const typeDefs: DocumentNode = gql`
  input InviteUserToDocumentRequest {
    username: String!
    documentVersionID: String!
    role: String!
  }
  input UpdateBasicUserInfoRequest {
    firstName: String
    lastName: String
    username: String
  }
  input FollowUserRequest {
    userID: String!
  }
  input UnfollowUserRequest {
    userID: String!
  }
  input UpdateProfileDataRequest {
    bio: String
    website: String
    city: String
    country: String
    twitter: String
    instagram: String
  }
  extend type Mutation {
    inviteUserToDocument(
      request: InviteUserToDocumentRequest!
    ): Void
    updateBasicUserInfo(
      request: UpdateBasicUserInfoRequest
    ): Void
    followUser(request: FollowUserRequest!): Void
    unfollowUser(request: UnfollowUserRequest!): Void
    updateProfileData(
      request: UpdateProfileDataRequest!
    ): Void
  }
`;

async function inviteUserToDocument(
  _parent: any,
  { request }: { request: InviteUserToDocumentRequest },
  context: { user: UserDB }
): Promise<void> {
  const user = await UserDB.fromUsername(request.username);
  const ud = UserDocumentPermissionDB.fromGraphQL(
    request,
    user
  );
  await prisma.userDocumentPermission.create({
    data: ud.toPrismaCreate()
  });
}

async function updateBasicUserInfo(
  _parent: any,
  { request }: { request: UpdateBasicUserInfoRequest },
  context: { user: UserDB }
) {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  await prisma.user.update(
    context.user.updateBasicUserInfo(request)
  );
}

async function followUser(
  _parent: any,
  { request }: { request: FollowUserRequest },
  context: { user: UserDB }
) {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  await prisma.user.update({
    where: { userID: context.user.userID },
    data: {
      following: {
        connectOrCreate: {
          where: {
            followerID_followingID: {
              followerID: context.user.userID,
              followingID: request.userID
            }
          },
          create: {
            followingID: request.userID
          }
        }
      }
    }
  });
}

async function unfollowUser(
  _parent: any,
  { request }: { request: UnfollowUserRequest },
  { user }: { user: UserDB }
) {
  if (!user) {
    throw new GraphQLError('Not logged in');
  }
  await prisma.user.update({
    where: { userID: user.userID },
    data: {
      following: {
        delete: {
          followerID_followingID: {
            followerID: user.userID,
            followingID: request.userID
          }
        }
      }
    }
  });
}

async function updateProfileData(
  _parent: any,
  { request }: { request: UpdateProfileDataRequest },
  { user }: { user: UserDB }
) {
  if (!user) {
    throw new GraphQLError('Not logged in');
  }
  await prisma.user.update({
    where: { userID: user.userID },
    data: request
  });
}

const resolvers: Resolvers = {
  Mutation: {
    inviteUserToDocument,
    updateBasicUserInfo,
    followUser,
    unfollowUser,
    updateProfileData
  }
};

export default { typeDefs, resolvers };
