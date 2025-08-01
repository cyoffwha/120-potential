import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

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
  const questionInfo = [
    { label: "Question ID", value: questionId.replace("#", "") },
    { label: "Section", value: "Reading and Writing" },
    { label: "Domain", value: currentDomain },
    { label: "Skill", value: currentSkill },
    { label: "Difficulty", value: currentDifficulty },
  ];

  return (
    <Card className="shadow-sm border border-muted-foreground/10">
      <CardHeader className="pb-2 pt-3">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-base font-semibold">Current Question</h3>
            <p className="text-xs text-muted-foreground">{totalQuestions} questions available</p>
            <p className="text-xl font-bold text-primary">{questionId}</p>
          </div>
          {/*
          <div className="flex gap-2">
            <Button variant="outline" size="sm" title="Export">
              <span className="mr-1">📤</span>
            </Button>
            <Button variant="outline" size="sm" title="Quick Action">
              <span className="mr-1">⚡</span>
            </Button>
            <Button variant="outline" size="sm" title="Edit">
              <span className="mr-1">✏️</span>
            </Button>
          </div>
          */}
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Badge variant="outline" className="bg-primary/10">
            <span className="w-2 h-2 bg-primary rounded-full mr-1"></span>
            Mark for Review
          </Badge>
          <span className="text-sm text-muted-foreground">⏱️ 22:45</span>
          <Badge 
            variant="outline" 
            className={
              currentDifficulty === "Easy" ? "bg-green-100 text-green-800" :
              currentDifficulty === "Medium" ? "bg-yellow-100 text-yellow-800" :
              currentDifficulty === "Hard" ? "bg-orange-100 text-orange-800" :
              "bg-red-100 text-red-800"
            }
          >
            {currentDifficulty}
          </Badge>
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
  );
};
