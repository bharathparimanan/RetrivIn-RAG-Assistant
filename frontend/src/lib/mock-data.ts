import type { Question, Score } from '../types/session';

export const MOCK_QUESTIONS: Question[] = [
  { 
    id: 'q1', 
    text: "You listed Apache Airflow on your resume. Walk me through a DAG you designed — what triggered it, how you structured task dependencies, and what you'd do differently now.", 
    source: 'resume.pdf', 
    section: 'experience' 
  },
  { 
    id: 'q2', 
    text: 'Your resume mentions Delta Lake. Explain MERGE semantics — when would you use MERGE over a full overwrite, and what are the risks?', 
    source: 'resume.pdf', 
    section: 'skills' 
  },
  { 
    id: 'q3', 
    text: 'You have Kafka listed. Walk me through a producer-consumer setup you built — partition strategy, consumer group design, and how you handled message failures.', 
    source: 'resume.pdf', 
    section: 'experience' 
  },
  { 
    id: 'q4', 
    text: 'Explain idempotency in the context of a data pipeline. Give a concrete example from your experience where it saved you from a real problem.', 
    source: 'notes.pdf', 
    section: 'patterns' 
  },
  { 
    id: 'q5', 
    text: 'Your JD requires experience with data contracts. What is a data contract, who owns it, and how do you enforce one in a Medallion architecture?', 
    source: 'jd.pdf', 
    section: 'requirements' 
  },
  { 
    id: 'q6', 
    text: 'Walk me through how you would design a deduplication strategy for a high-volume event stream landing in a Delta Lake bronze layer.', 
    source: 'resume.pdf', 
    section: 'skills' 
  },
  { 
    id: 'q7', 
    text: 'You listed FastAPI. How would you design an async endpoint that triggers a long-running ingestion pipeline without blocking the response?', 
    source: 'resume.pdf', 
    section: 'skills' 
  },
  { 
    id: 'q8', 
    text: 'Explain the difference between SCD type 1 and type 2. When would you choose one over the other in a lakehouse architecture?', 
    source: 'notes.pdf', 
    section: 'concepts' 
  },
  { 
    id: 'q9', 
    text: 'Your experience shows dbt usage. How do you test data quality in dbt — what tests do you write, and what do you do when a test fails in production?', 
    source: 'resume.pdf', 
    section: 'experience' 
  },
  { 
    id: 'q10', 
    text: "Describe a time your pipeline failed in production. What broke, how did you find it, how did you fix it, and what did you put in place so it wouldn't happen again?", 
    source: 'resume.pdf', 
    section: 'experience' 
  },
];

export const MOCK_SCORE: Score = {
  score: 7,
  feedback: "Good structure. You named the tool but didn't explain the reasoning behind your design decisions — that's what senior roles test. Push deeper on the why.",
  strengths: ['Clear pipeline structure', 'Named specific tools'],
  gaps: ['Missing design rationale', 'No failure handling mentioned'],
};
