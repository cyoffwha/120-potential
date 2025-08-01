export interface Question {
  id: number;
  question_id: string;
  image?: string;
  passage?: string;
  question: string;
  choice_a: string;
  choice_b: string;
  choice_c: string;
  choice_d: string;
  correct_choice: string;
  rationale_a?: string;
  rationale_b?: string;
  rationale_c?: string;
  rationale_d?: string;
  difficulty: Difficulty;
  domain: Domain;
  skill: string;
}

export interface FilterOptions {
  domain?: string;
  skill?: string;
  difficulty?: string;
}

export type Difficulty = "Easy" | "Medium" | "Hard" | "Very Hard";
export type Domain = "Information and Ideas" | "Craft and Structure" | "Expression of Ideas" | "Standard English Conventions";

export interface QuestionResponse {
  questions: Question[];
  total: number;
  filters_applied: {
    domain: string | null;
    skill: string | null;
    difficulty: string | null;
  };
}

export interface RandomQuestionResponse {
  question: Question;
  filters_applied: {
    domain: string | null;
    skill: string | null;
    difficulty: string | null;
  };
}

export interface FilterOptionsResponse {
  domains: string[];
  skills: string[];
  difficulties: string[];
  domain_skill_mapping: Record<string, string[]>;
}
