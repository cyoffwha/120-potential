import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

interface QuestionBankProps {
  questionId?: string;
  totalQuestions?: number;
}

export const QuestionBank = ({ 
  questionId = "#01382", 
  totalQuestions = 53 
}: QuestionBankProps) => {
  const bankInfo = [
    { label: "Set Section", value: "English" },
    { label: "Set Difficulty", value: "All" },
    { label: "Set Active", value: "All" },
    { label: "Set Score Band", value: "All" },
    { label: "Set Domain", value: "Craft and Structure" },
  ];

  const questionInfo = [
    { label: "Question Bank ID", value: "97e5bf55" },
    { label: "Section", value: "English" },
    { label: "Score Band", value: "6" },
    { label: "Domain", value: "Craft and Structure" },
    { label: "Skill", value: "Cross-Text connections" },
  ];

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
      {/* Question Bank Info */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-lg font-semibold">SAT Suite Question Bank</h2>
              <p className="text-sm text-muted-foreground">
                Total Questions: <span className="font-medium">{totalQuestions}</span>
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="text-xs">
                Back to Question Bank
              </Button>
              <Button variant="outline" size="sm" className="text-xs">
                Hide Metadata
              </Button>
              <Button variant="default" size="sm" className="text-xs">
                Stats
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-2">
          {bankInfo.map((info, index) => (
            <div key={index} className="flex justify-between text-sm">
              <span className="text-muted-foreground">{info.label}:</span>
              <span className="font-medium">{info.value}</span>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Question Details */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold">Question ID</h3>
              <p className="text-2xl font-bold text-primary">{questionId}</p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm">
                <span className="mr-1">📤</span>
              </Button>
              <Button variant="outline" size="sm">
                <span className="mr-1">⚡</span>
              </Button>
              <Button variant="outline" size="sm">
                <span className="mr-1">✏️</span>
              </Button>
            </div>
          </div>
          <div className="flex items-center gap-2 mt-2">
            <Badge variant="outline" className="bg-primary/10">
              <span className="w-2 h-2 bg-primary rounded-full mr-1"></span>
              Mark for Review
            </Badge>
            <span className="text-sm text-muted-foreground">⏱️ 22:45</span>
            <span className="text-sm font-medium">ABC</span>
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
    </div>
  );
};