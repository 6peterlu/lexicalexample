import {
  tracer,
  context as tracerContext
} from '../../open-telemetry';
import {
  DocumentNode,
  Resolvers,
  gql
} from '@apollo/client';
import {
  GetDocumentRequest,
  GetDocumentResponse,
  GetDocumentsResponse,
  GetSharedWithRequest,
  GetSharedWithResponse
} from '../../../../generated/types/graphql';
import { GraphQLError } from 'graphql';
import { UserDB, UserMetadataDB } from '../../models/user';
import { DocumentVersionDB } from '../../models/documentVersion';
import { DocumentDB } from '../../models/document';

const typeDefs: DocumentNode = gql`
  type DocumentMetadata {
    title: String!
    documentID: String!
    updatedAt: DateTime!
    userDocumentPermissions: [UserDocumentPermissionMetadata!]!
    documentVersions: [DocumentVersionMetadata!]!
    lastOpenedDocumentVersionID: String
  }

  input GetDocumentRequest {
    documentID: String!
  }
  type GetDocumentResponse {
    title: String!
    documentVersionMetadataList: [DocumentVersionMetadata!]!
    userDocumentPermissions: [UserDocumentPermissionMetadata!]!
    actionPermissions: [ActionPermission!]!
    documentID: String!
  }

  type GetDocumentsResponse {
    documents: [DocumentMetadata!]!
  }

  input GetSharedWithRequest {
    documentID: String!
    versionName: String
  }

  type GetSharedWithResponse {
    sharedOnDocument: [UserDocumentPermissionMetadata!]!
    sharedOnDocumentVersion: [UserDocumentPermissionMetadata!]!
  }

  extend type Query {
    getDocuments: GetDocumentsResponse!
    getDocument(
      args: GetDocumentRequest!
    ): GetDocumentResponse!
    getSharedWith(
      args: GetSharedWithRequest!
    ): GetSharedWithResponse!
    getSharedDocuments: GetDocumentsResponse!
  }
`;

async function getDocuments(
  _parent: any,
  _: any,
  context: { user: UserDB }
): Promise<GetDocumentsResponse> {
  const span = tracer.startSpan(
    'getDocuments',
    undefined,
    tracerContext.active()
  );
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  const documents = await context.user.getDocuments();
  span.end();
  return {
    documents: documents.map((dm) =>
      dm.toGraphQLDocumentMetadata()
    )
  };
}

/**
 * Gets just documents you're been shared on
 * @param _parent
 * @param _
 * @param context
 * @returns
 */
async function getSharedDocuments(
  _parent: any,
  _: any,
  context: { user: UserDB }
): Promise<GetDocumentsResponse> {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  const documents = await context.user.getSharedDocuments();
  return {
    documents: documents.map((d) =>
      d.toGraphQLDocumentMetadata()
    )
  };
}

async function getDocument(
  _parent: any,
  { args }: { args: GetDocumentRequest },
  context: { user: UserDB }
): Promise<GetDocumentResponse> {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  const document = await DocumentDB.fromGetDocumentQuery({
    ...args,
    user: context.user
  });
  if (!document) {
    throw new GraphQLError('No permissions to document');
  }
  return document.toGraphQLGetDocumentResponse(
    context.user
  );
}

// TODO: this function could use a lot less DB queries
async function getSharedWith(
  _parent: any,
  { args }: { args: GetSharedWithRequest },
  context: { user: UserDB }
): Promise<GetSharedWithResponse> {
  if (!context.user) {
    throw new GraphQLError('Not logged in');
  }
  const document = await DocumentDB.fromDocumentID(
    context.user,
    args.documentID
  );
  const documentVersion =
    await DocumentVersionDB.fromDocumentIDAndVersionName({
      query: {
        documentID: args.documentID,
        versionName: args.versionName
      },
      user: context.user,
      getAllPermissions: true
    });
  const uds = documentVersion.userDocumentPermissions;
  const ums = await UserMetadataDB.fromUserIDList(uds);
  const documentUds = document.userDocumentPermissions;
  const documentUms = await UserMetadataDB.fromUserIDList(
    documentUds
  );
  return {
    sharedOnDocumentVersion: ums.map((um) =>
      um.toGraphQL()
    ),
    sharedOnDocument: documentUms.map((um) =>
      um.toGraphQL()
    )
  };
}

const resolvers: Resolvers = {
  Query: {
    getDocuments,
    getDocument,
    getSharedWith,
    getSharedDocuments
  }
};

export default { typeDefs, resolvers };
