import { saveExpenses, clearExpenses, getExpenses } from '@/lib/store';

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

    const total = saveExpenses(expenseData);

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`✅ Saved! Total in memory: ${total}`);

    return Response.json({
      success: true,
      processed: expenseData.length,
      total,
      time: `${duration}s`,
    });
  } catch (error) {
    console.error('Process data error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    clearExpenses();
    return Response.json({ success: true, message: 'All data cleared.' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
