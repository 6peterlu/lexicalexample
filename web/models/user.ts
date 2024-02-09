import {
  User as gql_User,
  UserDocumentPermissionMetadata as gql_UserDocumentPermissionMetadata
} from '../generated/types/graphql';

export class UserMetadataDB {
  userID: string;
  username: string;
  role: string;
  userDocumentPermissionID: string;
  constructor(arg: {
    userID: string;
    username: string;
    role: string;
    userDocumentPermissionID: string;
  }) {
    this.userID = arg.userID;
    this.username = arg.username;
    this.role = arg.role;
    this.userDocumentPermissionID =
      arg.userDocumentPermissionID;
  }
  static fromGraphQL(
    um: gql_UserDocumentPermissionMetadata
  ): UserDB {
    return new this({
      userID: um.userID,
      username: um.username,
      role: um.role,
      userDocumentPermissionID: um.userDocumentPermissionID
    });
  }
}

export class UserDB {
  userID: string;
  username: string;
  firstName?: string;
  lastName?: string;
  constructor(arg: {
    userID: string;
    username: string;
    firstName?: string;
    lastName?: string;
  }) {
    this.userID = arg.userID;
    this.username = arg.username;
    this.firstName = arg.firstName;
    this.lastName = arg.lastName;
  }
  static fromGraphQL(user: gql_User): UserDB {
    return new this({
      userID: user.userID,
      username: user.username,
      firstName: user.firstName,
      lastName: user.lastName
    });
  }
}
