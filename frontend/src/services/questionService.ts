import { BACKEND_URL } from "../config";
import { FilterOptions, Question, QuestionResponse, RandomQuestionResponse, FilterOptionsResponse } from "../types";

class QuestionService {
  private async handleResponse<T>(response: Response): Promise<T> {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.json();
  }

  private buildQueryParams(filters: FilterOptions): URLSearchParams {
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
    
    return params;
  }

  async getQuestions(filters: FilterOptions = {}): Promise<QuestionResponse> {
    const params = this.buildQueryParams(filters);
    const url = `${BACKEND_URL}/questions${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url);
    return this.handleResponse<QuestionResponse>(response);
  }

  async getRandomQuestion(filters: FilterOptions = {}): Promise<RandomQuestionResponse> {
    const params = this.buildQueryParams(filters);
    const url = `${BACKEND_URL}/questions/random${params.toString() ? `?${params.toString()}` : ''}`;
    
    const response = await fetch(url);
    return this.handleResponse<RandomQuestionResponse>(response);
  }

  async getFilterOptions(): Promise<FilterOptionsResponse> {
    const response = await fetch(`${BACKEND_URL}/questions/filter-options`);
    return this.handleResponse<FilterOptionsResponse>(response);
  }

  async createQuestion(question: Omit<Question, 'id'>): Promise<void> {
    const response = await fetch(`${BACKEND_URL}/questions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(question),
    });
    
    if (!response.ok) {
      throw new Error("Failed to create question");
    }
  }
}

export const questionService = new QuestionService();
