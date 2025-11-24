// app/api/resumes/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000/api';

/**
 * POST /api/resumes
 * 이력서 업로드 및 처리
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // FastAPI로 FormData 전달
    const response = await fetch(`${FASTAPI_BASE_URL}/resumes`, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to upload resume', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('Error in POST /api/resumes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

/**
 * GET /api/resumes
 * 이력서 목록 조회
 * Query params: applicant_id
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const applicantId = searchParams.get('applicant_id');

    // FastAPI로 요청 전달
    const url = applicantId
      ? `${FASTAPI_BASE_URL}/resumes?applicant_id=${applicantId}`
      : `${FASTAPI_BASE_URL}/resumes`;

    const response = await fetch(url, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    if (!response.ok) {
      const errorText = await response.text();
      return NextResponse.json(
        { error: 'Failed to fetch resumes', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    console.error('Error in GET /api/resumes:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}