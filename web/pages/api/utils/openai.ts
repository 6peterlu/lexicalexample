import {
  ChatCompletionRequestMessageRoleEnum,
  Configuration,
  OpenAIApi
} from 'openai';
import prisma from '../../../utils/prisma';

const EMBEDDING_MODEL_NAME = 'text-embedding-ada-002';
const EXPLANATION_MODEL_NAME = 'gpt-3.5-turbo-0613'; // 3.5-turbo stock doesn't support function calling

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY
});

const openai = new OpenAIApi(configuration);

const MAX_OPENAI_API_CALLS = 10000;

export async function getEmbeddingOpenAI(
  text: string,
  userID: string
): Promise<number[]> {
  // only uncomment this when you need the actual embedding data
  const response = await openai.createEmbedding({
    model: EMBEDDING_MODEL_NAME,
    input: text,
    user: userID
  });
  console.log('calling embedding endpoint');

  // fail safe against excessive API calls
  // TODO: change this to regular rate limiting
  const currentCalls = await prisma.user.findUnique({
    where: {
      userID
    },
    select: {
      openAIAPICalls: true
    }
  });
  if (currentCalls.openAIAPICalls >= MAX_OPENAI_API_CALLS) {
    throw new Error('OpenAI API call limit reached');
  }
  await prisma.user.update({
    where: {
      userID
    },
    data: {
      openAIAPICalls: currentCalls.openAIAPICalls + 1
    }
  });
  // return Promise.resolve(Array(1546).fill(Math.random()));
  return response.data.data[0].embedding;
}

const MAX_SIMILARITY_TOKENS = 20;

export async function getSimilarityExplanation(
  text1: string,
  text2: string,
  userID: string
): Promise<string> {
  console.log('calling openAI explainer');
  // fail safe against excessive API calls
  // TODO: change this to regular rate limiting
  const currentCalls = await prisma.user.findUnique({
    where: {
      userID
    },
    select: {
      openAIAPICalls: true
    }
  });
  if (currentCalls.openAIAPICalls >= MAX_OPENAI_API_CALLS) {
    throw new Error('OpenAI API call limit reached');
  }
  await prisma.user.update({
    where: {
      userID
    },
    data: {
      openAIAPICalls: currentCalls.openAIAPICalls + 1
    }
  });
  const response = await openai.createChatCompletion({
    model: EXPLANATION_MODEL_NAME,
    messages: [
      {
        role: 'user',
        content: `What's the common thread between the two statements below? Keep your response below 10 words.\n1. ${text1}\n2. ${text2}`
      }
    ],
    user: userID,
    max_tokens: MAX_SIMILARITY_TOKENS,
    n: 1 // only generate one output
  });
  return response.data.choices[0].message.content;
}

const promptMap: { [key: string]: string } = {
  plan: 'Respond with 3 critical practical questions of the plan, addressing me in the second person.',
  'product features':
    'Respond with 3 thought provoking critiques of specific features. Do not simply repeat the features in your response.  Respond with only questions, not statements.',
  ideas:
    'Respond with 3 thought provoking ideas expanding on the existing list.',
  reflection:
    'Respond with 3 thought provoking questions related to the reflection, addressing me in the second person.'
};

export async function generateIdeasOrQuestions(
  text: string,
  userID?: string
): Promise<string[]> {
  console.log(
    'calling openAI ideas/questions generator',
    text
  );
  const promptClassifier = `The following Markdown list is either a plan, product features, ideas, reflection, or other. Respond with which type of list it is. Only use "other" if it does not fit into any other category.\n\n`;

  try {
    const classification =
      await openai.createChatCompletion({
        model: EXPLANATION_MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: `${promptClassifier}${text}`
          }
        ],
        function_call: { name: 'list_type' },
        functions: [
          {
            name: 'list_type',
            parameters: {
              type: 'object',
              properties: {
                listType: {
                  type: 'string',
                  enum: [
                    'plan',
                    'product features',
                    'ideas',
                    'reflection',
                    'other'
                  ]
                }
              },
              required: ['listType']
            }
          }
        ],
        user: userID,
        n: 1 // only generate one output
      });
    const {
      listType: classificationResponse
    }: { listType: string } = JSON.parse(
      classification.data.choices[0].message.function_call
        .arguments
    );
    const lowerCaseClassificationResponse =
      classificationResponse.toLowerCase();
    console.log(
      'classification response',
      classificationResponse
    );
    // TODO: format ideas as a list function
    if (lowerCaseClassificationResponse in promptMap) {
      // need to add a classifier here to determine if the prompt is a question or idea
      const promptPrefix = `The following Markdown list is a ${lowerCaseClassificationResponse}. ${promptMap[classificationResponse]} Do not respond with more than 3 items. Do not repeat the input in your response.\n\n`;
      const response = await openai.createChatCompletion({
        model: EXPLANATION_MODEL_NAME,
        messages: [
          {
            role: 'user',
            content: `${promptPrefix}${text}`
          }
        ],
        function_call: { name: 'thoughts_list' },
        functions: [
          {
            name: 'thoughts_list',
            parameters: {
              type: 'object',
              properties: {
                thoughts: {
                  type: 'array',
                  items: {
                    type: 'string'
                  }
                }
              },
              required: ['thoughts']
            }
          }
        ],
        user: userID,
        n: 1 // only generate one output
      });

      const {
        thoughts: thoughtsResponse
      }: { thoughts: string[] } = JSON.parse(
        response.data.choices[0].message.function_call
          .arguments
      );
      console.log('thoughtsResponse', thoughtsResponse);
      return thoughtsResponse;
    }
  } catch (error) {
    console.log('error', error);
  }

  return null;
  // fail safe against excessive API calls
}

