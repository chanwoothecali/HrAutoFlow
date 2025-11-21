// src/app/api/positions/route.ts
import { NextResponse } from 'next/server';

const MOCK_BASE = 'http://localhost:3001';

export async function GET() {
  const res = await fetch(`${MOCK_BASE}/positions`);
  if (!res.ok) {
    return NextResponse.json(
      { message: 'Failed to fetch positions' },
      { status: res.status }
    );
  }
  const data = await res.json();
  return NextResponse.json(data);
}
