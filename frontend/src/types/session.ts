export type Mode = 'trainer' | 'introspect' | 'retrospective';

export interface Question {
  id: string;
  text: string;
  source: string;
  section: string;
}

export interface Answer {
  questionId: string;
  text: string;
}

export interface Score {
  score: number;
  feedback: string;
  strengths: string[];
  gaps: string[];
}

export interface SessionEntry {
  question: Question;
  answer?: Answer;
  score?: Score;
}
