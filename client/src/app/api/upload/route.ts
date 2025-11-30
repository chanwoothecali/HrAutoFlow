// app/api/upload/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000/api';

/**
 * POST /api/upload
 * 이력서 업로드 및 지원자 등록
 *
 * FastAPI 엔드포인트: POST /api/upload/
 */
export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();

    // 프론트엔드에서 받은 필드
    const resume = formData.get('resume');
    const name = formData.get('name');
    const email = formData.get('email');
    const positionId = formData.get('position_id');
    const phone = formData.get('phone');
    const experienceYears = formData.get('experience_years');
    const education = formData.get('education');

    console.log('[Next.js API] Received fields:', {
      hasResume: !!resume,
      name,
      email,
      positionId,
    });

    // 필수 필드 검증
    if (!resume || !(resume instanceof File)) {
      return NextResponse.json(
        { error: 'Resume file is required' },
        { status: 400 }
      );
    }
    if (!name) {
      return NextResponse.json(
        { error: 'Name is required' },
        { status: 400 }
      );
    }
    if (!positionId) {
      return NextResponse.json(
        { error: 'Position is required' },
        { status: 400 }
      );
    }

    // ✅ File을 Buffer로 변환
    const arrayBuffer = await resume.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    console.log('[Next.js API] File info:', {
      fileName: resume.name,
      fileType: resume.type,
      fileSize: buffer.length,
    });

    // ✅ form-data 라이브러리 동적 import
    const FormData = (await import('form-data')).default;
    const backendFormData = new FormData();

    // File을 Buffer로 추가 (filename, content-type 포함)
    backendFormData.append('file', buffer, {
      filename: resume.name,
      contentType: resume.type || 'application/pdf',
    });

    backendFormData.append('name', name as string);
    backendFormData.append('position_id', positionId as string);

    // 선택적 필드 추가
    if (email) backendFormData.append('email', email as string);
    if (phone) backendFormData.append('phone', phone as string);
    if (education) backendFormData.append('education', education as string);
    if (experienceYears) backendFormData.append('experience_years', experienceYears as string);

    console.log('[Next.js API] Sending to FastAPI:', {
      url: `${FASTAPI_BASE_URL}/upload/`,
      name,
      position: positionId,
      fileName: resume.name,
      fileSize: buffer.length,
    });

    // ✅ form-data의 getHeaders()로 올바른 헤더 설정
    const response = await fetch(`${FASTAPI_BASE_URL}/upload/`, {
      method: 'POST',
      headers: backendFormData.getHeaders(),
      body: backendFormData as any,
    });

    console.log('[Next.js API] FastAPI response status:', response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[Next.js API] FastAPI error:', errorText);
      return NextResponse.json(
        { error: 'Failed to upload resume', details: errorText },
        { status: response.status }
      );
    }

    const data = await response.json();
    console.log('[Next.js API] Upload success:', data);

    return NextResponse.json(data, { status: 201 });
  } catch (error) {
    console.error('[Next.js API] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: String(error) },
      { status: 500 }
    );
  }
}