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
