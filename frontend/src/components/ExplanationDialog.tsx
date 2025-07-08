import { useState } from "react";
import axios from "axios";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send } from "lucide-react";

interface ExplanationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedAnswer: string;
  explanations?: Record<string, string>;
  correctAnswer?: string;
}

interface ChatMessage {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
}

export const ExplanationDialog = ({ open, onOpenChange, selectedAnswer, passage = '', question = '', answerExplanation = '', explanations = {}, correctAnswer = 'A' }: ExplanationDialogProps & { passage?: string, question?: string, answerExplanation?: string, explanations?: Record<string, string>, correctAnswer?: string }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [againClicked, setAgainClicked] = useState(false);
  const [easyClicked, setEasyClicked] = useState(false);

  const handleSendMessage = async () => {
    if (!inputValue.trim()) return;

    const newMessage: ChatMessage = {
      id: Date.now().toString(),
      text: inputValue,
      isUser: true,
      timestamp: new Date()
    };

    setChatMessages(prev => [...prev, newMessage]);
    const prevInput = inputValue;
    setInputValue(""); // Optimistically clear

    try {
      const response = await axios.post("http://127.0.0.1:8079/dialog", {
        passage,
        question,
        answer_explanation: answerExplanation,
        user_message: prevInput
      });
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: response.data.answer,
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
    } catch (err) {
      const aiResponse: ChatMessage = {
        id: (Date.now() + 1).toString(),
        text: "Sorry, there was an error contacting the AI backend.",
        isUser: false,
        timestamp: new Date()
      };
      setChatMessages(prev => [...prev, aiResponse]);
      setInputValue(prevInput); // Restore input if error
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-7xl max-h-[90vh] h-[90vh] flex flex-col" aria-describedby="explanation-dialog-desc">
        <DialogHeader>
          <DialogTitle>Question Explanation</DialogTitle>
        </DialogHeader>
        <span id="explanation-dialog-desc" className="sr-only">This dialog provides AI explanations and answer details for the current question.</span>
        {/* Main content area: make it flex-1 and min-h-0 to avoid overlap */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
          {/* AI Chat Section - Left */}
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader>
              <CardTitle className="text-lg">Ask AI for Help</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col h-full min-h-0">
              <div className="flex-1 space-y-4 min-h-0 flex flex-col">
                {/* Chat Messages */}
                <div className="flex-1 h-full overflow-y-auto space-y-3 p-3 bg-muted/20 rounded-lg min-h-0" style={{maxHeight: 'calc(45vh + 80px)'}}>
                  {chatMessages.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">
                      Ask me anything about this question to get personalized help!
                    </p>
                  ) : (
                    chatMessages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex ${message.isUser ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[80%] p-3 rounded-lg text-sm ${
                            message.isUser
                              ? 'bg-primary text-primary-foreground'
                              : 'bg-background border'
                          }`}
                        >
                          {message.text}
                        </div>
                      </div>
                    ))
                  )}
                </div>

                {/* Input Field */}
                <div className="flex gap-2 pt-2">
                  <Input
                    placeholder="Ask a question about this problem..."
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                    onKeyPress={handleKeyPress}
                    className="flex-1"
                  />
                  <Button 
                    onClick={handleSendMessage}
                    disabled={!inputValue.trim()}
                    size="sm"
                  >
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Explanation Section - Right */}
          <Card className="flex flex-col h-full min-h-0">
            <CardHeader>
              <CardTitle className="text-lg">Answer Explanation</CardTitle>
            </CardHeader>
            <CardContent className="flex-1 flex flex-col min-h-0">
              <div className="space-y-4 flex-1 min-h-0 overflow-y-auto">
                <p className="text-sm text-muted-foreground">
                  Your selected answer: <span className="font-semibold text-primary">{selectedAnswer || "None selected"}</span>
                </p>
                {/* Explanations by choice, selected first, then correct, then others */}
                {selectedAnswer && explanations[selectedAnswer] && (
                  <div className={`p-4 rounded-lg border ${selectedAnswer === correctAnswer ? 'bg-green-50 border-green-400' : 'bg-red-50 border-red-400'}`}>
                    <p className="text-sm leading-relaxed">
                      <strong>Choice {selectedAnswer}{selectedAnswer === correctAnswer ? ' (Correct)' : ' (Your Choice)'}:</strong><br />
                      {explanations[selectedAnswer]}
                    </p>
                  </div>
                )}
                {selectedAnswer !== correctAnswer && explanations[correctAnswer] && (
                  <div className="p-4 rounded-lg border bg-green-50 border-green-400">
                    <p className="text-sm leading-relaxed">
                      <strong>Choice {correctAnswer} (Correct):</strong><br />
                      {explanations[correctAnswer]}
                    </p>
                  </div>
                )}
                {/* Show other explanations except selected and correct */}
                {Object.entries(explanations)
                  .filter(([key]) => key !== selectedAnswer && key !== correctAnswer)
                  .map(([key, text]) => (
                    <div key={key} className="p-4 rounded-lg border bg-muted/50">
                      <p className="text-sm leading-relaxed">
                        <strong>Choice {key}:</strong><br />
                        {text}
                      </p>
                    </div>
                  ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Buttons */}
        <div className="flex justify-center gap-4 mt-4 shrink-0">
          <Button 
            onClick={() => { setAgainClicked(true); onOpenChange(false); }}
            variant="outline"
            className={`px-8 hover:bg-[#223971] hover:text-white`}
          >
            Again
          </Button>
          <Button 
            onClick={() => { setEasyClicked(true); onOpenChange(false); }}
            className={`px-8 bg-accent text-accent-foreground hover:bg-accent/90`}
          >
            Easy
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};