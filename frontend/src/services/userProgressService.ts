import { FilterOptions } from "../types";

export interface QuestionAttempt {
  question_id: string;
  selected_choice: string;
  time_elapsed_seconds: number;
  correct_choice: string;
}

export interface UserStats {
  questionsAnswered: number;
  totalQuestions: number;
  completionRate: number;
  accuracy: number;
  streakDays: number;
  difficultyBreakdown: {
    easy: number;
    medium: number;
    hard: number;
  };
  domainPerformance: Array<{
    domain: string;
    attempted: number;
    correct: number;
    accuracy: number;
  }>;
}

export interface RecentAttempt {
  question_id: string;
  selected_choice: string;
  is_correct: boolean;
  time_elapsed: number;
  attempted_at: string;
  question_text: string | null;
  difficulty: string | null;
  domain: string | null;
}

const API_BASE_URL = "http://127.0.0.1:8079/api/user-progress";

class UserProgressService {
  async submitAnswer(attempt: QuestionAttempt): Promise<{
    success: boolean;
    is_correct: boolean;
    message: string;
  }> {
    const response = await fetch(`${API_BASE_URL}/submit-answer`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(attempt),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to submit answer");
    }

    return response.json();
  }

  async getUserStats(): Promise<UserStats> {
    const response = await fetch(`${API_BASE_URL}/stats`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch user stats");
    }

    return response.json();
  }

  async getRecentAttempts(limit: number = 10): Promise<RecentAttempt[]> {
    const response = await fetch(`${API_BASE_URL}/recent-attempts?limit=${limit}`);

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.detail || "Failed to fetch recent attempts");
    }

    return response.json();
  }
}

export const userProgressService = new UserProgressService();
