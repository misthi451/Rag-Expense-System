/**
 * Refined High-Performance Weighted Keyword Search
 * 
 * Upgrades: 
 * 1. Substring Match (Weight: 50) - for long UPI IDs / descriptions
 * 2. Date Fragment Matching - for queries like "June 2"
 * 3. Reference Number Matching - for specific UPI tracking
 * 4. Recency-Based Tie-Breaking - Newest records first
 */

export function weightedSearch(expenses, query) {
  if (!expenses || expenses.length === 0) return [];
  
  const originalQ = query.toLowerCase();
  
  // Extract potential date fragments (e.g., month names, year-month patterns)
  const monthNames = ['jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'oct', 'nov', 'dec', 'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august', 'september', 'october', 'november', 'december'];
  const dateKeywords = monthNames.filter(m => originalQ.includes(m));
  
  // Extract number-like strings for amount and ref_number
  const numbers = originalQ.match(/\d+(\.\d+)?/g) || [];
  
  // Split query into keywords and filter out stop words
  const stopWords = new Set(['how', 'much', 'did', 'i', 'spend', 'on', 'the', 'for', 'what', 'was', 'my', 'all', 'show', 'me', 'to', 'from', 'of', 'via']);
  const keywords = originalQ.split(/\s+/).filter(word => word.length > 2 && !stopWords.has(word));
  
  const results = expenses.map(exp => {
    let score = 0;
    const cat = (exp.category || '').toLowerCase();
    const desc = (exp.description || '').toLowerCase();
    const mem = (exp.member || '').toLowerCase();
    const date = (exp.date || '').toLowerCase();
    const ref = (exp.ref_number || '').toLowerCase();
    
    // 1. Exact Reference Number / Substring Match (Highest priority)
    // If the user pastes a long unique number (like 473294611495), give it maximum priority.
    if (ref && originalQ.includes(ref) && ref.length > 5) {
      score += 100;
    }
    
    // 2. Full Description / Substring Match (High priority)
    if (desc && originalQ.length > 10 && desc.includes(originalQ)) {
      score += 50;
    }
    
    // 2. Date Matching (Priority)
    dateKeywords.forEach(m => {
      if (date && date.includes(m.substring(0, 3))) score += 20;
    });
    
    // 3. Category Match in Query
    if (cat && originalQ.includes(cat)) {
      score += 15;
    }
    
    // 4. Keyword matches
    keywords.forEach(word => {
      if (cat && cat.includes(word)) score += 10;
      if (desc && desc.includes(word)) score += 5;
      if (mem && mem.includes(word)) score += 5;
      if (ref && ref.includes(word)) score += 10; // Reference number matches (e.g. UPI ref)
    });

    // 5. Amount Match
    numbers.forEach(num => {
      if (exp.amount && exp.amount.toString() === num) score += 10;
      else if (exp.amount && exp.amount.toString().includes(num)) score += 2;
    });

    return { ...exp, score };
  });

  // Filter, then sort by score AND date (descending)
  return results
    .filter(r => r.score > 0)
    .sort((a, b) => {
      // Primary sort: Score (highest first)
      if (b.score !== a.score) return b.score - a.score;
      // Secondary sort: Date (newest first)
      return new Date(b.date) - new Date(a.date);
    })
    .slice(0, 20); // Return top 20 for broader context as requested
}
