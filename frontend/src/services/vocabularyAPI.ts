import { BACKEND_URL } from "@/config";

// Types for vocabulary API
export interface VocabularyCard {
  id: number;
  word: string;
  definition: string;
  example?: string;
  difficulty: string;
  category?: string;
  completed: boolean;
  reviewed: boolean;
  next_review_date?: string;
  failure_count: number;
  is_due_for_review: boolean;
}

export interface VocabularyStats {
  total_cards: number;
  completed_cards: number;
  due_today: number;
  completion_percentage: number;
}

export interface SubmitAttemptRequest {
  card_id: number;
  result: "again" | "easy";
  time_elapsed_seconds: number;
}

export interface SubmitAttemptResponse {
  status: string;
  message: string;
  next_review_date?: string;
  failure_count: number;
  interval_days: number;
}

class VocabularyAPI {
  private baseUrl: string;

  constructor() {
    this.baseUrl = `${BACKEND_URL}/vocabulary`;
  }

  async getAllCards(): Promise<VocabularyCard[]> {
    const response = await fetch(`${this.baseUrl}/cards`);
    if (!response.ok) {
      throw new Error(`Failed to fetch cards: ${response.statusText}`);
    }
    return response.json();
  }

  async getDueCards(): Promise<VocabularyCard[]> {
    const response = await fetch(`${this.baseUrl}/due-cards`);
    if (!response.ok) {
      throw new Error(`Failed to fetch due cards: ${response.statusText}`);
    }
    return response.json();
  }

  async submitAttempt(request: SubmitAttemptRequest): Promise<SubmitAttemptResponse> {
    const response = await fetch(`${this.baseUrl}/submit-attempt`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request),
    });
    
    if (!response.ok) {
      throw new Error(`Failed to submit attempt: ${response.statusText}`);
    }
    return response.json();
  }

  async getStats(): Promise<VocabularyStats> {
    const response = await fetch(`${this.baseUrl}/stats`);
    if (!response.ok) {
      throw new Error(`Failed to fetch stats: ${response.statusText}`);
    }
    return response.json();
  }
}

export const vocabularyAPI = new VocabularyAPI();
