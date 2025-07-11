import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Timer } from "./Timer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { ExplanationDialog } from "./ExplanationDialog";

interface ChoiceOption {
  id: string;
  text: string;
}

interface MultipleChoiceProps {
  question?: string;
  options?: ChoiceOption[];
  selectedAnswer?: string;
  onAnswerChange?: (answer: string) => void;
  onAgain?: () => void;
  onEasy?: () => void;
  passage?: string;
  answerExplanation?: string;
  explanations?: Record<string, string>;
  correctAnswer?: string;
}

export const MultipleChoice = ({
  question,
  options,
  selectedAnswer = "",
  onAnswerChange,
  onAgain,
  onEasy,
  passage,
  answerExplanation,
  explanations,
  correctAnswer
}: MultipleChoiceProps) => {
  const [showExplanation, setShowExplanation] = useState(false);

  const defaultQuestion = "Based on the texts, both Sykes in Text 1 and the scholars in Text 2 would most likely agree with which statement?";
  
  const defaultOptions: ChoiceOption[] = [
    {
      id: "A",
      text: "John Fletcher's writing has a unique, readily identifiable style."
    },
    {
      id: "B", 
      text: "The women characters in John Fletcher's plays are similar to the women characters in Philip Massinger's plays."
    },
    {
      id: "C",
      text: "The Two Noble Kinsmen belongs in one-volume compilations of Shakespeare's complete plays."
    },
    {
      id: "D",
      text: "Philip Massinger's style in the first and last acts of The Two Noble Kinsmen is an homage to Shakespeare's style."
    }
  ];

  const questionText = question || defaultQuestion;
  const choiceOptions = options || defaultOptions;

  const handleValueChange = (value: string) => {
    onAnswerChange?.(value);
  }

  return (
    <Card className="mb-6 bg-card border-border shadow-sm relative min-h-[320px]">
      <div className="absolute right-4 top-4 z-10">
        <Timer />
      </div>
      <CardHeader className="pt-10">
        <CardTitle className="text-base font-medium leading-relaxed text-card-foreground">
          {questionText}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <RadioGroup 
          value={selectedAnswer} 
          onValueChange={handleValueChange}
          className="space-y-4"
        >
          {choiceOptions.map((option) => (
            <div 
              key={option.id} 
              className="flex items-start space-x-3 p-3 rounded-lg hover:bg-muted/30 transition-colors border border-border/50"
            >
              <RadioGroupItem 
                value={option.id} 
                id={option.id}
                className="mt-0.5 flex-shrink-0"
              />
              <Label 
                htmlFor={option.id} 
                className="text-sm leading-relaxed cursor-pointer flex-1 text-card-foreground"
              >
                <span className="font-semibold mr-2">{option.id}</span>
                {option.text}
              </Label>
            </div>
          ))}
        </RadioGroup>
        
        <div className="mt-6 flex justify-center">
          <Button 
            className="bg-accent hover:bg-accent/90 text-accent-foreground px-8 font-medium"
            disabled={!selectedAnswer}
            onClick={() => setShowExplanation(true)}
          >
            Check
          </Button>
        </div>
      </CardContent>

      <ExplanationDialog 
        open={showExplanation}
        onOpenChange={setShowExplanation}
        selectedAnswer={selectedAnswer}
        passage={passage}
        question={questionText}
        answerExplanation={answerExplanation}
        explanations={explanations}
        correctAnswer={correctAnswer}
        onAgain={onAgain}
        onEasy={onEasy}
      />
    </Card>
  );
};