import {
  Resolvers,
  TypedDocumentNode,
  gql
} from '@apollo/client';
import { UserDB } from '../../models/user';
import {
  ContinueChatConversationRequest,
  DeleteEnhancedDocumentRequest,
  ExtrapolateIdeaInContextRequest,
  GenerateDraftRequest,
  GetEmbeddingInput,
  GetEmbeddingOutput,
  GetIdeasRequest,
  SaveEnhancedDocumentNotesContentRequest,
  SetDraftCollapsedRequest,
  SetPinnedIdeasRequest,
  StartChatConversationRequest,
  UpdateDraftRequest,
  UpdateTitleRequest
} from '../../../../generated/types/graphql';
import prisma from '../../../../utils/prisma';
import {
  ChatMessageAuthor,
  EnhancedDocumentRole
} from '../../../../generated/prisma';
import {
  generateIdeasOrQuestions,
  getEmbeddingOpenAI,
  getSimilarityExplanation,
  initiateChatAboutSection,
  generateDraft as generateDraftOpenAI,
  continueChatAboutSection,
  extrapolateIdea
} from '../../utils/openai';
import { v4 } from 'uuid';
import {
  EmbeddingNodeIDMap,
  SIMILARITY_SCORE_EXPONENT,
  SIMILARITY_SCORE_THRESHOLD,
  SimilarityOutput,
  computeSimilarity,
  getLinkageHash
} from '../../../../utils/embedding';
import { hashCode } from '../../../../utils/string';
import { createLexicalConfigWithBlankString } from '../../../../utils/lexical';
import { clipNumber } from '../../../../utils/number';
import { ChatCompletionRequestMessageRoleEnum } from 'openai';

export type StoredEmbeddingType = {
  version: number; // increment when schema changes
  embedding: number[][]; // embeddings for each node, indexed by node list
  similarityMatrix: number[][]; // cosine similarities derived from embeddings
  nodeList: string[]; // list of uuids for use in indexing into matrix
  nodeText: string[]; // list of text
  linkageExplainer: {
    // hashcode(text1||||text2) -> explanation
    // string is the explanation
    [hash: number]: string;
  };
};
export const EMBEDDING_VERSION = 1;

export const DEFAULT_STORED_EMBEDDING_TYPE: StoredEmbeddingType =
  {
    version: EMBEDDING_VERSION,
    embedding: [],
    similarityMatrix: [],
    nodeList: [],
    nodeText: [],
    linkageExplainer: {}
  };

