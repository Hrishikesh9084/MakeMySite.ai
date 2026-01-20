import OpenAI from 'openai';

const openai = new OpenAI({
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.AI_API_KEY || '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',
});

export default openai;