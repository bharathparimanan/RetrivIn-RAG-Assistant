import { useState, useCallback } from 'react';
import { MOCK_QUESTIONS, MOCK_SCORE } from '../lib/mock-data';
import type { SessionEntry, Question } from '../types/session';

export function useSession() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [entries, setEntries] = useState<SessionEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'question' | 'answered' | 'scored' | 'complete'>('idle');

  const currentQuestion: Question | null = questions[currentIndex] || null;

  // Load an external question set and start the session
  const initSession = useCallback((qs: Question[]) => {
    const source = qs.length > 0 ? qs : MOCK_QUESTIONS;
    setQuestions(source);
    setCurrentIndex(0);
    setEntries([{ question: source[0] }]);
    setStatus('question');
  }, []);

  const submitAnswer = useCallback((text: string) => {
    if (status !== 'question' || !currentQuestion) return;

    setStatus('answered');
    setEntries((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last) {
        last.answer = { questionId: currentQuestion.id, text };
      }
      return copy;
    });

    setTimeout(() => {
      setStatus('scored');
      setEntries((prev) => {
        const copy = [...prev];
        const last = copy[copy.length - 1];
        if (last) {
          last.score = { ...MOCK_SCORE };
        }
        return copy;
      });

      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < questions.length) {
            setEntries((prevEntries) => [
              ...prevEntries,
              { question: questions[nextIndex] }
            ]);
            setStatus('question');
          } else {
            setStatus('complete');
          }
          return nextIndex;
        });
      }, 1200);
    }, 400);
  }, [status, currentQuestion, questions]);

  const skipQuestion = useCallback(() => {
    if (status !== 'question' || !currentQuestion) return;

    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < questions.length) {
        setEntries((prevEntries) => [
          ...prevEntries,
          { question: questions[nextIndex] }
        ]);
        setStatus('question');
      } else {
        setStatus('complete');
      }
      return nextIndex;
    });
  }, [status, currentQuestion, questions]);

  const restartSession = useCallback(() => {
    const source = questions.length > 0 ? questions : MOCK_QUESTIONS;
    setCurrentIndex(0);
    setEntries([{ question: source[0] }]);
    setStatus('question');
  }, [questions]);

  return {
    entries,
    currentIndex,
    currentQuestion,
    status,
    initSession,
    submitAnswer,
    skipQuestion,
    restartSession
  };
}

export default useSession;
