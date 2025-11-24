// app/api/applicants/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000/api';

/**
 * GET /api/applicants
 * 전체 지원자 목록 조회
 * Query params: status, position_id
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const status = searchParams.get('status');
    const positionId = searchParams.get('position_id');

    // FastAPI로 요청 전달
    const params = new URLSearchParams();
    if (status) params.append('status', status);
    if (positionId) params.append('position_id', positionId);

    const queryString = params.toString();
    const url = `${FASTAPI_BASE_URL}/applicants${queryString ? `?${queryString}` : ''}`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store', // 항상 최신 데이터
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch applicants', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in /api/applicants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * POST /api/applicants
 * 새 지원자 등록 (이력서 업로드 포함)
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // FastAPI로 FormData 전달
    const response = await fetch(`${FASTAPI_BASE_URL}/applicants`, {
      method: 'POST',
      body: formData, // FormData 그대로 전달
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to create applicant', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/applicants:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}