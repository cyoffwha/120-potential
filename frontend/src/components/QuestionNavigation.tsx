import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface QuestionStatus {
  questionNumber: number;
  status: 'correct' | 'incorrect' | 'review' | 'unanswered' | 'current';
}

interface QuestionNavigationProps {
  totalQuestions?: number;
  currentQuestion?: number;
  questionStatuses?: QuestionStatus[];
  onQuestionSelect?: (questionNumber: number) => void;
}

export const QuestionNavigation = ({
  totalQuestions = 53,
  currentQuestion = 1,
  questionStatuses,
  onQuestionSelect
}: QuestionNavigationProps) => {
  
  // Generate default statuses if not provided
  const defaultStatuses: QuestionStatus[] = Array.from(
    { length: totalQuestions }, 
    (_, i) => {
      const questionNumber = i + 1;
      if (questionNumber === currentQuestion) return { questionNumber, status: 'current' };
      if (questionNumber <= 5) return { questionNumber, status: 'correct' };
      if (questionNumber <= 10) return { questionNumber, status: 'incorrect' };
      if (questionNumber <= 15) return { questionNumber, status: 'review' };
      return { questionNumber, status: 'unanswered' };
    }
  );

  const statuses = questionStatuses || defaultStatuses;

  const getButtonVariant = (status: QuestionStatus['status']) => {
    switch (status) {
      case 'current': return 'default';
      case 'correct': return 'outline';
      case 'incorrect': return 'outline';
      case 'review': return 'outline';
      default: return 'ghost';
    }
  };

  const getButtonClassName = (status: QuestionStatus['status']) => {
    const baseClasses = "w-8 h-8 p-0 text-xs font-medium";
    switch (status) {
      case 'current': 
        return `${baseClasses} bg-foreground text-background hover:bg-foreground/90`;
      case 'correct': 
        return `${baseClasses} border-2 border-success text-success hover:bg-success/10`;
      case 'incorrect': 
        return `${baseClasses} border-2 border-incorrect text-incorrect hover:bg-destructive/10`;
      case 'review': 
        return `${baseClasses} border-2 border-review text-review hover:bg-warning/10`;
      default: 
        return `${baseClasses} text-muted-foreground hover:bg-muted`;
    }
  };

  const statusLegend = [
    { status: 'correct', label: 'Correct', color: 'bg-success' },
    { status: 'incorrect', label: 'Incorrect', color: 'bg-incorrect' },
    { status: 'correct', label: 'Correct (with prior incorrect attempt)', color: 'bg-success' },
    { status: 'review', label: 'Marked for Review', color: 'bg-review' }
  ];

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              Hide Navigation
            </Button>
            <Button variant="outline" size="sm">
              🔀 Shuffle Question Order
            </Button>
          </div>
        </div>
        
        {/* Status Legend */}
        <div className="flex flex-wrap gap-4 text-xs">
          <span className="text-muted-foreground">Glossary:</span>
          {statusLegend.map((item, index) => (
            <div key={index} className="flex items-center gap-1">
              <div className={`w-3 h-3 rounded-full ${item.color}`}></div>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      </CardHeader>
      
      <CardContent>
        {/* Question Grid */}
        <div className="grid grid-cols-10 sm:grid-cols-15 lg:grid-cols-20 gap-1 mb-4">
          {statuses.map((questionStatus) => (
            <Button
              key={questionStatus.questionNumber}
              variant={getButtonVariant(questionStatus.status)}
              className={getButtonClassName(questionStatus.status)}
              onClick={() => onQuestionSelect?.(questionStatus.questionNumber)}
            >
              {questionStatus.questionNumber}
            </Button>
          ))}
        </div>

        {/* Progress Info */}
        <div className="flex justify-between items-center text-sm text-muted-foreground">
          <span>{currentQuestion} / {totalQuestions}</span>
          <div className="flex gap-4">
            <Button variant="outline" size="sm">
              Next →
            </Button>
            <Button variant="outline" size="sm">
              Check
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};