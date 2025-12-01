// src/components/dashboard/QuickSettings.tsx
'use client';

import { useState } from 'react';
import type { FilterSettings } from '@/app/dashboard/page';

interface QuickSettingsProps {
    onApplyFilters: (filters: FilterSettings) => void;
    currentFilters: FilterSettings;
}

export default function QuickSettings({ onApplyFilters, currentFilters }: QuickSettingsProps) {
    const [education, setEducation] = useState<string | null>(currentFilters.education);
    const [minYears, setMinYears] = useState(currentFilters.minYears);
    const [selectedSkills, setSelectedSkills] = useState<string[]>(currentFilters.skills);

    const availableSkills = ['Python', 'SQL', 'REST', 'Docker', 'JavaScript', 'React', 'Node.js', 'AWS'];

    const handleSkillToggle = (skill: string) => {
        setSelectedSkills(prev =>
            prev.includes(skill)
                ? prev.filter(s => s !== skill)
                : [...prev, skill]
        );
    };

    const handleSave = () => {
        onApplyFilters({
            education,
            minYears,
            skills: selectedSkills,
        });
    };

    const handleReset = () => {
        setEducation(null);
        setMinYears(0);
        setSelectedSkills([]);
        onApplyFilters({
            education: null,
            minYears: 0,
            skills: [],
        });
    };

    return (
        <div className="rounded-2xl border border-[#E6E6E7] bg-white p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900">
                Candidate Requirement (Quick Settings)
            </h2>

            <div className="mt-5 space-y-5 text-sm text-slate-800">
                {/* 학력 */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                        Education
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {['Bachelor', 'Master', 'PhD'].map((edu) => (
                            <button
                                key={edu}
                                onClick={() => setEducation(education === edu ? null : edu)}
                                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                                    education === edu
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {edu}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 경력 */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                        Min. Years of Experience
                    </p>
                    <input
                        type="number"
                        value={minYears}
                        onChange={(e) => setMinYears(parseInt(e.target.value) || 0)}
                        min={0}
                        max={20}
                        className="w-20 rounded-md border border-[#E6E6E7] px-2 py-1 text-xs text-slate-800 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                </div>

                {/* 스킬 */}
                <div>
                    <p className="mb-2 text-xs font-semibold uppercase text-slate-500">
                        Required Skills
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {availableSkills.map((skill) => (
                            <button
                                key={skill}
                                onClick={() => handleSkillToggle(skill)}
                                className={`rounded-lg px-3 py-1 text-xs font-semibold transition ${
                                    selectedSkills.includes(skill)
                                        ? 'bg-indigo-100 text-indigo-700'
                                        : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                                }`}
                            >
                                {skill}
                            </button>
                        ))}
                    </div>
                </div>

                {/* 버튼 */}
                <div className="flex justify-end gap-2 pt-2">
                    <button
                        onClick={handleReset}
                        className="rounded-lg bg-slate-100 px-4 py-1 text-xs font-semibold text-slate-700 hover:bg-slate-200"
                    >
                        Reset
                    </button>
                    <button
                        onClick={handleSave}
                        className="rounded-lg bg-indigo-600 px-4 py-1 text-xs font-semibold text-white hover:bg-indigo-700"
                    >
                        Save
                    </button>
                </div>
            </div>
        </div>
    );
}