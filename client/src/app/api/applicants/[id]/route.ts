// app/api/applicants/[id]/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000/api';

/**
 * DELETE /api/applicants/[id]
 * 지원자 삭제
 */
export async function DELETE(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }  // ← Promise로 변경!
) {
    try {
        // params를 await로 받기
        const { id } = await context.params;  // ← await 추가!

        console.log('Deleting applicant ID:', id);  // 디버깅

        // string을 number로 변환
        const applicantId = parseInt(id, 10);

        if (isNaN(applicantId)) {
            return NextResponse.json(
                { error: 'Invalid applicant ID' },
                { status: 400 }
            );
        }

        const response = await fetch(`${FASTAPI_BASE_URL}/applicants/${applicantId}`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error('FastAPI error:', errorText);
            return NextResponse.json(
                { error: 'Failed to delete applicant', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in DELETE /api/applicants/[id]:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}