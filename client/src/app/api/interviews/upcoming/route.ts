// app/api/interviews/upcoming/route.ts
import { NextRequest, NextResponse } from 'next/server';

const FASTAPI_BASE_URL = process.env.FASTAPI_BASE_URL || 'http://localhost:8000/api';

/**
 * GET /api/interviews/upcoming
 * 다가오는 인터뷰 일정 조회
 * Query params: days (1=오늘, 7=이번주)
 */
export async function GET(request: NextRequest) {
    try {
        const searchParams = request.nextUrl.searchParams;
        const days = searchParams.get('days') || '1';

        const response = await fetch(
            `${FASTAPI_BASE_URL}/interviews/upcoming?days=${days}`,
            {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
                cache: 'no-store',
            }
        );

        if (!response.ok) {
            const errorText = await response.text();
            return NextResponse.json(
                { error: 'Failed to fetch interviews', details: errorText },
                { status: response.status }
            );
        }

        const data = await response.json();
        return NextResponse.json(data);
    } catch (error) {
        console.error('Error in /api/interviews/upcoming:', error);
        return NextResponse.json(
            { error: 'Internal server error' },
            { status: 500 }
        );
    }
}