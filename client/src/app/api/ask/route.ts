// app/api/ask/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000/api';

/**
 * POST /api/ask
 * 이력서에 대한 질문 (RAG 기반 QA)
 * Body: { resumeId: string, question: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { resumeId, question } = body;

    if (!resumeId || !question) {
      return NextResponse.json(
        { error: 'resumeId and question are required' },
        { status: 400 }
      );
    }

    // FastAPI로 요청 전달
    const response = await fetch(`${FASTAPI_BASE_URL}/llm/ask`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume_ids: [resumeId],
        question: question,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to process question', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/ask:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}