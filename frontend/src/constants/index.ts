import { Domain, Difficulty } from "../types";

export const DOMAIN_SKILL_MAP: Record<Domain, string[]> = {
  "Information and Ideas": [
    "Central Ideas and Details",
    "Command of Evidence", 
    "Inferences"
  ],
  "Craft and Structure": [
    "Words in Context",
    "Text Structure and Purpose",
    "Cross-Text Connections"
  ],
  "Expression of Ideas": [
    "Rhetorical Synthesis",
    "Transitions"
  ],
  "Standard English Conventions": [
    "Boundaries",
    "Form, Structure, and Sense"
  ]
};

export const DIFFICULTY_OPTIONS: Difficulty[] = ["Easy", "Medium", "Hard"];

export const DOMAINS = Object.keys(DOMAIN_SKILL_MAP) as Domain[];

export const DEFAULT_FILTER_VALUE = "Any";

// Question choice options
export const CHOICE_LABELS = ["A", "B", "C", "D"] as const;
