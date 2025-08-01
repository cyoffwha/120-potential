import { useEffect, useState, useCallback } from "react";

import { BACKEND_URL } from "../config";

interface FilterOptions {
  domain?: string;
  skill?: string;
  difficulty?: string;
}

export function useRandomQuestion() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [currentFilters, setCurrentFilters] = useState<FilterOptions>({});

  const fetchQuestions = useCallback(async (filters: FilterOptions = {}) => {
    setLoading(true);
    try {
      // Build query parameters
      const params = new URLSearchParams();
      if (filters.domain && filters.domain !== "Any") {
        params.append("domain", filters.domain);
      }
      if (filters.skill && filters.skill !== "Any") {
        params.append("skill", filters.skill);
      }
      if (filters.difficulty && filters.difficulty !== "Any") {
        params.append("difficulty", filters.difficulty);
      }

      const url = `${BACKEND_URL}/questions${params.toString() ? `?${params.toString()}` : ''}`;
      const res = await fetch(url);
      
      if (!res.ok) throw new Error("Failed to fetch questions");
      
      const data = await res.json();
      setQuestions(data.questions || []);
      setCurrentFilters(filters);
      
      // Set random current question from filtered results
      if (data.questions && data.questions.length > 0) {
        setCurrent(data.questions[Math.floor(Math.random() * data.questions.length)]);
      } else {
        setCurrent(null);
      }
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  // Initial load with no filters
  useEffect(() => {
    fetchQuestions();
  }, [fetchQuestions]);

  const nextRandom = () => {
    if (questions.length === 0) return;
    let next;
    do {
      next = questions[Math.floor(Math.random() * questions.length)];
    } while (questions.length > 1 && next.id === current?.id);
    setCurrent(next);
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
