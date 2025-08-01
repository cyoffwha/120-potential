import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { VocabularyStats } from "@/services/vocabularyAPI";

interface VocabularyProgressProps {
  stats: VocabularyStats | null;
  dueCount: number;
}

export const VocabularyProgress: React.FC<VocabularyProgressProps> = ({
  stats,
  dueCount,
}) => {
  if (!stats) {
    return (
      <Card className="border-primary/20">
        <CardContent className="p-4">
          <h3 className="font-semibold mb-2 text-primary">Progress</h3>
          <div className="text-sm text-muted-foreground">Loading...</div>
        </CardContent>
      </Card>
    );
  }

  const completionPercentage = stats.completion_percentage;
  const isAllCompleted = stats.completed_cards === stats.total_cards && stats.total_cards > 0;

  return (
    <Card className="border-primary/20">
      <CardContent className="p-4">
        <h3 className="font-semibold mb-2 text-primary">Progress</h3>
        <div className="text-sm text-muted-foreground space-y-3">
          {/* Completion Progress */}
          <div>
            <div className="flex justify-between mb-1">
              <span>Completed:</span>
              <span className="font-medium">
                {stats.completed_cards}/{stats.total_cards}
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${completionPercentage}%` }}
              ></div>
            </div>
            <div className="text-xs text-center mt-1">
              {completionPercentage.toFixed(1)}% complete
            </div>
          </div>

          {/* Due Today */}
          <div className="flex justify-between items-center">
            <span>Due today:</span>
            <Badge
              variant={dueCount > 0 ? "default" : "secondary"}
              className={
                dueCount > 0
                  ? "bg-orange-100 text-orange-800 border-orange-200"
                  : ""
              }
            >
              {dueCount}
            </Badge>
          </div>

          {/* Status Message */}
          {isAllCompleted && (
            <div className="text-center p-2 bg-green-50 rounded-lg border border-green-200">
              <span className="text-green-800 text-xs font-medium">
                🎉 All cards completed!
              </span>
            </div>
          )}

          {dueCount > 0 && !isAllCompleted && (
            <div className="text-center p-2 bg-blue-50 rounded-lg border border-blue-200">
              <span className="text-blue-800 text-xs font-medium">
                Ready to study!
              </span>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