export async function initiateChatAboutSection(
  text: string,
  section: string,
  chatMessage: string,
  userID: string
): Promise<string> {
  console.log('calling openAI chat about section');
  const prompt = `I am going to ask you questions about a section of the following Markdown notes.
${text}\n\n
The section is:\n\n
${section}\n\n
Please respond to the following question about the section in 1-2 sentences. Respond in the same style as my messages.\n\n
${chatMessage}
`;
  const response = await openai.createChatCompletion({
    model: EXPLANATION_MODEL_NAME,
    messages: [{ role: 'user', content: prompt }],
    user: userID,
    n: 1 // only generate one output
  });
  return (
    response.data.choices[0].message.content ??
    'no response'
  );
}

export async function continueChatAboutSection(
  previousMessages: {
    role: ChatCompletionRequestMessageRoleEnum;
    content: string;
  }[],
  userID: string,
  chatMessage: string
) {
  console.log('calling openAI chat about section');
  console.log('previousMessages', previousMessages);
  const response = await openai.createChatCompletion({
    model: EXPLANATION_MODEL_NAME,
    messages: previousMessages.concat({
      role: 'user',
      content: chatMessage
    }),
    user: userID,
    n: 1 // only generate one output
  });
  return response.data.choices[0].message.content;
}

export async function generateDraft(
  text: string,
  userID: string
) {
  const prompt = `Write a short block of text including the points in the following Markdown formatted list:\n\n`;
  console.log(`${prompt}${text}`);
  const response = await openai.createChatCompletion({
    model: EXPLANATION_MODEL_NAME,
    messages: [
      {
        role: 'user',
        content: `${prompt}${text}`
      }
    ],
    temperature: 0.7,
    n: 1
  });
  console.log('response', response);
  return response.data.choices[0].message.content;
}

export async function extrapolateIdea(
  text: string,
  segmentBefore: string,
  segmentAfter: string,
  userID: string
) {
  const prompt = `You are a ghostwriter. You need to write about an idea in the same style as the preceding and succeeding text.
  The preceding text is: ${segmentBefore}
  The succeeding text is: ${segmentAfter}
  The idea to write about is: ${text}
  
  You are not allowed to repeat the input in your response.`;

  console.log('prompt', prompt);
  // const response = await openai.createChatCompletion({
  //   model: EXPLANATION_MODEL_NAME,
  //   messages: [
  //     {
  //       role: 'user',
  //       content: prompt
  //     }
  //   ],
  //   temperature: 0.7,
  //   n: 1
  // });

  const response = await openai.createChatCompletion({
    model: EXPLANATION_MODEL_NAME,
    messages: [
      {
        role: 'user',
        content: prompt
      }
    ],
    function_call: { name: 'generated_sentences' },
    functions: [
      {
        name: 'generated_sentences',
        parameters: {
          type: 'object',
          properties: {
            generated_sentences_expanding_on_phrase: {
              type: 'string'
            }
          },
          required: [
            'generated_sentences_expanding_on_phrase'
          ]
        }
      }
    ],
    user: userID,
    temperature: 0.7,
    n: 1 // only generate one output
  });
  console.log(
    response.data.choices[0].message.function_call.arguments
  );

  const {
    generated_sentences_expanding_on_phrase: thoughtsResponse
  }: { generated_sentences_expanding_on_phrase: string } = JSON.parse(
    response.data.choices[0].message.function_call.arguments
  );
  return thoughtsResponse;
}
