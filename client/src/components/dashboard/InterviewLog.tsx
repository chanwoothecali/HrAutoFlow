// src/components/dashboard/InterviewLog.tsx
'use client';

type InterviewItem = {
  timeLabel: string;
  title: string;
  description: string;
  badge?: 'Today' | 'This Week' | 'Yesterday';
};

const upcoming: InterviewItem[] = [
  {
    timeLabel: '10:00 Today',
    title: 'David Lee · Backend 1차 인터뷰',
    description: '인터뷰어: 김HR · Zoom · 45분 미팅',
    badge: 'Today',
  },
  {
    timeLabel: '15:30 Today',
    title: 'Hana Kim · Data Engineer 1차 인터뷰',
    description: '인터뷰어: 박팀장 · 온사이트 인터뷰 · A 회의실',
    badge: 'Today',
  },
  {
    timeLabel: '11:00 Tomorrow',
    title: 'Sunny Choi · ML 리서치 인터뷰',
    description: '인터뷰어: 이리더 · Zoom · 60분 미팅',
  },
];

const logs: InterviewItem[] = [
  {
    timeLabel: 'Yesterday · 16:42',
    title: 'AI 매니저가 David Lee 서류 스크리닝 완료',
    description: '상태: 서류 통과 · Backend Developer',
    badge: 'Yesterday',
  },
  {
    timeLabel: 'Today · 11:05',
    title: 'Hana Kim 인터뷰 일정 확정',
    description: '내일 1차 인터뷰 · 45분',
  },
  {
    timeLabel: 'Today · 09:10',
    title: '채용 담당자 김HR이 JD 요구 스킬 수정',
    description: 'Python, SQL, Kafka 추가',
  },
];

export default function InterviewLog() {
  return (
    // 🔹 카드 전체 높이 제한 (원하면 숫자 조절: 420, 480 등)
    <div className="flex max-h-[480px] flex-col rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm">
      {/* 헤더 */}
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-xl font-semibold text-slate-900">
          Interview & Communication
        </h2>
        <button className="text-xs font-semibold text-indigo-600">
          전체 보기
        </button>
      </div>

      {/* 상단 탭 */}
      <div className="mb-3 flex gap-2 text-xs">
        <button className="rounded-full bg-slate-900 px-3 py-1 font-semibold text-white">
          Today
        </button>
        <button className="rounded-full bg-slate-100 px-3 py-1 text-slate-600">
          This Week
        </button>
      </div>

      {/* 🔽 리스트 영역: 카드 높이를 넘으면 여기서만 스크롤 */}
      <div className="flex-1 overflow-y-auto pr-1">
        {/* 다가오는 인터뷰 */}
        <div className="space-y-3">
          {upcoming.map((item, idx) => (
            <div
              key={`upcoming-${idx}`}
              className="rounded-xl border border-[#E6E6E7] bg-slate-50 px-4 py-3"
            >
              <div className="flex items-center justify-between text-xs text-slate-500">
                <span>{item.timeLabel}</span>
                {item.badge && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="mt-1 text-sm font-semibold text-slate-900">
                {item.title}
              </p>
              <p className="mt-0.5 text-xs text-slate-600">
                {item.description}
              </p>
            </div>
          ))}
        </div>

        {/* 최근 액션 로그 */}
        <h3 className="mt-5 mb-2 text-xs font-semibold uppercase text-slate-500">
          최근 액션 로그
        </h3>
        <div className="space-y-2 text-xs pb-1">
          {logs.map((item, idx) => (
            <div
              key={`log-${idx}`}
              className="rounded-lg bg-slate-50 px-3 py-2"
            >
              <div className="flex items-center justify-between text-[11px] text-slate-500">
                <span>{item.timeLabel}</span>
                {item.badge && (
                  <span className="rounded-full bg-indigo-50 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                    {item.badge}
                  </span>
                )}
              </div>
              <p className="mt-0.5 font-semibold text-slate-900">
                {item.title}
              </p>
              <p className="mt-0.5 text-slate-600">{item.description}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
