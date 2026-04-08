import { generateAnswer } from './gemini';
import { weightedSearch } from './search';
import { getExpenses } from './store';

/**
 * Hybrid search using weighted keywords
 */
export async function searchDocuments(query, limit = 20) {
  try {
    const expenses = getExpenses();
    console.log(`Total expenses in memory: ${expenses.length}`);
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
    console.log(`\n🔍 RAG Query: "${question}"`);

    const expenses = getExpenses();
    console.log(`Expenses in memory: ${expenses.length}`);

    if (expenses.length === 0) {
      return {
        answer: 'No expense data found. Please upload your JSON file first.',
        sources: 0,
        documents: [],
      };
    }

    const documents = await searchDocuments(question, 20);

    if (documents.length === 0) {
      return {
        answer: 'No matching records found. Try searching by category (e.g., "Food", "Travel") or description.',
        sources: 0,
        documents: [],
      };
    }

    const context = documents
      .map(doc => `- ${doc.description || 'Expense'} (Category: ${doc.category}, Amount: ₹${doc.amount}, Date: ${doc.date}, Member: ${doc.member || 'N/A'}, Ref: ${doc.ref_number || 'N/A'})`)
      .join('\n');

    console.log(`📊 Found ${documents.length} relevant records.`);

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
        ref_number: d.ref_number,
      })),
    };
  } catch (error) {
    console.error('RAG query error:', error);
    throw new Error(`RAG query failed: ${error.message}`);
  }
}

export async function getStats() {
  try {
    const data = getExpenses();

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
    throw new Error(`Failed to get stats: ${error.message}`);
  }
}
