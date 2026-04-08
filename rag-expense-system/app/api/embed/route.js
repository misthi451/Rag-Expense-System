import { getEmbedding } from '@/lib/gemini';

export async function POST(request) {
  try {
    const { text } = await request.json();

    if (!text || text.trim().length === 0) {
      return Response.json(
        { success: false, error: 'Text cannot be empty' },
        { status: 400 }
      );
    }

    const embedding = await getEmbedding(text);

    return Response.json({
      success: true,
      embedding,
      dimensions: embedding.length,
    });
  } catch (error) {
    console.error('Embed API error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Embedding generation failed',
      },
      { status: 500 }
    );
  }
}
