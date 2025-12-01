export type Candidate = {
    id: string;
    name: string;
    email: string;
    role: string;
    score: number;
    skills: string[];
    education?: string;
    experienceYears?: number;
};

export type CandidateCardProps = {
  name: string;
  role: string;
  score: number;
  skills: string[];
};

export type CandidateTableProps = {
  candidates: Candidate[];
};

export type SkillScore = {
  skill: string;
  score: number; // 0 ~ 100
};

export type WorkExperienceItem = {
  company: string;
  period: string;
  role: string;
  description: string;
};

export type CandidateOverviewSection = {
  recommendation: string;
  summary: string;
  summaryChart: SkillScore[];
  strength: string[]; // bullet list
  workExperience: WorkExperienceItem[];
};

export type CandidateDetail = {
  id: string;
  name: string;
  title: string;
  positionId: string;
  positionTitle: string;

  experienceYears: number;
  experienceLabel: string; // "3 years"
  degree: string; // "Bachelor"
  status: string; // "In Progress" 등

  score: number;
  keywords: string[];
  resumeId?: number;

  sections: {
    overview: CandidateOverviewSection;
  };
};
