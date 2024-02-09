import {
  DocumentNode,
  Resolvers,
  gql
} from '@apollo/client';
import { GraphQLError } from 'graphql';
import {
  DocumentVersion,
  GetDocumentVersionFromVersionNameRequest,
  GetDocumentVersionRequest
} from '../../../../generated/types/graphql';
import { DocumentVersionDB } from '../../models/documentVersion';
import { UserDB } from '../../models/user';
import prisma from '../../../../utils/prisma';
const typeDefs: DocumentNode = gql`
  enum ActionPermission {
    DeleteNoteForAll
    DeleteDocumentVersionForAll
    RenameDocumentVersion
    PublishDocumentVersion
    EditDocumentVersionContent
    ShareDocumentVersion
    ShareDocument
    RemoveCollaboratorFromDocumentVersion
    CreateCommentOnDocumentVersion
  }
  type DocumentVersion {
    documentVersionID: String!
    content: String
    versionName: String!
    userDocumentPermissions: [UserDocumentPermissionMetadata!]!
    actionPermissions: [ActionPermission!]!
  }
  input GetDocumentVersionRequest {
    documentVersionID: String!
  }
  input GetDocumentVersionFromVersionNameRequest {
    versionName: String
    documentID: String!
  }
  extend type Query {
    getDocumentVersion(
      args: GetDocumentVersionRequest!
    ): DocumentVersion!
    getDocumentVersionFromVersionName(
      args: GetDocumentVersionFromVersionNameRequest!
    ): DocumentVersion!
  }
`;

async function getDocumentVersion(
  _parent: any,
  { args }: { args: GetDocumentVersionRequest },
  { user }: { user: UserDB }
): Promise<DocumentVersion> {
  const documentVersionRecord =
    await DocumentVersionDB.fromDocumentVersionID(
      args.documentVersionID,
      user
    );
  if (!documentVersionRecord) {
    throw new GraphQLError(
      'not authorized to view document version'
    );
  }
  // we automatically update the last accessed dv whenever user loads it
  await prisma.userDocumentAttributes.upsert({
    where: {
      documentID_userID: {
        documentID: documentVersionRecord.documentID,
        userID: user.userID
      }
    },
    update: {
      lastOpenedDocumentVersionID:
        documentVersionRecord.documentVersionID
    },
    create: {
      documentID: documentVersionRecord.documentID,
      userID: user.userID,
      lastOpenedDocumentVersionID:
        documentVersionRecord.documentVersionID
    }
  });
  return documentVersionRecord.toGraphQL(user);
}

async function getDocumentVersionFromVersionName(
  _parent: any,
  {
    args
  }: { args: GetDocumentVersionFromVersionNameRequest },
  { user }: { user: UserDB }
): Promise<DocumentVersion> {
  const documentVersionRecord =
    await DocumentVersionDB.fromDocumentIDAndVersionName({
      query: args,
      user: user
    });
  if (!documentVersionRecord) {
    throw new GraphQLError(
      'not authorized to view document version'
    );
  }
  // we automatically update the last accessed dv whenever user loads it
  await prisma.userDocumentAttributes.upsert({
    where: {
      documentID_userID: {
        documentID: documentVersionRecord.documentID,
        userID: user.userID
      }
    },
    update: {
      lastOpenedDocumentVersionID:
        documentVersionRecord.documentVersionID
    },
    create: {
      documentID: documentVersionRecord.documentID,
      userID: user.userID,
      lastOpenedDocumentVersionID:
        documentVersionRecord.documentVersionID
    }
  });
  return documentVersionRecord.toGraphQL(user);
}

const resolvers: Resolvers = {
  Query: {
    getDocumentVersion,
    getDocumentVersionFromVersionName
  }
};

export default { typeDefs, resolvers };
