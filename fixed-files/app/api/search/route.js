import fs from 'fs';
import path from 'path';

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

    const dataDir = path.join(process.cwd(), 'data');
    const dataPath = path.join(dataDir, 'expenses.json');

    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }

    let existingData = [];
    if (fs.existsSync(dataPath)) {
      try {
        const raw = fs.readFileSync(dataPath, 'utf-8');
        existingData = JSON.parse(raw);
      } catch (e) {
        console.warn('Existing data corrupted, starting fresh.');
      }
    }

    const combined = [...existingData, ...expenseData];

    try {
      fs.writeFileSync(dataPath, JSON.stringify(combined, null, 2));
    } catch (writeError) {
      console.warn('File write failed (Vercel read-only FS):', writeError.message);
    }

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    return Response.json({
      success: true,
      processed: expenseData.length,
      total: combined.length,
      time: `${duration}s`,
    });
  } catch (error) {
    console.error('Process data API error:', error);
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}

export async function DELETE() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'expenses.json');
    if (fs.existsSync(dataPath)) {
      fs.unlinkSync(dataPath);
    }
    return Response.json({ success: true, message: 'All data cleared.' });
  } catch (error) {
    return Response.json({ success: false, error: error.message }, { status: 500 });
  }
}
