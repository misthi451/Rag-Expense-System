import fs from 'fs';
import path from 'path';
import { generateAnswer } from './gemini';
import { weightedSearch } from './search';

const DATA_PATH = path.join(process.cwd(), 'data', 'expenses.json');

/**
 * Load all expenses from the local JSON store
 */
function getLocalExpenses() {
  try {
    if (!fs.existsSync(DATA_PATH)) return [];
    const raw = fs.readFileSync(DATA_PATH, 'utf-8');
    return JSON.parse(raw);
  } catch (error) {
    console.error('Error reading local data:', error);
    return [];
  }
}

/**
 * Hybrid search using weighted keywords
 */
export async function searchDocuments(query, limit = 10) {
  try {
    const expenses = getLocalExpenses();
    const results = weightedSearch(expenses, query);
    return results.slice(0, limit);
  } catch (error) {
    console.error('Search error:', error);
    throw new Error(`Keyword search failed: ${error.message}`);
  }
}

/**
 * Main RAG query function
 */
export async function ragQuery(question) {
  try {
    console.log(`\n🔍 Hybrid RAG Query for: "${question}"`);

    // Step 1: Search for relevant documents (Hybrid Keyword Search - Reliable for 168k)
    // ✅ Updated limit to 20 as requested for broader data access
    const documents = await searchDocuments(question, 20);
    
    if (documents.length === 0) {
      return {
        answer: 'I could not find any expense records matching your query. Please try searching for a category (e.g., "Food", "Travel") or a specific description.',
        sources: 0,
        documents: [],
      };
    }

    // Step 2: Build context from retrieved documents (Enriched Context)
    const context = documents
      .map(doc => `- ${doc.description || 'Expense'} (Category: ${doc.category}, Amount: ₹${doc.amount}, Date: ${doc.date}, Member: ${doc.member || 'N/A'}, Ref: ${doc.ref_number || 'N/A'})`)
      .join('\n');

    console.log(`📊 Found ${documents.length} relevant records for context.`);

    // Step 3: Generate answer using Gemini (AI) with context
    const answer = await generateAnswer(context, question);

    return {
      answer,
      sources: documents.length,
      documents: documents.map(d => ({
        content: d.description,
        category: d.category,
        amount: d.amount,
        date: d.date,
        member: d.member,
        ref_number: d.ref_number
      })),
    };
  } catch (error) {
    console.error('RAG query error:', error);
    throw new Error(`Hybrid RAG query failed: ${error.message}`);
  }
}

/**
 * Stats and filtering (now working on the local JSON file)
 */
export async function getStats() {
  try {
    const data = getLocalExpenses();
    
    const stats = {
      totalExpenses: data.length,
      totalAmount: data.reduce((sum, d) => sum + (parseFloat(d.amount) || 0), 0),
      byCategory: {},
      byMember: {},
    };

    data.forEach(d => {
      if (d.category) {
        stats.byCategory[d.category] = (stats.byCategory[d.category] || 0) + (parseFloat(d.amount) || 0);
      }
      if (d.member) {
        stats.byMember[d.member] = (stats.byMember[d.member] || 0) + (parseFloat(d.amount) || 0);
      }
    });

    return stats;
  } catch (error) {
    console.error('Stats error:', error);
    throw new Error(`Failed to get stats: ${error.message}`);
  }
}
