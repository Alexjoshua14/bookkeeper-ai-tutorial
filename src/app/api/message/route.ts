

import { MessageArraySchema } from "@/lib/validators/message";
import { ChatGPTMessage } from "@/lib/openai-stream";
import { OpenAIStream } from "@/lib/openai-stream";

import { chatbotPrompt } from "@/helpers/constants/chatbot-prompt";

export async function POST(req: Request) {
  const { messages } = await req.json();
  console.log("MESSAGES: ", messages);
  
  const parsedMessages = MessageArraySchema.parse(messages);

  const outboundMessages: ChatGPTMessage[] = parsedMessages.map((message) =>( {
    role: message.isUserMessage ? 'user' : 'system',
    content: message.text,
  }))

  outboundMessages.unshift({
    role: 'system',
    content: chatbotPrompt
  })

  const payload = {
    model: 'gpt-3.5-turbo',
    messages: outboundMessages,
    temperature: 0.9,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    max_tokens: 150,
    stream: true,
    n: 1,
  }

  const stream = await OpenAIStream(payload);

  return new Response(stream);
}