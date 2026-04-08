import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const expenseData = await req.json();

    if (!Array.isArray(expenseData)) {
      return Response.json(
        { success: false, error: 'Invalid data format. Expected an array of expenses.' },
        { status: 400 }
      );
    }

    console.log(`Processing ${expenseData.length} records...`);
    const startTime = Date.now();

    // Format data for Supabase documents table
    const records = expenseData.map(exp => ({
      content: exp.description || exp.content || 'Expense',
      category: exp.category || null,
      amount: parseFloat(exp.amount) || 0,
      date: exp.date || null,
      member: exp.member || null,
    }));

    // Insert in batches of 500
    const BATCH_SIZE = 500;
    let totalInserted = 0;

    for (let i = 0; i < records.length; i += BATCH_SIZE) {
      const batch = records.slice(i, i + BATCH_SIZE);
      const { error } = await supabase.from('documents').insert(batch);
      if (error) {
        console.error('Insert error:', error.message);
      } else {
        totalInserted += batch.length;
      }
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Inserted ${totalInserted} records in ${duration}s`);

    return Response.json({
      success: true,
      processed: totalInserted,
      total: totalInserted,
      time: `${duration}s`,
    });
  } catch (error) {
    console.error('Process data error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const { error } = await supabase.from('documents').delete().neq('id', 0);
    if (error) throw error;
    return Response.json({ success: true, message: 'All data cleared.' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
