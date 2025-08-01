import { Question } from "../types";

export function getRandomQuestion(questions: Question[], exclude?: Question): Question | null {
  if (questions.length === 0) return null;
  
  if (questions.length === 1 || !exclude) {
    return questions[Math.floor(Math.random() * questions.length)];
  }
  
  // Filter out the excluded question if we have multiple questions
  const availableQuestions = questions.filter(q => q.id !== exclude.id);
  if (availableQuestions.length === 0) return questions[0];
  
  return availableQuestions[Math.floor(Math.random() * availableQuestions.length)];
}

export function getDifficultyColor(difficulty: string): string {
  switch (difficulty) {
    case "Easy":
      return "bg-green-100 text-green-800";
    case "Medium":
      return "bg-yellow-100 text-yellow-800";
    case "Hard":
      return "bg-orange-100 text-orange-800";
    case "Very Hard":
      return "bg-red-100 text-red-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}
