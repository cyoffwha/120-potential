import { useState, useEffect, useRef } from "react";
import axios from "axios";
import { BACKEND_URL } from "../config";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Send } from "lucide-react";
import "./animate-fadein.css";

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

export const ExplanationDialog = ({ open, onOpenChange, selectedAnswer, passage = '', question = '', answerExplanation = '', explanations = {}, correctAnswer = 'A', onAgain, onEasy, initialUserMessage = "" }: ExplanationDialogProps & { passage?: string, question?: string, answerExplanation?: string, explanations?: Record<string, string>, correctAnswer?: string, onAgain?: () => void, onEasy?: () => void, initialUserMessage?: string }) => {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>(
    initialUserMessage && open
      ? [{ id: Date.now().toString(), text: initialUserMessage, isUser: true, timestamp: new Date() }]
      : []
  );
  const [inputValue, setInputValue] = useState("");
  const [againClicked, setAgainClicked] = useState(false);
  const [easyClicked, setEasyClicked] = useState(false);

  // Text selection popup state
  const [showChat, setShowChat] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [chatPosition, setChatPosition] = useState<{ x: number; y: number } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);
  
  const chatPopupRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);
  const dialogContentRef = useRef<HTMLDivElement>(null);

  // Use BACKEND_URL from config

  // Persist selection highlight while popup is open using stored range
  useEffect(() => {
    if (showChat && selectedRange) {
      const selection = window.getSelection();
      if (selection && selection.rangeCount > 0) {
        // Only reselect if not already selected
        const currentRange = selection.getRangeAt(0);
        if (currentRange.toString() !== selectedRange.toString()) {
          selection.removeAllRanges();
          selection.addRange(selectedRange);
        }
      } else if (selection) {
        selection.removeAllRanges();
        selection.addRange(selectedRange);
      }
    }
  }, [showChat, selectedRange]);

  // Listen for text selection within the dialog
  useEffect(() => {
    if (!open) return;

    const handleMouseUp = (e: MouseEvent) => {
      // If popup is open and click is inside the popup, do nothing
      if (
        showChat &&
        chatPopupRef.current &&
        chatPopupRef.current.contains(e.target as Node)
      ) {
        return;
      }

      // Only handle selections within the dialog content
      const dialogElement = dialogContentRef.current;
      if (!dialogElement?.contains(e.target as Node)) {
        return;
      }

      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        const clonedRange = range.cloneRange();
        setSelectedText(selection.toString());
        setSelectedRange(clonedRange);

        // Use the last rect of the selection for popup position
        const rects = clonedRange.getClientRects();
        let x = e.clientX, y = e.clientY;
        if (rects.length > 0) {
          const lastRect = rects[rects.length - 1];
          const dialogRect = dialogElement.getBoundingClientRect();

          // Position relative to viewport
          let popupX = lastRect.right - 2;
          let popupY = lastRect.bottom - 48;

          // Ensure popup doesn't go off-screen
          if (popupX + 200 > window.innerWidth) { // 200 is approx popup width
            popupX = window.innerWidth - 210;
          }
          if (popupY < 0) {
            popupY = 10;
          }

          x = popupX;
          y = popupY;
        }

        setChatPosition({ x, y });
        setShowChat(true);
        setChatInput("");
      } else if (showChat && !selection?.toString().trim()) {
        // Only clear if there's truly no selection and popup is showing
        setShowChat(false);
        setSelectedText("");
        setSelectedRange(null);
        setChatInput("");
        setChatPosition(null);
      }
    };

    // Add event listener to document but filter by dialog content
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [showChat, open]);

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
      const response = await axios.post(`${BACKEND_URL}/dialog`, {
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

  // Reset chat and auto-send initialUserMessage when dialog is opened with a new initialUserMessage
  useEffect(() => {
    let didSend = false;
    if (open && initialUserMessage) {
      setChatMessages([
        { id: Date.now().toString(), text: initialUserMessage, isUser: true, timestamp: new Date() }
      ]);
      // Auto-send to backend
      (async () => {
        try {
          const response = await axios.post(`${BACKEND_URL}/dialog`, {
            passage,
            question,
            answer_explanation: answerExplanation,
            user_message: initialUserMessage
          });
          const aiResponse = {
            id: (Date.now() + 1).toString(),
            text: response.data.answer,
            isUser: false,
            timestamp: new Date()
          };
          setChatMessages(prev => [...prev, aiResponse]);
        } catch (err) {
          setChatMessages(prev => [
            ...prev,
            {
              id: (Date.now() + 1).toString(),
              text: "Sorry, there was an error contacting the AI backend.",
              isUser: false,
              timestamp: new Date()
            }
          ]);
        }
      })();
      didSend = true;
    } else if (open && !initialUserMessage) {
      setChatMessages([]);
    }
    return () => { didSend = false; };
  }, [open, initialUserMessage, passage, question, answerExplanation]);

  // Reset text selection popup state when dialog closes
  useEffect(() => {
    if (!open) {
      setShowChat(false);
      setSelectedText("");
      setSelectedRange(null);
      setChatInput("");
      setChatPosition(null);
      // Clear any lingering text selections when dialog closes
      const selection = window.getSelection();
      if (selection) {
        selection.removeAllRanges();
      }
    }
  }, [open]);

  // Ensure input gets focus when popup shows
  useEffect(() => {
    if (showChat && chatInputRef.current) {
      // Immediate focus without timeout to reduce lag
      chatInputRef.current.focus();
    }
  }, [showChat]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent ref={dialogContentRef} className="max-w-7xl max-h-[90vh] h-[90vh] flex flex-col" aria-describedby="explanation-dialog-desc">
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

        {/* Bottom Button: Next only, aligned right */}
        <div className="flex justify-end gap-4 mt-4 shrink-0">
          <Button 
            onClick={() => { if (onEasy) onEasy(); onOpenChange(false); }}
            className={`px-8 bg-accent text-accent-foreground hover:bg-accent/90`}
          >
            Next
          </Button>
        </div>

        {/* Small floating chat input near selection - NOW INSIDE dialog content */}
        {showChat && chatPosition && (
          <div
            ref={chatPopupRef}
            className="animate-fadein"
            style={{
              position: "absolute", // Use absolute positioning relative to DialogContent
              left: chatPosition.x,
              top: chatPosition.y,
              zIndex: 100, // z-index relative to dialog content
              background: "rgba(255,255,255,0.98)",
              border: "1.5px solid #cbd5e1",
              borderRadius: 10,
              boxShadow: "0 4px 24px 0 rgba(30,41,59,0.13)",
              padding: "6px 12px",
              minWidth: 200,
              display: "flex",
              alignItems: "center"
            }}
          >
            <input
              ref={chatInputRef}
              className="border-none outline-none text-sm flex-1 bg-transparent text-slate-800 placeholder:text-slate-400"
              style={{ minWidth: 120 }}
              placeholder="Ask AI..."
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              onKeyDown={e => {
                if (e.key === 'Enter' && chatInput.trim()) {
                  setShowChat(false);
                  // Add the question directly to the existing chat
                  const newMessage: ChatMessage = {
                    id: Date.now().toString(),
                    text: `Regarding the "${selectedText}", I ask you: "${chatInput.trim()}"`,
                    isUser: true,
                    timestamp: new Date()
                  };
                  setChatMessages(prev => [...prev, newMessage]);
                  
                  // Send to backend
                  (async () => {
                    try {
                      const response = await axios.post(`${BACKEND_URL}/dialog`, {
                        passage,
                        question,
                        answer_explanation: answerExplanation,
                        user_message: `Regarding the "${selectedText}", I ask you: "${chatInput.trim()}"`
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
                    }
                  })();
                  
                  // Clear selection state only after using it
                  setSelectedText("");
                  setSelectedRange(null);
                  setChatInput("");
                  setChatPosition(null);
                }
              }}
              autoFocus
            />
            <button
              className="ml-2 text-xs text-slate-400 hover:text-slate-700 focus:outline-none"
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 18, padding: 0 }}
              onClick={() => {
                setShowChat(false);
                setChatInput("");
                setChatPosition(null);
                // Don't clear selectedText and selectedRange - let user keep the selection
              }}
              tabIndex={-1}
              aria-label="Close chat popup"
            >
              ✕
            </button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};