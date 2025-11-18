export type Candidate = {
  id: string;
  name: string;
  email: string;
  role: string;
  score: number;
  skills: string[];
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

export type CandidateDetail = {
  id: string;
  positionId: string;
  name: string;
  title: string;
  experience: string;
  degree: string;
  score: number;
  topSkills: string[];
};

export type Position = {
  id: string;
  title: string;
  applicants: number;
};
