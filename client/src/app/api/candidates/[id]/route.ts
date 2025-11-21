// src/app/api/candidates/[id]/route.ts
import { NextResponse } from 'next/server';

const MOCK_BASE = 'http://localhost:3001';

export async function GET(
  _request: Request,
  context: { params: Promise<{ id: string }> } // ✅ params 가 Promise 임
) {
  try {
    // ✅ Promise unwrap
    const { id } = await context.params;

    const res = await fetch(`${MOCK_BASE}/candidates/${id}`);

    if (!res.ok) {
      return NextResponse.json(
        { message: 'Mockoon candidates not found' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('GET /api/candidates/[id] error:', error);
    return NextResponse.json(
      { message: 'Internal Server Error' },
      { status: 500 }
    );
  }
}
