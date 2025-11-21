// src/app/api/positions/[positionId]/candidates/route.ts
const MOCK_BASE = 'http://localhost:3001';

type RouteParams = {
  positionId: string;
};

export async function GET(
  _req: Request,
  ctx: { params: Promise<RouteParams> } // ✅ params 가 Promise 라고 타입 지정
) {
  // ✅ Promise 를 await 해서 실제 값 꺼내기
  const { positionId } = await ctx.params;

  const res = await fetch(`${MOCK_BASE}/positions/${positionId}/candidates`);

  if (!res.ok) {
    return new Response('Upstream mock API error', {
      status: res.status,
    });
  }

  const data = await res.json();
  return Response.json(data);
}
