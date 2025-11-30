// src/types/position.ts

// 공고 상태 타입
export type PositionStatus = 'Open' | 'Closed'; // 필요하면 나중에 'OnHold' 추가

// Mock API / 화면에서 쓰는 Position 공고 타입
export type Position = {
  id: string;
  title: string;
  department: string;
  techStack: string;
  minYears: string;
  projectExperience: string;
  preferred: string;
  headcount: string;
  status: PositionStatus;
  applicants: number;
};

// Position 폼 데이터 타입
export type PositionFormData = {
  title: string;
  department: string;
  techStack: string;
  minYears: string;
  projectExperience: string;
  preferred: string;
  headcount: string;
  status: PositionStatus;
};
