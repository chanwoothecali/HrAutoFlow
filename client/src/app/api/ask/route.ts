import { NextResponse } from "next/server";
import axios from "axios";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    const res = await axios.post("http://localhost:8000/llm/ask", { prompt });

    // axios는 res.data로 바로 접근 (await 불필요)
    return NextResponse.json(res.data);

  } catch (err) {
    console.error("API Error:", err);
    return NextResponse.json({ error: "서버 에러" }, { status: 500 });
  }
}