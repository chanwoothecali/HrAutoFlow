// src/app/api/applicants/route.ts
import { NextResponse } from 'next/server';

const MOCK_BASE = 'http://localhost:3001';

export async function GET() {
  try {
    const res = await fetch(`${MOCK_BASE}/applicants`, {
      cache: 'no-store',
    });

    if (!res.ok) {
      return NextResponse.json(
        { message: 'Mockoon /applicants 요청 실패' },
        { status: res.status }
      );
    }

    const data = await res.json();
    return NextResponse.json(data);
  } catch (err) {
    console.error('GET /api/applicants error:', err);
    return NextResponse.json(
      { message: '서버 내부 오류 (applicants)' },
      { status: 500 }
    );
  }
}