const typeDefs: TypedDocumentNode = gql`
  input SaveEnhancedDocumentNotesContentRequest {
    enhancedDocumentID: String!
    notesContent: String!
  }
  input EmbeddingCallInput {
    nodeID: String!
    text: String!
  }
  input GetEmbeddingInput {
    embeddingInputs: [EmbeddingCallInput!]!
    enhancedDocumentID: String!
    allNodeIDs: [String!]!
    embeddingID: String!
  }
  type GetEmbeddingOutput {
    embeddingID: String!
    nodeList: [String!]!
    similarityMatrix: [[Float!]!]!
    linkageExplainer: String!
  }
  input UpdateDraftRequest {
    updatedDraftContent: String!
    enhancedDocumentID: String!
  }
  input UpdateTitleRequest {
    updatedTitle: String!
    enhancedDocumentID: String!
  }
  input DeleteEnhancedDocumentRequest {
    enhancedDocumentID: String!
  }
  input UpdateNotePanelPixelSplitRequest {
    enhancedDocumentID: String!
    newNotePanelPixelSplitPercentage: Float!
  }
  input GetIdeasRequest {
    enhancedDocumentID: String
    text: String!
  }
  type GetIdeasResponse {
    ideas: [String!]!
  }
  input SetPinnedIdeasRequest {
    enhancedDocumentID: String!
    pinnedIdeas: [String!]!
  }
  input StartChatConversationRequest {
    enhancedDocumentID: String!
    document: String!
    sectionText: String!
    sectionJSON: String!
    chatMessage: String!
  }
  type StartChatConversationResponse {
    threadID: String!
    responseMessage: String!
  }
  input ContinueChatConversationRequest {
    enhancedDocumentID: String!
    threadID: String!
    chatMessage: String!
  }
  type ContinueChatConversationResponse {
    responseMessage: String!
  }
  input GenerateDraftRequest {
    enhancedDocumentID: String!
    document: String!
  }
  type GenerateDraftResponse {
    draft: String!
  }
  input SetDraftCollapsedRequest {
    enhancedDocumentID: String!
    collapsed: Boolean!
  }
  input ExtrapolateIdeaInContextRequest {
    enhancedDocumentID: String!
    precedingText: String!
    idea: String!
    followingText: String!
  }
  type ExtrapolateIdeaInContextResponse {
    extrapolatedIdea: String!
  }
  extend type Mutation {
    createEnhancedDocument: EnhancedDocumentMetadata!
    saveEnhancedDocumentNotesContent(
      request: SaveEnhancedDocumentNotesContentRequest!
    ): Void
    getEmbedding(
      request: GetEmbeddingInput!
    ): GetEmbeddingOutput!
    updateDraft(request: UpdateDraftRequest!): Void
    updateTitle(request: UpdateTitleRequest!): Void
    deleteEnhancedDocument(
      request: DeleteEnhancedDocumentRequest!
    ): Void
    getIdeas(request: GetIdeasRequest!): GetIdeasResponse!
    setPinnedIdeas(request: SetPinnedIdeasRequest!): Void
    startChatConversation(
      request: StartChatConversationRequest!
    ): StartChatConversationResponse!
    continueChatConversation(
      request: ContinueChatConversationRequest!
    ): ContinueChatConversationResponse!
    generateDraft(
      request: GenerateDraftRequest!
    ): GenerateDraftResponse!
    setDraftCollapsed(
      request: SetDraftCollapsedRequest!
    ): Void
    extrapolateIdeaInContext(
      request: ExtrapolateIdeaInContextRequest!
    ): ExtrapolateIdeaInContextResponse!
  }
`;

async function saveEnhancedDocumentNotesContent(
  _parent: any,
  {
    request
  }: { request: SaveEnhancedDocumentNotesContentRequest },
  context: { user: UserDB }
) {
  // basic permission check
  await prisma.userEnhancedDocumentPermissions.findUniqueOrThrow(
    {
      where: {
        userID_enhancedDocumentID: {
          userID: context.user.userID,
          enhancedDocumentID: request.enhancedDocumentID
        }
      }
    }
  );
  await prisma.enhancedDocument.update({
    where: {
      enhancedDocumentID: request.enhancedDocumentID
    },
    data: {
      notesContent: JSON.parse(request.notesContent)
    }
  });
}

async function createEnhancedDocument(
  _parent: any,
  _request: any,
  context: { user: UserDB }
) {
  const ed = await prisma.enhancedDocument.create({
    data: {
      notesContent: {
        root: {
          children: [
            {
              type: 'list',
              version: 1,
              listType: 'bullet',
              tag: 'ul',
              format: '',
              indent: 0,
              children: [
                {
                  type: 'custom-list-item',
                  version: 1,
                  format: '',
                  indent: 0,
                  children: [
                    {
                      detail: 0,
                      indent: 0,
                      format: '',
                      mode: 'normal',
                      style: '',
                      text: 'add some ideas here',
                      type: 'text',
                      version: 1
                    }
                  ]
                }
              ]
            }
          ],
          direction: 'ltr',
          format: '',
          indent: 0,
          type: 'root',
          version: 1
        }
      },
      draftContent: createLexicalConfigWithBlankString(),
      title: 'new note',
      userEnhancedDocumentPermissions: {
        create: {
          userID: context.user.userID,
          role: EnhancedDocumentRole.OWNER
        }
      }
    }
  });
  return {
    enhancedDocumentID: ed.enhancedDocumentID,
    title: ed.title
  };
}

