import { useEffect, useState, useCallback } from "react";
import { Question, FilterOptions } from "../types";
import { questionService } from "../services/questionService";
import { getRandomQuestion } from "../utils/questionUtils";

export function useRandomQuestion() {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [current, setCurrent] = useState<Question | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});

  const fetchQuestions = useCallback(async (filters: FilterOptions = {}) => {
    setLoading(true);
    try {
      const data = await questionService.getQuestions(filters);
      setQuestions(data.questions);
      setCurrentFilters(filters);
      
      // Set random current question from filtered results
      if (data.questions.length > 0) {
        const randomQuestion = getRandomQuestion(data.questions);
        setCurrent(randomQuestion);
      } else {
        setCurrent(null);
      }
    } catch (e: any) {
      setError(e.message);
      setQuestions([]);
      setCurrent(null);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with no filters
  useEffect(() => {
    fetchQuestions();
  }, []);

  const nextRandom = () => {
    const next = getRandomQuestion(questions, current || undefined);
    if (next) setCurrent(next);
  };

  const applyFilters = (filters: FilterOptions) => {
    fetchQuestions(filters);
  };

  return { 
    current, 
    loading, 
    error, 
    nextRandom, 
    hasQuestions: questions.length > 0,
    applyFilters,
    currentFilters,
    totalQuestions: questions.length
  };
}
