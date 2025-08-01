import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExplanationDialog } from "./ExplanationDialog";
import { useRandomQuestion } from "../hooks/useRandomQuestion";
import { Header } from "./Header";
import { QuestionBank } from "./QuestionBank";
import { CurrentQuestionInfo } from "./CurrentQuestionInfo";
import { ReadingPassage } from "./ReadingPassage";
import { MultipleChoice } from "./MultipleChoice";
import { QuestionNavigation } from "./QuestionNavigation";
import { FilterOptions } from "../types";
import { DEFAULT_FILTER_VALUE, CHOICE_LABELS } from "../constants";
import "./animate-fadein.css";

export const EducationPlatform = () => {
  const chatPopupRef = useRef<HTMLDivElement>(null);
  const chatInputRef = useRef<HTMLInputElement>(null);

  const { current, loading, error, nextRandom, hasQuestions, applyFilters, totalQuestions } = useRandomQuestion();
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  // Handle filter changes
  const handleFiltersChange = (filters: FilterOptions) => {
    // Apply filters to backend
    applyFilters(filters);
  };

  // Chat window state
  const [showChat, setShowChat] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [chatPosition, setChatPosition] = useState<{ x: number; y: number } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [showExplanationDialog, setShowExplanationDialog] = useState(false);
  const [initialChat, setInitialChat] = useState<string>("");
  // Store the selection range for reliable persistence
  const [selectedRange, setSelectedRange] = useState<Range | null>(null);

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

  // Listen for text selection
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      // If the explanation dialog is open, do nothing.
      // The dialog will handle its own text selection.
      if (showExplanationDialog) {
        return;
      }

      // If popup is open and click is inside the popup, do nothing
      if (
        showChat &&
        chatPopupRef.current &&
        chatPopupRef.current.contains(e.target as Node)
      ) {
        return;
      }

      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0).cloneRange();
        setSelectedText(selection.toString());
        setSelectedRange(range);
        // Use the last rect of the selection for popup position (end of last line)
        const rects = range.getClientRects();
        let x = e.clientX, y = e.clientY;
        if (rects.length > 0) {
          const lastRect = rects[rects.length - 1];
          x = lastRect.right - 2; // 1px to the right
          y = lastRect.bottom - 48; // 65px higher than end of last line
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
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [showChat, showExplanationDialog]);

  const handleAnswerChange = (answer: string) => {
    setSelectedAnswer(answer);
  };

  const handleAgain = () => {
    setSelectedAnswer("");
    setFeedback("");
    nextRandom();
  };

  const handleEasy = () => {
    setSelectedAnswer("");
    setFeedback("");
    nextRandom();
  };

  // Ensure input gets focus when popup shows
  useEffect(() => {
    if (showChat && chatInputRef.current) {
      // Immediate focus without timeout to reduce lag
      chatInputRef.current.focus();
    }
  }, [showChat]);

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection="Practice" />
      <main className="max-w-7xl mx-auto px-6 py-6">
        {loading && <div>Loading questions...</div>}
        {error && <div className="text-red-600">{error}</div>}
        {!loading && !hasQuestions && (
          <div className="text-red-600 font-bold">No questions in the database. Please add some first.</div>
        )}
        {current && (
          <div className="space-y-6">
            {/* Main Question Interface */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Text Content - Left Side */}
              <div className="space-y-6">
                <ReadingPassage passages={current.passage ? [{ title: "Passage", content: current.passage }] : []} />
                {/* Current Question Details block below passage */}
                <CurrentQuestionInfo 
                  questionId={current.question_id || "#unknown"}
                  currentDomain={current.domain || "Information and Ideas"}
                  currentSkill={current.skill || "Command of Evidence"}
                  currentDifficulty={current.difficulty || "Easy"}
                  totalQuestions={totalQuestions}
                />
              </div>
              {/* Question - Right Side */}
              <div className="space-y-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <MultipleChoice
                      question={current.question}
                      questionId={current.question_id}
                      options={CHOICE_LABELS.map(label => ({
                        id: label,
                        text: current[`choice_${label.toLowerCase()}`]
                      }))}
                      selectedAnswer={selectedAnswer}
                      onAnswerChange={handleAnswerChange}
                      onAgain={handleAgain}
                      onEasy={handleEasy}
                      passage={current.passage}
                      answerExplanation={current.rationale_a || ""}
                      explanations={Object.fromEntries(
                        CHOICE_LABELS.map(label => [
                          label, 
                          current[`rationale_${label.toLowerCase()}`] || ""
                        ])
                      )}
                      correctAnswer={current.correct_choice}
                    />
                  </div>
                  {feedback && <div>{feedback}</div>}
                </div>
              </div>
            </div>
            {/* Question Filters moved to the bottom */}
            <QuestionBank 
              questionId={current.question_id || "#unknown"}
              currentDomain={DEFAULT_FILTER_VALUE}
              currentSkill={DEFAULT_FILTER_VALUE}
              currentDifficulty={DEFAULT_FILTER_VALUE}
              onFiltersChange={handleFiltersChange}
            />
          </div>
        )}
        {/* Small floating chat input near selection */}
        {showChat && chatPosition && (
          <div
            ref={chatPopupRef}
            className="animate-fadein"
            style={{
              position: "fixed",
              left: chatPosition.x,
              top: chatPosition.y,
              zIndex: 9999,
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
                  setInitialChat(`Regarding the "${selectedText}", I ask you: "${chatInput.trim()}"`);
                  setShowExplanationDialog(true);
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
      {/* ExplanationDialog for AI chat with selected text */}
      <ExplanationDialog
        open={showExplanationDialog}
        onOpenChange={setShowExplanationDialog}
        selectedAnswer={selectedAnswer}
        explanations={{
          A: current?.rationale_a || "",
          B: current?.rationale_b || "",
          C: current?.rationale_c || "",
          D: current?.rationale_d || ""
        }}
        correctAnswer={current?.correct_choice || "A"}
        passage={current?.passage || ""}
        question={current?.question || ""}
        answerExplanation={current?.rationale_a || ""}
        onAgain={handleAgain}
        onEasy={handleEasy}
        // Pre-populate chat with the composed message
        key={showExplanationDialog ? initialChat : undefined}
        initialUserMessage={initialChat}
      />
      </main>
    </div>
  );
};