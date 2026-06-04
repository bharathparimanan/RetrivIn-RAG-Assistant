import { useState, useCallback, useEffect } from 'react';
import { MOCK_QUESTIONS, MOCK_SCORE } from '../lib/mock-data';
import type { SessionEntry, Question } from '../types/session';

export function useSession() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [entries, setEntries] = useState<SessionEntry[]>([]);
  const [status, setStatus] = useState<'idle' | 'question' | 'answered' | 'scored' | 'complete'>('idle');

  const currentQuestion: Question | null = MOCK_QUESTIONS[currentIndex] || null;

  // Initialize session with the first question
  useEffect(() => {
    if (entries.length === 0 && MOCK_QUESTIONS.length > 0) {
      setEntries([{ question: MOCK_QUESTIONS[0] }]);
      setStatus('question');
    }
  }, [entries]);

  const submitAnswer = useCallback((text: string) => {
    if (status !== 'question' || !currentQuestion) return;

    // 1. Set answered status and add answer to the active entry
    setStatus('answered');
    setEntries((prev) => {
      const copy = [...prev];
      const last = copy[copy.length - 1];
      if (last) {
        last.answer = { questionId: currentQuestion.id, text };
      }
      return copy;
    });

    // 2. After 400ms, attach score and set scored status
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

      // 3. After 1200ms, advance to next question or complete
      setTimeout(() => {
        setCurrentIndex((prevIndex) => {
          const nextIndex = prevIndex + 1;
          if (nextIndex < MOCK_QUESTIONS.length) {
            setEntries((prevEntries) => [
              ...prevEntries,
              { question: MOCK_QUESTIONS[nextIndex] }
            ]);
            setStatus('question');
          } else {
            setStatus('complete');
          }
          return nextIndex;
        });
      }, 1200);
    }, 400);
  }, [status, currentQuestion]);

  const skipQuestion = useCallback(() => {
    if (status !== 'question' || !currentQuestion) return;

    // Skip advances index immediately, no answer, no score attached
    setCurrentIndex((prevIndex) => {
      const nextIndex = prevIndex + 1;
      if (nextIndex < MOCK_QUESTIONS.length) {
        setEntries((prevEntries) => [
          ...prevEntries,
          { question: MOCK_QUESTIONS[nextIndex] }
        ]);
        setStatus('question');
      } else {
        setStatus('complete');
      }
      return nextIndex;
    });
  }, [status, currentQuestion]);

  const restartSession = useCallback(() => {
    setCurrentIndex(0);
    setEntries([{ question: MOCK_QUESTIONS[0] }]);
    setStatus('question');
  }, []);

  return {
    entries,
    currentIndex,
    currentQuestion,
    status,
    submitAnswer,
    skipQuestion,
    restartSession
  };
}

export default useSession;
