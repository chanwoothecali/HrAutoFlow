'use client';

import { useState, useEffect } from 'react';

type Evaluation = {
    id: number;
    evaluator: string;
    score: number;
    recommendation: string;
    feedback: string;
    created_at: string;
};

type EvaluationResponse = {
    evaluations: Evaluation[];
    statistics: {
        total_count: number;
        average_score: number;
        evaluator_count: number;
        by_evaluator: Record<string, {
            count: number;
            avg_score: number;
            latest_evaluation: string;
        }>;
    };
};

type HumanEvaluationProps = {
    candidateId: string;
    candidateName: string;
    aiScore: number;
};

export default function HumanEvaluation({
                                            candidateId,
                                            candidateName,
                                            aiScore,
                                        }: HumanEvaluationProps) {
    const [score, setScore] = useState<number>(0);
    const [feedback, setFeedback] = useState('');
    const [recommendation, setRecommendation] = useState<string>('');
    const [evaluator, setEvaluator] = useState<string>('평가자');
    const [saving, setSaving] = useState(false);
    const [evaluationData, setEvaluationData] = useState<EvaluationResponse | null>(null);
    const [showHistory, setShowHistory] = useState(false);

    // 기존 평가 목록 불러오기
    const loadEvaluations = () => {
        fetch(`/api/candidates/${candidateId}/feedback`)
            .then((res) => res.json())
            .then((data: EvaluationResponse) => {
                setEvaluationData(data);
            })
            .catch((err) => console.error('평가 목록 불러오기 실패:', err));
    };

    useEffect(() => {
        loadEvaluations();
    }, [candidateId]);

    const handleSave = async () => {
        if (score === 0) {
            alert('점수를 입력해주세요.');
            return;
        }
        if (!recommendation) {
            alert('추천 여부를 선택해주세요.');
            return;
        }
        if (feedback.length < 10) {
            alert('피드백을 최소 10자 이상 작성해주세요.');
            return;
        }
        if (!evaluator.trim()) {
            alert('평가자명을 입력해주세요.');
            return;
        }

        setSaving(true);

        try {
            await fetch(`/api/candidates/${candidateId}/feedback`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    score,
                    feedback,
                    recommendation,
                    evaluator: evaluator.trim(),
                }),
            });

            alert('새로운 평가가 저장되었습니다!');
            
            // 폼 초기화
            setScore(0);
            setFeedback('');
            setRecommendation('');
            
            // 평가 목록 새로고침
            loadEvaluations();
        } catch (error) {
            console.error('평가 저장 실패:', error);
            alert('저장에 실패했습니다.');
        } finally {
            setSaving(false);
        }
    };

    const handleDelete = async (evaluationId: number) => {
        if (!confirm('이 평가를 삭제하시겠습니까?')) return;

        try {
            await fetch(`/api/feedback/${evaluationId}`, {
                method: 'DELETE',
            });
            alert('평가가 삭제되었습니다.');
            loadEvaluations();
        } catch (error) {
            console.error('평가 삭제 실패:', error);
            alert('삭제에 실패했습니다.');
        }
    };

    const scoreDiff = score > 0 ? Math.abs(score - aiScore) : 0;
    const isHighDiff = scoreDiff > 15;

    return (
        <div className="rounded-xl border border-[#E6E6E7] bg-white p-6 shadow-lg">
            <div className="mb-4 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-slate-900">
                    사람 평가
                </h3>
                <div className="flex items-center gap-2">
                    {evaluationData && evaluationData.statistics.total_count > 0 && (
                        <div className="flex items-center gap-3 text-xs">
                            <span className="rounded-full bg-indigo-100 px-3 py-1 font-semibold text-indigo-700">
                                총 {evaluationData.statistics.total_count}개 평가
                            </span>
                            <span className="text-slate-600">
                                평균: <span className="font-bold text-indigo-600">{evaluationData.statistics.average_score}점</span>
                            </span>
                            <button
                                onClick={() => setShowHistory(!showHistory)}
                                className="rounded-md bg-slate-100 px-2 py-1 font-semibold text-slate-700 hover:bg-slate-200"
                            >
                                {showHistory ? '이력 숨기기' : '이력 보기'}
                            </button>
                        </div>
                    )}
                </div>
            </div>

            {/* 평가 이력 */}
            {showHistory && evaluationData && evaluationData.evaluations.length > 0 && (
                <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4">
                    <h4 className="mb-3 text-sm font-semibold text-slate-700">평가 이력</h4>
                    <div className="space-y-3">
                        {evaluationData.evaluations.map((evaluation) => (
                            <div
                                key={evaluation.id}
                                className="rounded-lg border border-slate-200 bg-white p-3"
                            >
                                <div className="mb-2 flex items-start justify-between">
                                    <div className="flex items-center gap-2">
                                        <span className="font-semibold text-slate-900">
                                            {evaluation.evaluator}
                                        </span>
                                        <span className="rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-bold text-indigo-700">
                                            {evaluation.score}점
                                        </span>
                                        <span className="text-xs text-slate-600">
                                            {evaluation.recommendation}
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-slate-500">
                                            {new Date(evaluation.created_at).toLocaleDateString('ko-KR')}
                                        </span>
                                        <button
                                            onClick={() => handleDelete(evaluation.id)}
                                            className="text-xs text-red-600 hover:text-red-700"
                                        >
                                            삭제
                                        </button>
                                    </div>
                                </div>
                                <p className="text-sm text-slate-600">{evaluation.feedback}</p>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {/* 새 평가 작성 폼 */}
            <div className="space-y-5">
                {/* 평가자명 입력 */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        평가자명
                    </label>
                    <input
                        type="text"
                        value={evaluator}
                        onChange={(e) => setEvaluator(e.target.value)}
                        placeholder="평가자 이름을 입력하세요"
                        className="w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                </div>

                {/* 점수 입력 */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        평가 점수
                    </label>
                    <div className="flex items-center gap-4">
                        <input
                            type="range"
                            min="0"
                            max="100"
                            step="5"
                            value={score}
                            onChange={(e) => setScore(Number(e.target.value))}
                            className="flex-1 accent-indigo-600"
                        />
                        <div className="flex flex-col items-center gap-1">
              <span className="inline-flex h-14 w-16 items-center justify-center rounded-lg border-2 border-indigo-500 bg-indigo-50 text-2xl font-bold text-indigo-700">
                {score}
              </span>
                            <span className="text-[10px] text-slate-500">점</span>
                        </div>
                    </div>

                    {/* AI와의 차이 */}
                    {score > 0 && (
                        <div className="mt-2 flex items-center justify-between text-xs">
                            <span className="text-slate-600">
                                AI 점수: <span className="font-semibold">{aiScore}점</span>
                            </span>
                            <span
                                className={`font-semibold ${
                                    isHighDiff ? 'text-red-600' : 'text-slate-600'
                                }`}
                            >
                                차이: {scoreDiff}점
                                {isHighDiff && ' (큰 차이!)'}
                            </span>
                        </div>
                    )}
                </div>

                {/* 추천 여부 */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        추천 여부
                    </label>
                    <div className="grid grid-cols-4 gap-2">
                        {[
                            { value: '강력 추천', color: 'emerald', icon: '🌟' },
                            { value: '추천', color: 'blue', icon: '👍' },
                            { value: '보류', color: 'amber', icon: '🤔' },
                            { value: '거부', color: 'red', icon: '❌' },
                        ].map((option) => (
                            <button
                                key={option.value}
                                onClick={() => setRecommendation(option.value)}
                                className={`flex flex-col items-center gap-1 rounded-lg border-2 px-3 py-2 text-xs font-semibold transition ${
                                    recommendation === option.value
                                        ? `border-${option.color}-500 bg-${option.color}-50 text-${option.color}-700`
                                        : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300'
                                }`}
                            >
                                <span className="text-lg">{option.icon}</span>
                                <span>{option.value}</span>
                            </button>
                        ))}
                    </div>
                </div>

                {/* 피드백 */}
                <div>
                    <label className="mb-2 block text-sm font-semibold text-slate-700">
                        종합 피드백
                    </label>
                    <textarea
                        value={feedback}
                        onChange={(e) => setFeedback(e.target.value)}
                        placeholder={`${candidateName} 지원자에 대한 종합적인 평가를 작성해주세요.\n\n예시:\n- 기술적 역량\n- 커뮤니케이션 능력\n- 팀 적합도\n- 채용 의견`}
                        className="h-40 w-full rounded-lg border border-[#E6E6E7] px-3 py-2 text-sm outline-none placeholder:text-slate-400 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500"
                    />
                    <div className="mt-1 flex items-center justify-between text-xs">
                        <span
                            className={
                                feedback.length < 10 ? 'text-red-500' : 'text-slate-500'
                            }
                        >
                            {feedback.length}자 / 최소 10자
                        </span>
                        {feedback.length >= 50 && (
                            <span className="text-emerald-600">✓ 충분한 피드백</span>
                        )}
                    </div>
                </div>

                {/* 저장 버튼 */}
                <button
                    onClick={handleSave}
                    disabled={
                        saving || score === 0 || !recommendation || feedback.length < 10 || !evaluator.trim()
                    }
                    className="w-full rounded-full bg-indigo-600 py-3 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                    {saving ? '저장 중...' : '새 평가 저장'}
                </button>
            </div>
        </div>
    );
}