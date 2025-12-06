import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // 쿼리 파라미터 전달
  const params = new URLSearchParams();
  if (searchParams.has('candidate_id')) {
    params.set('candidate_id', searchParams.get('candidate_id')!);
  }
  if (searchParams.has('min_score')) {
    params.set('min_score', searchParams.get('min_score')!);
  }
  if (searchParams.has('limit')) {
    params.set('limit', searchParams.get('limit')!);
  }
  if (searchParams.has('offset')) {
    params.set('offset', searchParams.get('offset')!);
  }

  try {
    const response = await fetch(
      `${API_BASE_URL}/api/evaluations?${params.toString()}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    if (!response.ok) {
      const errorText = await response.text();
      console.error('Backend error:', errorText);
      return NextResponse.json(
        { error: 'Failed to fetch evaluations' },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error fetching evaluations:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
