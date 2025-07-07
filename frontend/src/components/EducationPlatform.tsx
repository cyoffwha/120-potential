import { useState } from "react";
import { Header } from "./Header";
import { QuestionBank } from "./QuestionBank";
import { ReadingPassage } from "./ReadingPassage";
import { MultipleChoice } from "./MultipleChoice";
import { QuestionNavigation } from "./QuestionNavigation";

export const EducationPlatform = () => {
  const [currentQuestion, setCurrentQuestion] = useState(1);
  const [selectedAnswer, setSelectedAnswer] = useState("");

  const handleQuestionSelect = (questionNumber: number) => {
    setCurrentQuestion(questionNumber);
    setSelectedAnswer(""); // Reset answer when switching questions
  };

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="max-w-8xl mx-auto px-6 py-6">

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Text Content - Left Side */}
          <div className="space-y-6">
            <ReadingPassage />
          </div>

          {/* Question - Right Side */}
          <div className="space-y-6">
            <MultipleChoice 
              selectedAnswer={selectedAnswer}
              onAnswerChange={handleAnswerChange}
            />
          </div>
        </div>
      </main>
    </div>
  );
};