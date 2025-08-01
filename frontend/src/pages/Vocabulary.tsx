import { useState, useEffect } from "react";
import { Header } from "@/components/Header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Skeleton } from "@/components/ui/skeleton";
import { VocabularyProgress } from "@/components/VocabularyProgress";
import { useVocabulary } from "@/hooks/useVocabulary";
import { VocabularyCard } from "@/services/vocabularyAPI";

const Vocabulary = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showDefinition, setShowDefinition] = useState(false);
  const [startTime, setStartTime] = useState<number>(Date.now());
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const {
    cards,
    dueCards,
    stats,
    loading,
    error,
    submitAttempt,
    completedCards,
    upcomingCards,
    studyCards,
  } = useVocabulary();

  // Use study cards (due for review) as the main deck
  const flashcards = studyCards.length > 0 ? studyCards : cards;
  const currentCard = flashcards[currentIndex];

  // Reset to first card when flashcards change
  useEffect(() => {
    if (flashcards.length > 0 && currentIndex >= flashcards.length) {
      setCurrentIndex(0);
    }
  }, [flashcards, currentIndex]);

  // Reset start time when showing a new card
  useEffect(() => {
    setStartTime(Date.now());
  }, [currentIndex, showDefinition]);

  const handleCardClick = () => {
    setShowDefinition(!showDefinition);
    if (!showDefinition) {
      setStartTime(Date.now()); // Reset timer when revealing definition
    }
  };

  const handleAgain = async () => {
    if (!currentCard || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const timeElapsed = (Date.now() - startTime) / 1000;
      
      await submitAttempt({
        card_id: currentCard.id,
        result: "again",
        time_elapsed_seconds: timeElapsed,
      });
      
      // Move to next card or loop back
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (flashcards.length > 1) {
        setCurrentIndex(0);
      }
      setShowDefinition(false);
    } catch (error) {
      console.error("Failed to submit attempt:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEasy = async () => {
    if (!currentCard || isSubmitting) return;
    
    setIsSubmitting(true);
    try {
      const timeElapsed = (Date.now() - startTime) / 1000;
      
      await submitAttempt({
        card_id: currentCard.id,
        result: "easy",
        time_elapsed_seconds: timeElapsed,
      });
      
      // Move to next card or loop back
      if (currentIndex < flashcards.length - 1) {
        setCurrentIndex(currentIndex + 1);
      } else if (flashcards.length > 1) {
        setCurrentIndex(0);
      }
      setShowDefinition(false);
    } catch (error) {
      console.error("Failed to submit attempt:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCardSelect = (card: VocabularyCard) => {
    const index = flashcards.findIndex(c => c.id === card.id);
    if (index !== -1) {
      setCurrentIndex(index);
      setShowDefinition(false);
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case "Easy": return "bg-green-100 text-green-800 border-green-200";
      case "Medium": return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Hard": return "bg-red-100 text-red-800 border-red-200";
      default: return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header activeSection="Vocabulary" />
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            <div className="lg:col-span-1 space-y-4">
              <Skeleton className="h-24 w-full" />
              <Skeleton className="h-48 w-full" />
              <Skeleton className="h-48 w-full" />
            </div>
            <div className="lg:col-span-3">
              <div className="text-center mb-6">
                <Skeleton className="h-8 w-64 mx-auto mb-2" />
                <Skeleton className="h-4 w-48 mx-auto" />
              </div>
              <div className="flex justify-center mb-8">
                <Skeleton className="w-full max-w-2xl h-96" />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header activeSection="Vocabulary" />
        <div className="max-w-7xl mx-auto p-6">
          <Card className="border-red-200 bg-red-50">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-red-800 mb-2">Error Loading Vocabulary</h2>
              <p className="text-red-600">{error}</p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // No cards state
  if (flashcards.length === 0) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Header activeSection="Vocabulary" />
        <div className="max-w-7xl mx-auto p-6">
          <Card className="border-primary/20">
            <CardContent className="p-6 text-center">
              <h2 className="text-lg font-semibold text-primary mb-2">No Cards Available</h2>
              <p className="text-muted-foreground">
                {studyCards.length === 0 && cards.length > 0 
                  ? "Great job! You've completed all cards for today. Come back tomorrow for more reviews!"
                  : "No vocabulary cards found. Please check back later."
                }
              </p>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <Header activeSection="Vocabulary" />
      
      <div className="max-w-7xl mx-auto p-6">
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Flashcard Lists Sidebar */}
          <div className="lg:col-span-1 space-y-4">
            {/* Progress Summary */}
            <VocabularyProgress 
              stats={stats} 
              dueCount={studyCards.length} 
            />

            {/* Upcoming Cards */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Upcoming ({upcomingCards.length})</h3>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {upcomingCards.map((card, idx) => {
                      const originalIndex = flashcards.findIndex(c => c.id === card.id);
                      return (
                        <div
                          key={card.id}
                          onClick={() => handleCardSelect(card)}
                          className={`p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                            originalIndex === currentIndex 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'bg-white border-gray-200 hover:border-primary/30'
                          }`}
                        >
                          <div className="font-medium text-sm">{card.word}</div>
                          <Badge className={`mt-1 text-xs ${getDifficultyColor(card.difficulty)}`}>
                            {card.difficulty}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>

            {/* Completed Cards */}
            <Card className="border-primary/20">
              <CardContent className="p-4">
                <h3 className="font-semibold mb-3 text-primary">Completed ({completedCards.length})</h3>
                <ScrollArea className="h-48">
                  <div className="space-y-2">
                    {completedCards.map((card) => {
                      const originalIndex = flashcards.findIndex(c => c.id === card.id);
                      return (
                        <div
                          key={card.id}
                          onClick={() => handleCardSelect(card)}
                          className={`p-2 rounded-lg border cursor-pointer transition-all hover:shadow-sm ${
                            originalIndex === currentIndex 
                              ? 'bg-primary text-primary-foreground border-primary' 
                              : 'bg-green-50 border-green-200 hover:border-primary/30'
                          }`}
                        >
                          <div className="font-medium text-sm">{card.word}</div>
                          <Badge className={`mt-1 text-xs ${getDifficultyColor(card.difficulty)}`}>
                            {card.difficulty}
                          </Badge>
                        </div>
                      );
                    })}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Main Flashcard Area */}
          <div className="lg:col-span-3">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-bold text-primary mb-2">Vocabulary Practice</h1>
            <p className="text-muted-foreground mb-4">Click the card to reveal the definition</p>
            {studyCards.length > 0 && (
              <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800 text-sm">
                <span className="w-2 h-2 bg-blue-500 rounded-full mr-2"></span>
                Spaced Repetition: {studyCards.length} card{studyCards.length > 1 ? 's' : ''} due for review
              </div>
            )}
          </div>            {/* Flashcard */}
            <div className="flex justify-center mb-8">
              <Card 
                className="w-full max-w-2xl h-96 cursor-pointer transition-all duration-300 hover:shadow-lg border-primary/20"
                onClick={handleCardClick}
              >
                <CardContent className="h-full flex flex-col justify-center items-center p-8 text-center">
                  {!showDefinition ? (
                    // Front of card - Word only
                    <div className="space-y-4">
                      <Badge className={`${getDifficultyColor(currentCard.difficulty)} mb-4`}>
                        {currentCard.difficulty}
                      </Badge>
                      <h2 className="text-4xl font-bold text-primary mb-4">{currentCard.word}</h2>
                      <p className="text-muted-foreground">Click to reveal definition</p>
                    </div>
                  ) : (
                    // Back of card - Definition and example
                    <div className="space-y-6">
                      <Badge className={`${getDifficultyColor(currentCard.difficulty)} mb-2`}>
                        {currentCard.difficulty}
                      </Badge>
                      <h2 className="text-3xl font-bold text-primary">{currentCard.word}</h2>
                      <div className="space-y-4">
                        <div>
                          <h3 className="text-lg font-semibold text-primary mb-2">Definition:</h3>
                          <p className="text-lg">{currentCard.definition}</p>
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-primary mb-2">Example:</h3>
                          <p className="text-muted-foreground italic">"{currentCard.example}"</p>
                        </div>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            {showDefinition && (
              <div className="flex justify-center space-x-4">
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={handleAgain}
                  disabled={isSubmitting}
                  className="px-8 py-3 border-red-200 text-red-700 hover:bg-red-50 disabled:opacity-50"
                >
                  {isSubmitting ? "Scheduling..." : "Again"}
                </Button>
                <Button 
                  size="lg"
                  onClick={handleEasy}
                  disabled={isSubmitting}
                  className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white disabled:opacity-50"
                >
                  {isSubmitting ? "Completing..." : "Easy"}
                </Button>
              </div>
            )}

            {/* Card Counter and Review Info */}
            <div className="text-center mt-6 space-y-2">
              <p className="text-muted-foreground">
                Card {currentIndex + 1} of {flashcards.length}
              </p>
              {currentCard?.failure_count > 0 && (
                <p className="text-sm text-orange-600">
                  Review attempt #{currentCard.failure_count + 1}
                </p>
              )}
              {currentCard?.next_review_date && (
                <p className="text-xs text-muted-foreground">
                  Last scheduled: {new Date(currentCard.next_review_date).toLocaleDateString()}
                </p>
              )}
            </div>

            {/* Spaced Repetition Explanation */}
            <Card className="mt-8 border-blue-200 bg-blue-50">
              <CardContent className="p-6">
                <h3 className="font-semibold text-blue-800 mb-3">How Spaced Repetition Works</h3>
                <div className="text-sm text-blue-700 space-y-2">
                  <p><strong>Easy:</strong> Mark as completed. The card won't appear again.</p>
                  <p><strong>Again:</strong> Schedule for review. Cards reappear at increasing intervals (1 day → 3 days → 1 week → 2 weeks → 1 month).</p>
                  <p>This system helps you focus on words you're struggling with while reinforcing your memory over time.</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Vocabulary;
