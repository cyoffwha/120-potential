  // Persist selection highlight while popup is open
  useEffect(() => {
    if (showChat && selectedText) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== selectedText) {
        // Try to find and reselect the text in the document
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        let node;
        let found = false;
        while ((node = walker.nextNode())) {
          const idx = node.textContent?.indexOf(selectedText);
          if (idx !== undefined && idx !== -1) {
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + selectedText.length);
            selection.removeAllRanges();
            selection.addRange(range);
            found = true;
            break;
          }
        }
      }
    }
  }, [showChat, selectedText]);
import { useState, useEffect, useRef } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ExplanationDialog } from "./ExplanationDialog";
import { useRandomQuestion } from "../hooks/useRandomQuestion";
import { Header } from "./Header";
import { QuestionBank } from "./QuestionBank";
import { ReadingPassage } from "./ReadingPassage";
import { MultipleChoice } from "./MultipleChoice";
import { QuestionNavigation } from "./QuestionNavigation";

export const EducationPlatform = () => {
  // Persist selection highlight while popup is open
  useEffect(() => {
    if (showChat && selectedText) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== selectedText) {
        // Try to find and reselect the text in the document
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        let node;
        let found = false;
        while ((node = walker.nextNode())) {
          const idx = node.textContent?.indexOf(selectedText);
          if (idx !== undefined && idx !== -1) {
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + selectedText.length);
            selection.removeAllRanges();
            selection.addRange(range);
            found = true;
            break;
          }
        }
      }
    }
  }, [showChat, selectedText]);

  const { current, loading, error, nextRandom, hasQuestions } = useRandomQuestion();
  const [selectedAnswer, setSelectedAnswer] = useState("");
  const [feedback, setFeedback] = useState("");

  // Chat window state
  const [showChat, setShowChat] = useState(false);
  const [selectedText, setSelectedText] = useState("");
  const [chatPosition, setChatPosition] = useState<{ x: number; y: number } | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [showExplanationDialog, setShowExplanationDialog] = useState(false);
  const [initialChat, setInitialChat] = useState<string>("");
  const chatInputRef = useRef<HTMLInputElement>(null);

  // Persist selection highlight while popup is open
  useEffect(() => {
    if (showChat && selectedText) {
      const selection = window.getSelection();
      if (selection && selection.toString().trim() !== selectedText) {
        // Try to find and reselect the text in the document
        const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT, null);
        let node;
        let found = false;
        while ((node = walker.nextNode())) {
          const idx = node.textContent?.indexOf(selectedText);
          if (idx !== undefined && idx !== -1) {
            const range = document.createRange();
            range.setStart(node, idx);
            range.setEnd(node, idx + selectedText.length);
            selection.removeAllRanges();
            selection.addRange(range);
            found = true;
            break;
          }
        }
      }
    }
  }, [showChat, selectedText]);

  // Listen for text selection
  useEffect(() => {
    const handleMouseUp = (e: MouseEvent) => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim().length > 0) {
        const range = selection.getRangeAt(0);
        setSelectedText(selection.toString());
        setChatPosition({ x: e.clientX + 7, y: e.clientY - 47 });
        setShowChat(true);
        setChatInput("");
        // Reselect after popup appears to keep highlight
        setTimeout(() => {
          selection.removeAllRanges();
          selection.addRange(range);
        }, 0);
      } else if (showChat) {
        setShowChat(false);
        setSelectedText("");
        setChatInput("");
        setChatPosition(null);
      }
    };
    document.addEventListener("mouseup", handleMouseUp);
    return () => document.removeEventListener("mouseup", handleMouseUp);
  }, [showChat]);

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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Text Content - Left Side */}
            <div className="space-y-6">
              <ReadingPassage passages={current.passage ? [{ title: "Passage", content: current.passage }] : []} />
            </div>
            {/* Question - Right Side */}
            <div className="space-y-6">
              <MultipleChoice
                question={current.question}
                options={[
                  { id: "A", text: current.choice_a },
                  { id: "B", text: current.choice_b },
                  { id: "C", text: current.choice_c },
                  { id: "D", text: current.choice_d },
                ]}
                selectedAnswer={selectedAnswer}
                onAnswerChange={handleAnswerChange}
                onAgain={handleAgain}
                onEasy={handleEasy}
                passage={current.passage}
                answerExplanation={current.rationale_a || ""}
                explanations={{
                  A: current.rationale_a || "",
                  B: current.rationale_b || "",
                  C: current.rationale_c || "",
                  D: current.rationale_d || ""
                }}
                correctAnswer={current.correct_choice}
              />
              {/* Again/Easy buttons removed; handled in ExplanationDialog */}
              {feedback && <div>{feedback}</div>}
            </div>
          </div>
        )}
        {/* Small floating chat input near selection */}
        {showChat && chatPosition && (
          <div
            style={{
              position: "fixed",
              left: chatPosition.x,
              top: chatPosition.y,
              zIndex: 100,
              background: "rgba(255,255,255,0.92)",
              border: "1.5px solid #cbd5e1",
              borderRadius: 10,
              boxShadow: "0 4px 24px 0 rgba(30,41,59,0.13)",
              padding: "6px 12px",
              minWidth: 200,
              display: "flex",
              alignItems: "center",
              transition: "box-shadow 0.2s, border 0.2s"
            }}
            onMouseDown={e => e.stopPropagation()}
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
                  setInitialChat(`"${selectedText}" - "${chatInput.trim()}"`);
                  setShowExplanationDialog(true);
                }
              }}
              autoFocus
            />
            <button
              className="ml-2 text-xs text-slate-400 hover:text-slate-700 focus:outline-none"
              style={{ background: "none", border: "none", cursor: "pointer", fontWeight: 700, fontSize: 18, padding: 0 }}
              onClick={() => {
                setShowChat(false);
                setSelectedText("");
                setChatInput("");
                setChatPosition(null);
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
        explanations={{}}
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