import {
  gql,
  useLazyQuery,
  useReactiveVar
} from '@apollo/client';
import { useRouter } from 'next/router';
import { useEffect } from 'react';
import {
  currentDocumentVersionIDVar,
  documentsVar,
  sharedDocumentsVar,
  userInfoVar
} from '../cache/cache';
import { DocumentMetadata as gql_DocumentMetadata } from '../generated/types/graphql';
import { DocumentMetadata } from '../models/document';
import { DocumentVersionDualID } from '../models/documentVersion';
import { UserDocumentPermission } from '../models/userDocumentPermission';

const LOAD_DOCUMENTS = gql`
  query getDocuments {
    getDocuments {
      documents {
        title
        documentID
        updatedAt
        lastOpenedDocumentVersionID
        userDocumentPermissions {
          role
          userID
          username
        }
        documentVersions {
          createdAt
          versionName
          documentVersionID
        }
      }
    }
  }
`;

const LOAD_SHARED_DOCUMENTS = gql`
  query getSharedDocuments {
    getSharedDocuments {
      documents {
        title
        documentID
        updatedAt
        lastOpenedDocumentVersionID
        userDocumentPermissions {
          role
          userID
          username
        }
        documentVersions {
          createdAt
          versionName
          documentVersionID
        }
      }
    }
  }
`;

/**
 * Loads document data into the reactive var and returns it.
 * @returns
 */
export function useDocuments() {
  let documents = useReactiveVar(documentsVar);

  const router = useRouter();
  const [documentsQuery] = useLazyQuery(LOAD_DOCUMENTS, {
    fetchPolicy: 'no-cache'
  });
  let user = useReactiveVar(userInfoVar);

  // load every time the url path changes to ensure fresh data
  useEffect(() => {
    async function loadDocuments() {
      const documents = await documentsQuery();
      if (documents.data) {
        documentsVar(
          documents.data.getDocuments.documents.map(
            (doc: gql_DocumentMetadata) =>
              DocumentMetadata.fromGraphQL(doc)
          )
        );
      }
    }
    if (user) {
      loadDocuments();
    }
  }, [router.query.slug, user, documentsQuery]);
  return documents;
}

/**
 * Loads shared document data into the reactive var and returns it.
 * @returns
 */
export function useSharedDocuments() {
  const router = useRouter();
  let documents = useReactiveVar(sharedDocumentsVar);
  const [documentsQuery] = useLazyQuery(
    LOAD_SHARED_DOCUMENTS,
    {
      fetchPolicy: 'no-cache'
    }
  );
  let user = useReactiveVar(userInfoVar);

  useEffect(() => {
    async function loadDocuments() {
      const documents = await documentsQuery();
      if (documents.data) {
        sharedDocumentsVar(
          documents.data.getSharedDocuments.documents.map(
            (doc: gql_DocumentMetadata) =>
              DocumentMetadata.fromGraphQL(doc)
          )
        );
      }
    }
    if (user) {
      loadDocuments();
    }
  }, [router.query.slug, user, documentsQuery]);
  return documents;
}

const LOAD_DOCUMENT_VERSION = gql`
  query getDocumentVersionFromVersionName(
    $documentID: String!
    $versionName: String
  ) {
    getDocumentVersionFromVersionName(
      args: {
        documentID: $documentID
        versionName: $versionName
      }
    ) {
      content
      documentVersionID
      userDocumentPermissions {
        userID
        role
      }
      actionPermissions
    }
  }
`;

export function useLoadDocumentVersion() {
  const currentDocumentVersionDualID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  const [
    loadDocumentVersion,
    {
      data: documentVersionQueryData,
      loading: documentVersionQueryLoading
    }
  ] = useLazyQuery(LOAD_DOCUMENT_VERSION, {
    fetchPolicy: 'no-cache',
    variables: {
      documentID: currentDocumentVersionDualID.documentID,
      versionName: currentDocumentVersionDualID.versionName
    }
  });
  useEffect(() => {
    if (
      documentVersionQueryData &&
      currentDocumentVersionDualID.documentVersionID !==
        documentVersionQueryData
          ?.getDocumentVersionFromVersionName
          .documentVersionID
    ) {
      const newDualID =
        DocumentVersionDualID.updateDocumentVersionIDAndActionPermissions(
          {
            documentVersionDualID:
              currentDocumentVersionDualID,
            documentVersionID:
              documentVersionQueryData
                ?.getDocumentVersionFromVersionName
                .documentVersionID,
            actionPermissions:
              documentVersionQueryData
                ?.getDocumentVersionFromVersionName
                .actionPermissions
          }
        );
      currentDocumentVersionIDVar(newDualID);
    }
  }, [
    currentDocumentVersionDualID,
    documentVersionQueryData
  ]);
  // useEffect(() => {
  //   // when the document version query data changes, update the perm
  //   console.log(
  //     'documentVersionQueryData.getDocumentVersionFromVersionName',
  //     documentVersionQueryData?.getDocumentVersionFromVersionName
  //   );
  //   if (
  //     documentVersionQueryData &&
  //     !UserDocumentPermission.matches(
  //         documentVersionQueryData.getDocumentVersionFromVersionName
  //       ),
  //       currentDocumentVersionDualID.documentPermission
  //     )
  //   ) {
  //     const newDualID =
  //       DocumentVersionDualID.updateDocumentVersionPermission(
  //         documentVersionQueryData.getDocumentVersionFromVersionName,
  //         currentDocumentVersionDualID
  //       );
  //     currentDocumentVersionIDVar(newDualID);
  //   }
  // }, [
  //   documentVersionQueryData,
  //   currentDocumentVersionDualID
  // ]);

  return {
    loadDocumentVersion,
    documentVersionQueryData,
    documentVersionQueryLoading
  };
}
