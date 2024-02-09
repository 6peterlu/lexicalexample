import { useEffect } from 'react';
import {
  Button,
  Loading,
  useTheme
} from '@nextui-org/react';
import {
  gql,
  useLazyQuery,
  useReactiveVar
} from '@apollo/client';
import {
  currentDocumentVar,
  currentDocumentVersionIDVar,
  showResolvedCommentsVar
} from '../../../../cache/cache';
import { useRouter } from 'next/router';
import { Document } from '../../../../models/document';
import { DocumentVersionDualID } from '../../../../models/documentVersion';
import { EditorModeMenu } from '../../../../components/EditorModeMenu';
import EditorHeader from '../../../../components/EditorHeader';
import dynamic from 'next/dynamic';
import { useSession } from 'next-auth/react';
import WordCounter from '../../../../components/WordCounter';
import NoteSection from '../../../../components/notePanel/NoteSection';
import AnalyticsSection from '../../../../components/AnalyticsSection';
import ResolvedCommentPanel from '../../../../components/ResolvedCommentPanel';
import Head from 'next/head';
import { getTitleString } from '../../../../utils/string';
import CommentPanel from '../../../../components/CommentPanel';
import { m } from 'framer-motion';
import OutlineEditor from '../../../../components/OutlineEditor';
import { UserDocumentPermission } from '../../../../models/userDocumentPermission';

const Editor = dynamic(
  () => import('../../../../components/editor/Editor'),
  { ssr: false }
);

const LOAD_DOCUMENT = gql`
  query getDocument($documentID: String!) {
    getDocument(args: { documentID: $documentID }) {
      title
      documentID
      documentVersionMetadataList {
        documentVersionID
        versionName
        createdAt
      }
      userDocumentPermissions {
        userID
        role
        userDocumentPermissionID
      }
      actionPermissions
    }
  }
`;

function DocumentEditor() {
  const router = useRouter();
  const { documentID: documentIDQueryArg } = router.query;

  let versionName: string | undefined;
  if (router.query.versionName !== 'live') {
    versionName = router.query.versionName as string;
  }
  const { status } = useSession({ required: true });
  const { theme } = useTheme();
  const documentID = documentIDQueryArg as string;
  const [
    loadDocument,
    {
      called: documentQueryCalled,
      loading: documentQueryLoading,
      data: documentQueryData
    }
  ] = useLazyQuery(LOAD_DOCUMENT, {
    fetchPolicy: 'no-cache',
    variables: {
      documentID
    }
  });
  const documentVersionDualID = useReactiveVar(
    currentDocumentVersionIDVar
  );
  useEffect(() => {
    // this causes some choppiness but is needed to reload data when promoting versions
    // (or doing other sketchy redirections)

    if (documentID) {
      // It's undefined during initial load
      loadDocument();
    }
  }, [router.query, documentID, versionName, loadDocument]);
  // why do we need use effect here? see https://stackoverflow.com/questions/62336340/cannot-update-a-component-while-rendering-a-different-component-warning
  useEffect(() => {
    // set document version dual var for use by consumers to pull content
    if (
      documentVersionDualID?.documentID !== documentID ||
      documentVersionDualID?.versionName !== versionName
    ) {
      currentDocumentVersionIDVar(
        DocumentVersionDualID.updateDocumentNameAndVersionName(
          {
            documentID,
            versionName,
            documentVersionDualID
          }
        )
      );
    }
  }, [
    router.query,
    documentID,
    versionName,
    documentVersionDualID
  ]);
  useEffect(() => {
    if (documentQueryData) {
      if (documentQueryData.getDocument) {
        const document = Document.fromGraphQL(
          documentQueryData.getDocument
        );
        currentDocumentVar(document);
      }
    }
  }, [documentQueryData, documentID, versionName]);

  const showResolvedCommentsPanel = useReactiveVar(
    showResolvedCommentsVar
  );

  if (
    !documentQueryCalled ||
    documentQueryLoading ||
    status === 'loading'
  ) {
    return <Loading />;
  }

  return (
    <div
      style={{
        flex: 1,
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        backgroundColor: theme.colors.gray50.value,
        maxHeight: '100%'
      }}
    >
      <Head>
        <title>
          {getTitleString(
            documentQueryData.getDocument.title
          )}
        </title>
      </Head>
      <EditorHeader />
      <div
        style={{
          display: 'flex',
          flexDirection: 'row',
          height: '100%',
          maxHeight: '100%',
          position: 'relative'
        }}
      >
        {/* Note container */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            maxHeight: '90vh',
            overflowY: 'scroll'
          }}
        >
          <WordCounter />
          <NoteSection />
          <AnalyticsSection />
          <OutlineEditor />
        </div>
        {/* Editor container */}
        <div
          style={{
            flex: 3,
            display: 'flex',
            flexDirection: 'column'
          }}
        >
          <div
            style={{
              display: 'flex',
              flexDirection: 'row',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingRight: theme.space['3xl'].value,
              backgroundColor: 'white',
              width: 700,
              borderBottomWidth: 1,
              borderBottomStyle: 'solid',
              borderBottomColor: theme.colors.gray500.value,
              zIndex: 1
            }}
          >
            <div id='toolbar-container' />
          </div>
          {/* Text editor */}
          <Editor />
          {/* <Link href='/api/auth/logout'>Logout</Link> */}
        </div>
        {/* {documentVersionDualID.loadCommentPermissionID() && (
          <ResolvedCommentPanel />
        )} */}
      </div>
    </div>
  );
}

export default DocumentEditor;
