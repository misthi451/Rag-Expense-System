import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Supabase is optional - app works without it using local file storage
let supabase = null;

if (supabaseUrl && supabaseKey) {
  supabase = createClient(supabaseUrl, supabaseKey);
}

export { supabase };

export async function searchByVector(embedding, matchCount = 5) {
  if (!supabase) throw new Error('Supabase not configured');
  const { data, error } = await supabase.rpc('match_documents', {
    query_embedding: embedding,
    match_count: matchCount,
    similarity_threshold: 0.5,
  });
  if (error) throw new Error(`Vector search failed: ${error.message}`);
  return data;
}