async function getEmbedding(
  _parent: any,
  { request }: { request: GetEmbeddingInput },
  context: { user: UserDB }
): Promise<GetEmbeddingOutput> {
  // load embeddings and return them associated with their IDs

  let existingEmbeddings: {
    embeddingsByNodeID: StoredEmbeddingType;
  } = (await prisma.enhancedDocument.findUniqueOrThrow({
    where: {
      enhancedDocumentID: request.enhancedDocumentID
    },
    select: { embeddingsByNodeID: true }
  })) as {
    embeddingsByNodeID: StoredEmbeddingType;
  };
  if (!existingEmbeddings.embeddingsByNodeID) {
    existingEmbeddings.embeddingsByNodeID =
      DEFAULT_STORED_EMBEDDING_TYPE;
  }
  // get updates needed
  const nodeIDsToUpdate: {
    nodeID: string;
    text: string;
  }[] = [];
  for (const embeddingInput of request.embeddingInputs) {
    const storedType: StoredEmbeddingType =
      existingEmbeddings.embeddingsByNodeID;
    const nodeIndex = storedType.nodeList.indexOf(
      embeddingInput.nodeID
    );
    if (nodeIndex === -1) {
      nodeIDsToUpdate.push(embeddingInput);
    } else if (
      storedType.nodeText[nodeIndex] !== embeddingInput.text
    ) {
      nodeIDsToUpdate.push(embeddingInput);
    }
  }

  // request updates needed from openAI API
  const embeddingOutputs: {
    embedding: number[];
    nodeID: string;
    text: string;
  }[] = [];
  for (const nodeIDData of nodeIDsToUpdate) {
    // calling it serially to reduce risk of rate limit
    const embedding = await getEmbeddingOpenAI(
      nodeIDData.text,
      context.user.userID
    );
    embeddingOutputs.push({
      embedding,
      nodeID: nodeIDData.nodeID,
      text: nodeIDData.text
    });
  }

  const updatedEmbeddings: EmbeddingNodeIDMap = {
    ...request.allNodeIDs.reduce(
      (
        acc: {
          [key: string]: {
            embedding: number[];
            text: string;
          };
        },
        nodeID
      ) => {
        const storedType: StoredEmbeddingType =
          existingEmbeddings.embeddingsByNodeID;
        const nodeIndex =
          storedType.nodeList.indexOf(nodeID);
        if (nodeIndex !== -1) {
          acc[nodeID] = {
            embedding: storedType.embedding[nodeIndex],
            text: storedType.nodeText[nodeIndex]
          };
        }
        return acc;
      },
      {}
    ),
    ...embeddingOutputs.reduce(
      (
        acc: {
          [key: string]: {
            embedding: number[];
            text: string;
          };
        },
        e
      ) => {
        acc[e.nodeID] = {
          embedding: e.embedding,
          text: e.text
        };
        return acc;
      },
      {}
    )
  };
  const similarityOutput: SimilarityOutput =
    computeSimilarity(updatedEmbeddings);
  const requestsToMake: { node1: number; node2: number }[] =
    [];
  for (
    let i = 0;
    i < similarityOutput.similarityMatrix.length;
    i++
  ) {
    for (
      let j = 0;
      j < similarityOutput.similarityMatrix[i].length;
      j++
    ) {
      if (
        Math.pow(
          similarityOutput.similarityMatrix[i][j],
          SIMILARITY_SCORE_EXPONENT
        ) > SIMILARITY_SCORE_THRESHOLD
      ) {
        requestsToMake.push({
          node1: i,
          node2: j + i + 1
        });
      }
    }
  }
  const comparisonData = await Promise.all(
    requestsToMake.map(async (request) => {
      const text1 =
        updatedEmbeddings[
          similarityOutput.nodeList[request.node1]
        ].text;
      const text2 =
        updatedEmbeddings[
          similarityOutput.nodeList[request.node2]
        ].text;
      const hash = getLinkageHash(text1, text2);
      const reverseHash = getLinkageHash(text2, text1);
      if (
        hash in
        existingEmbeddings.embeddingsByNodeID
          .linkageExplainer
      ) {
        return {
          hash,
          explainer:
            existingEmbeddings.embeddingsByNodeID
              .linkageExplainer[hash]
        };
      }
      if (
        reverseHash in
        existingEmbeddings.embeddingsByNodeID
          .linkageExplainer
      ) {
        return {
          hash,
          explainer:
            existingEmbeddings.embeddingsByNodeID
              .linkageExplainer[reverseHash]
        };
      }

      return {
        hash,
        explainer: await getSimilarityExplanation(
          text1,
          text2,
          context.user.userID
        )
      };
    })
  );
  const newLinkageExplainer = comparisonData.reduce(
    (acc: { [key: number]: string }, d) => {
      acc[d.hash] = d.explainer;
      return acc;
    },
    {}
  );
  const databaseStorage: StoredEmbeddingType = {
    version: EMBEDDING_VERSION,
    nodeList: similarityOutput.nodeList,
    similarityMatrix: similarityOutput.similarityMatrix,
    embedding: similarityOutput.nodeList.map(
      (nodeID) => updatedEmbeddings[nodeID].embedding
    ),
    nodeText: similarityOutput.nodeList.map(
      (nodeID) => updatedEmbeddings[nodeID].text
    ),
    linkageExplainer: newLinkageExplainer
  };
  await prisma.enhancedDocument.update({
    where: {
      enhancedDocumentID: request.enhancedDocumentID
    },
    data: {
      // TODO: store embeddings per node and the similarity matrix in different fields
      // more generally, stuff that's only needed serverside can be a different field
      embeddingsByNodeID: databaseStorage
    }
  });
  return {
    nodeList: similarityOutput.nodeList,
    similarityMatrix: similarityOutput.similarityMatrix,
    embeddingID: request.embeddingID,
    linkageExplainer: JSON.stringify(newLinkageExplainer)
  };
}

