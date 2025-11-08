"use client";

import { useState } from "react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [answer, setAnswer] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/ask", {
        method: "POST",
        body: JSON.stringify({ prompt }),
        headers: { "Content-Type": "application/json" },
      });
      const data = await res.json();
      setAnswer(data.answer ?? data.error);
    } catch (err) {
      setAnswer("Error: " + err);
    }
    setLoading(false);
  };

  return (
    <div className="p-8 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">LLM 테스트</h1>
      <input
        className="border p-2 w-full mb-2"
        placeholder="질문을 입력하세요"
        value={prompt}
        onChange={(e) => setPrompt(e.target.value)}
      />
      <button
        className="bg-blue-500 text-white px-4 py-2 mb-4"
        onClick={handleSubmit}
        disabled={loading}
      >
        {loading ? "로딩 중..." : "전송"}
      </button>
      {answer && (
        <div className="border p-4 bg-gray-100">
          <strong>답변:</strong>
          <p>{answer}</p>
        </div>
      )}
    </div>
  );
}