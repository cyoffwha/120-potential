import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useState } from "react";
import { BACKEND_URL } from "../config";
import { Loader2 } from "lucide-react";

interface ExplanationDialogProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAnswer: string;
  explanations?: Record<string, string>;
  correctAnswer?: string;
  passage?: string;
  question?: string;
  answerExplanation?: string;
  onAgain?: () => void;
  onEasy?: () => void;
  onClose: () => void;
}

export function ExplanationDialog({
  isOpen,
  onOpenChange,
  selectedAnswer,
  explanations = {},
  correctAnswer = 'A',
  passage = '',
  question = '',
  answerExplanation = '',
  onAgain,
  onEasy,
  onClose,
}: ExplanationDialogProps) {
  const [followUpQuestion, setFollowUpQuestion] = useState("");
  const [conversationHistory, setConversationHistory] = useState<
    { type: "user" | "bot"; text: string }[]
  >([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleFollowUpSubmit = async () => {
    if (!followUpQuestion.trim()) return;

    const userMessage = { type: "user" as const, text: followUpQuestion };
    setConversationHistory((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      const response = await fetch(`${BACKEND_URL}/dialog`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          passage,
          question,
          answer_explanation: answerExplanation,
          user_message: followUpQuestion,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response from the backend.");
      }

      const data = await response.json();
      const botMessage = { type: "bot" as const, text: data.answer };
      setConversationHistory((prev) => [...prev, botMessage]);
    } catch (error) {
      console.error("Error fetching explanation:", error);
      const errorMessage = {
        type: "bot" as const,
        text: "Sorry, I encountered an error. Please try again.",
      };
      setConversationHistory((prev) => [...prev, errorMessage]);
    } finally {
      setFollowUpQuestion("");
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[625px]">
        <DialogHeader>
          <DialogTitle>Ask a Follow-up Question</DialogTitle>
          <DialogDescription>
            Get a more detailed explanation about the question and answer.
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <ScrollArea className="h-72 w-full rounded-md border p-4">
            <div className="space-y-4">
              {conversationHistory.map((entry, index) => (
                <div
                  key={index}
                  className={`flex ${
                    entry.type === "user" ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`max-w-[75%] rounded-lg px-4 py-2 ${
                      entry.type === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted"
                    }`}
                  >
                    {entry.text}
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
          <div className="flex items-center gap-2">
            <Textarea
              placeholder="Type your question here..."
              value={followUpQuestion}
              onChange={(e) => setFollowUpQuestion(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleFollowUpSubmit();
                }
              }}
            />
            <Button
              onClick={handleFollowUpSubmit}
              disabled={isLoading || !followUpQuestion.trim()}
              size="sm"
            >
              {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send
            </Button>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}