async function updateDraft(
  _parent: any,
  { request }: { request: UpdateDraftRequest },
  context: { user: UserDB }
) {
  await prisma.enhancedDocument.update({
    where: {
      enhancedDocumentID: request.enhancedDocumentID
    },
    data: {
      draftContent: JSON.parse(request.updatedDraftContent)
    }
  });
}

async function updateTitle(
  _parent: any,
  { request }: { request: UpdateTitleRequest },
  context: { user: UserDB }
) {
  await prisma.enhancedDocument.update({
    where: {
      enhancedDocumentID: request.enhancedDocumentID
    },
    data: {
      title: request.updatedTitle
    }
  });
}

// TODO: add authz checks!!
async function deleteEnhancedDocument(
  _parent: any,
  { request }: { request: DeleteEnhancedDocumentRequest },
  context: { user: UserDB }
) {
  await prisma.enhancedDocument.delete({
    where: {
      enhancedDocumentID: request.enhancedDocumentID
    }
  });
}

async function getIdeas(
  _parent: any,
  { request }: { request: GetIdeasRequest },
  { user }: { user: UserDB }
) {
  const ideas = await generateIdeasOrQuestions(
    request.text,
    user?.userID
  );
  if (!ideas) {
    return { ideas: [] };
  }
  return { ideas };
}

async function setPinnedIdeas(
  _parent: any,
  { request }: { request: SetPinnedIdeasRequest },
  { user }: { user: UserDB }
) {
  await prisma.enhancedDocument.update({
    where: {
      enhancedDocumentID: request.enhancedDocumentID
    },
    data: {
      ideas: request.pinnedIdeas
    }
  });
}

