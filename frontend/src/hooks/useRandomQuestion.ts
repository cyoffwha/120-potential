import { useEffect, useState } from "react";

export function useRandomQuestion() {
  const [questions, setQuestions] = useState<any[]>([]);
  const [current, setCurrent] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    setLoading(true);
    fetch("http://localhost:8079/questions")
      .then((res) => {
        if (!res.ok) throw new Error("Failed to fetch questions");
        return res.json();
      })
      .then((data) => {
        setQuestions(data.questions || []);
        if (data.questions && data.questions.length > 0) {
          setCurrent(data.questions[Math.floor(Math.random() * data.questions.length)]);
        } else {
          setCurrent(null);
        }
      })
      .catch((e) => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  const nextRandom = () => {
    if (questions.length === 0) return;
    let next;
    do {
      next = questions[Math.floor(Math.random() * questions.length)];
    } while (questions.length > 1 && next.id === current?.id);
    setCurrent(next);
  };

  return { current, loading, error, nextRandom, hasQuestions: questions.length > 0 };
}
