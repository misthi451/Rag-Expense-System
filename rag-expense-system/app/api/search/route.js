import { ragQuery } from '@/lib/rag';

export async function POST(request) {
  try {
    const { question } = await request.json();

    // Validate input
    if (!question || question.trim().length === 0) {
      return Response.json(
        { success: false, error: 'Question cannot be empty' },
        { status: 400 }
      );
    }

    // Execute RAG query
    const result = await ragQuery(question);

    return Response.json({
      success: true,
      ...result,
    });
  } catch (error) {
    console.error('Search API error:', error);
    return Response.json(
      {
        success: false,
        error: error.message || 'Search failed'
      },
      { status: 500 }
    );
  }
}
