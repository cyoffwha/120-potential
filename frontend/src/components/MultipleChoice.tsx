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
}

export const MultipleChoice = ({
  question,
  options,
  selectedAnswer,
  onAnswerChange
}: MultipleChoiceProps) => {
  const [selected, setSelected] = useState(selectedAnswer || "");
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
    setSelected(value);
    onAnswerChange?.(value);
  };

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
          value={selected} 
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
            disabled={!selected}
            onClick={() => setShowExplanation(true)}
          >
            Check
          </Button>
        </div>
      </CardContent>

      <ExplanationDialog 
        open={showExplanation}
        onOpenChange={setShowExplanation}
        selectedAnswer={selected}
        passage={`In 1916, H. Dugdale Sykes disputed claims that The Two Noble Kinsmen was coauthored by William Shakespeare and John Fletcher. Sykes felt Fletcher's contributions to the play were obvious—Fletcher had a distinct style in his other plays, so much so that lines with that style were considered sufficient evidence of Fletcher's authorship. But for the lines not deemed to be by Fletcher, Sykes felt that their depiction of women indicated that their author was not Shakespeare but Philip Massinger.\nScholars have accepted The Two Noble Kinsmen as coauthored by Shakespeare since the 1970s: it appears in all major one-volume editions of Shakespeare's complete works. Though scholars disagree about who wrote what exactly, it is generally held that on the basis of style, Shakespeare wrote all of the first act and most of the last, while John Fletcher authored most of the three middle acts.`}
        question={questionText}
        
        answerExplanation={`Choice A is the best answer. “In addition” logically signals that the detail in this sentence—that Coleridge-Taylor included traditional African music in his classical compositions—adds to the information in the previous sentence. Specifically, the previous sentence indicates one way in which Coleridge-Taylor emphasized his mixed-race ancestry, and the claim that follows indicates a second, additional way.\n\nChoice B is incorrect because “actually” illogically signals that the detail in this sentence is surprising in light of the information in the previous sentence. Instead, the detail adds to the information, indicating a second, additional way in which Coleridge-Taylor emphasized his mixed-race ancestry. Choice C is incorrect because “however” illogically signals that the detail in this sentence contrasts with the information in the previous sentence. Instead, the detail adds to the information, indicating a second, additional way in which Coleridge-Taylor emphasized his mixed-race ancestry. Choice D is incorrect because “regardless” illogically signals that the detail in this sentence is true despite the information in the previous sentence. Instead, the detail adds to the information, indicating a second, additional way in which Coleridge-Taylor emphasized his mixed-race ancestry.`}
        explanations={{
          A: '“In addition” logically signals that the detail in this sentence—that Coleridge-Taylor included traditional African music in his classical compositions—adds to the information in the previous sentence. Specifically, the previous sentence indicates one way in which Coleridge-Taylor emphasized his mixed-race ancestry, and the claim that follows indicates a second, additional way.',
          B: '“Actually” illogically signals that the detail in this sentence is surprising in light of the information in the previous sentence. Instead, the detail adds to the information, indicating a second, additional way in which Coleridge-Taylor emphasized his mixed-race ancestry.',
          C: '“However” illogically signals that the detail in this sentence contrasts with the information in the previous sentence. Instead, the detail adds to the information, indicating a second, additional way in which Coleridge-Taylor emphasized his mixed-race ancestry.',
          D: '“Regardless” illogically signals that the detail in this sentence is true despite the information in the previous sentence. Instead, the detail adds to the information, indicating a second, additional way in which Coleridge-Taylor emphasized his mixed-race ancestry.'
        }}
        correctAnswer="A"
      />
    </Card>
  );
};