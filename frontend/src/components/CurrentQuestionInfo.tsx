import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { getDifficultyColor } from "../utils/questionUtils";
import { useState } from "react";

interface CurrentQuestionInfoProps {
  questionId?: string;
  currentDomain?: string;
  currentSkill?: string;
  currentDifficulty?: string;
  totalQuestions?: number;
}

export const CurrentQuestionInfo = ({ 
  questionId = "#unknown",
  currentDomain = "Information and Ideas",
  currentSkill = "Command of Evidence", 
  currentDifficulty = "Easy",
  totalQuestions = 0
}: CurrentQuestionInfoProps) => {
  const [isRevealed, setIsRevealed] = useState(false);
  
  const questionInfo = [
    { label: "Question ID", value: questionId.replace("#", "") },
    { label: "Section", value: "Reading and Writing" },
    { label: "Domain", value: currentDomain },
    { label: "Skill", value: currentSkill },
    { label: "Difficulty", value: currentDifficulty },
  ];

  const handleReveal = () => {
    setIsRevealed(true);
  };

  return (
    <div className="relative">
      <Card className="shadow-sm border border-muted-foreground/10">
        <CardHeader className="pb-2 pt-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-semibold">Current Question</h3>
              <p className="text-xs text-muted-foreground">{totalQuestions} questions available</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="bg-primary/10">
                <span className="w-2 h-2 bg-primary rounded-full mr-1"></span>
                Mark for Review
              </Badge>
              <span className="text-sm text-muted-foreground">⏱️ 22:45</span>
              <Badge 
                variant="outline" 
                className={getDifficultyColor(currentDifficulty)}
              >
                {currentDifficulty}
              </Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {questionInfo.map((info, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{info.label}:</span>
              <span className="font-medium">{info.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>
      
      {/* Blur overlay when not revealed */}
      {!isRevealed && (
        <div 
          className="absolute inset-0 bg-white/60 backdrop-blur-sm rounded-lg cursor-pointer flex items-center justify-center group hover:bg-white/40 transition-all duration-200"
          onClick={handleReveal}
        >
          <div className="text-center p-4">
            {/* <div className="text-2xl mb-2 group-hover:scale-110 transition-transform duration-200">👁️</div> */}
            <p className="text-sm font-medium text-gray-700">Click to reveal question details</p>
            <p className="text-xs text-gray-500 mt-1">Avoid spoilers while reading</p>
          </div>
        </div>
      )}
    </div>
  );
};
