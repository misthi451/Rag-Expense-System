import { GoogleGenerativeAI } from '@google/generative-ai';

if (!process.env.GEMINI_API_KEY) {
  throw new Error('GEMINI_API_KEY environment variable is required');
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

export async function getEmbedding(text) {
  try {
    if (!text || text.trim().length === 0) {
      throw new Error('Text cannot be empty');
    }

    const model = genAI.getGenerativeModel({ model: 'text-embedding-004' });

    const result = await model.embedContent({
      content: { parts: [{ text }] },
    });

    if (!result.embedding || !result.embedding.values) {
      throw new Error('No embedding returned from Gemini');
    }

    return result.embedding.values;
  } catch (error) {
    console.error('Embedding error:', error);
    throw new Error(`Failed to generate embedding: ${error.message}`);
  }
}

export async function generateAnswer(context, question) {
  const prompt = `You are a helpful financial assistant analyzing expense data.
Based on the following expense records, answer the user's question clearly and concisely.

EXPENSE RECORDS:
${context}

USER QUESTION: ${question}

Instructions:
- Provide specific numbers when available
- Be concise but informative
- If data is insufficient, say so clearly
- Always cite the categories and amounts from the records`;

  // Try models in order of preference
  const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];

  for (const modelName of models) {
    try {
      console.log(`Trying model: ${modelName}`);
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      const text = result.response.text();
      if (!text) throw new Error('No response generated');
      console.log(`✅ Success with model: ${modelName}`);
      return text;
    } catch (error) {
      console.error(`Model ${modelName} failed:`, error.message);
    }
  }

  throw new Error('All Gemini models failed. Please check your GEMINI_API_KEY.');
}

export async function summarizeExpenses(expenses) {
  const expenseText = expenses
    .map(e => `- ${e.description || e.type}: ₹${e.amount} (${e.category}) on ${e.date}`)
    .join('\n');

  const prompt = `Summarize these expenses briefly:\n${expenseText}\n\nProvide total and insights.`;

  const models = ['gemini-2.0-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash'];

  for (const modelName of models) {
    try {
      const model = genAI.getGenerativeModel({ model: modelName });
      const result = await model.generateContent(prompt);
      return result.response.text();
    } catch (error) {
      console.error(`Summarize model ${modelName} failed:`, error.message);
    }
  }

  throw new Error('Failed to summarize expenses.');
}
