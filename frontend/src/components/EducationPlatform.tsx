import { useState } from "react";
import { useRandomQuestion } from "../hooks/useRandomQuestion";
import { Header } from "./Header";
import { QuestionBank } from "./QuestionBank";
import { ReadingPassage } from "./ReadingPassage";
import { MultipleChoice } from "./MultipleChoice";
import { QuestionNavigation } from "./QuestionNavigation";

export const EducationPlatform = () => {
  const { current, loading, error, nextRandom, hasQuestions } = useRandomQuestion();
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAgain = () => {
    setSelectedAnswer("");
    setFeedback("");
    nextRandom();
  };

  const handleEasy = () => {
    setSelectedAnswer("");
    setFeedback("");
    nextRandom();
  };

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection="Practice" />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading && <div>Loading questions...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !hasQuestions && (
          <div className="text-red-600 font-bold">No questions in the database. Please add some first.</div>
        )}
        {current && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text Content - Left Side */}
            <div className="space-y-6">
              <ReadingPassage passages={current.passage ? [{ title: "Passage", content: current.passage }] : []} />
            </div>
            {/* Question - Right Side */}
            <div className="space-y-6">
              <MultipleChoice
                question={current.question}
                options={[
                  { id: "A", text: current.choice_a },
                  { id: "B", text: current.choice_b },
                  { id: "C", text: current.choice_c },
                  { id: "D", text: current.choice_d },
                ]}
                selectedAnswer={selectedAnswer}
                onAnswerChange={handleAnswerChange}
                onAgain={handleAgain}
                onEasy={handleEasy}
                passage={current.passage}
                answerExplanation={current.rationale_a || ""}
                explanations={{
                  A: current.rationale_a || "",
                  B: current.rationale_b || "",
                  C: current.rationale_c || "",
                  D: current.rationale_d || ""
                }}
                correctAnswer={current.correct_choice}
              />
              {/* Again/Easy buttons removed; handled in ExplanationDialog */}
              {feedback && <div>{feedback}</div>}
            </div>
          </div>
        )}
      </main>
    </div>
  );
};