async function startChatConversation(
  _parent: any,
  { request }: { request: StartChatConversationRequest },
  { user }: { user: UserDB }
) {
  const newThreadID = v4();
  const messageSentTimestamp = new Date();
  const chatResponse = await initiateChatAboutSection(
    request.document,
    request.sectionText,
    request.chatMessage,
    user.userID
  );
  await prisma.$transaction([
    prisma.threadAttributes.updateMany({
      where: {
        enhancedDocumentID: request.enhancedDocumentID,
        archivedAt: null
      },
      data: {
        archivedAt: new Date()
      }
    }),
    prisma.threadAttributes.create({
      data: {
        archivedAt: null,
        threadID: newThreadID,
        sectionData: request.sectionJSON,
        enhancedDocumentID: request.enhancedDocumentID,
        userID: user.userID
      }
    }),
    prisma.chatMessage.create({
      data: {
        threadID: newThreadID,
        content: request.chatMessage,
        author: ChatMessageAuthor.USER,
        createdAt: messageSentTimestamp
      }
    }),
    prisma.chatMessage.create({
      data: {
        threadID: newThreadID,
        content: chatResponse,
        author: ChatMessageAuthor.SYSTEM
      }
    })
  ]);
  return {
    threadID: newThreadID,
    responseMessage: chatResponse
  };
}

async function continueChatConversation(
  _parent: any,
  { request }: { request: ContinueChatConversationRequest },
  { user }: { user: UserDB }
) {
  prisma.chatMessage.create({
    data: {
      threadID: request.threadID,
      content: request.chatMessage,
      author: ChatMessageAuthor.USER
    }
  });
  const threadToRespondTo =
    await prisma.chatMessage.findMany({
      where: {
        threadID: request.threadID
      },
      orderBy: {
        createdAt: 'asc'
      }
    });
  const openAIFormattedChatMessages = threadToRespondTo.map(
    (t) => {
      return {
        content: t.content,
        role:
          t.author === ChatMessageAuthor.USER
            ? ChatCompletionRequestMessageRoleEnum.User
            : ChatCompletionRequestMessageRoleEnum.Assistant
      };
    }
  );

  const response = await continueChatAboutSection(
    openAIFormattedChatMessages,
    user.userID,
    request.chatMessage
  );
  await prisma.chatMessage.create({
    data: {
      threadID: request.threadID,
      content: response,
      author: ChatMessageAuthor.SYSTEM
    }
  });
  return { responseMessage: response };
}

async function generateDraft(
  _parent: any,
  { request }: { request: GenerateDraftRequest },
  context: { user: UserDB }
) {
  const draftContent = await generateDraftOpenAI(
    request.document,
    context.user.userID
  );
  return { draft: draftContent };
}

async function setDraftCollapsed(
  _parent: any,
  { request }: { request: SetDraftCollapsedRequest },
  context: { user: UserDB }
) {
  await prisma.enhancedDocument.update({
    where: {
      enhancedDocumentID: request.enhancedDocumentID
    },
    data: {
      draftCollapsed: request.collapsed
    }
  });
}

async function extrapolateIdeaInContext(
  _parent: any,
  { request }: { request: ExtrapolateIdeaInContextRequest },
  context: { user: UserDB }
) {
  const extrapolatedIdea = await extrapolateIdea(
    request.idea,
    request.precedingText,
    request.followingText,
    context.user.userID
  );
  return { extrapolatedIdea };
}

const resolvers: Resolvers = {
  Mutation: {
    saveEnhancedDocumentNotesContent,
    createEnhancedDocument,
    getEmbedding,
    updateDraft,
    updateTitle,
    deleteEnhancedDocument,
    getIdeas,
    setPinnedIdeas,
    startChatConversation,
    generateDraft,
    continueChatConversation,
    setDraftCollapsed,
    extrapolateIdeaInContext
  }
};

export default { typeDefs, resolvers };
