import { createClient } from '@supabase/supabase-js';
import { generateAnswer } from './gemini';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function ragQuery(question) {
  try {
    console.log(`\n🔍 RAG Query: "${question}"`);

    // Extract keywords from question
    const stopWords = new Set(['how', 'much', 'did', 'i', 'spend', 'on', 'the', 'for', 'what', 'was', 'my', 'all', 'show', 'me', 'to', 'from', 'of', 'via']);
    const keywords = question.toLowerCase()
      .split(/\s+/)
      .filter(w => w.length > 2 && !stopWords.has(w));

    console.log('Keywords:', keywords);

    let documents = [];

    // Search by category
    for (const keyword of keywords) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .ilike('category', `%${keyword}%`)
        .limit(10);

      if (!error && data) documents.push(...data);
    }

    // Search by content/description
    for (const keyword of keywords) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .ilike('content', `%${keyword}%`)
        .limit(10);

      if (!error && data) documents.push(...data);
    }

    // Search by member name
    for (const keyword of keywords) {
      const { data, error } = await supabase
        .from('documents')
        .select('*')
        .ilike('member', `%${keyword}%`)
        .limit(10);

      if (!error && data) documents.push(...data);
    }

    // Remove duplicates
    const seen = new Set();
    documents = documents.filter(doc => {
      if (seen.has(doc.id)) return false;
      seen.add(doc.id);
      return true;
    });

    console.log(`📊 Found ${documents.length} records`);

    if (documents.length === 0) {
      return {
        answer: 'No matching records found. Try searching by category (e.g., "Food", "Travel") or a person\'s name.',
        sources: 0,
        documents: [],
      };
    }

    // Build context
    const context = documents
      .slice(0, 20)
      .map(doc => `- ${doc.content} (Category: ${doc.category}, Amount: ₹${doc.amount}, Date: ${doc.date}, Member: ${doc.member || 'N/A'})`)
      .join('\n');

    const answer = await generateAnswer(context, question);

    return {
      answer,
      sources: documents.length,
      documents: documents.slice(0, 20).map(d => ({
        content: d.content,
        category: d.category,
        amount: d.amount,
        date: d.date,
        member: d.member,
      })),
    };
  } catch (error) {
    console.error('RAG query error:', error);
    throw new Error(`RAG query failed: ${error.message}`);
  }
}
