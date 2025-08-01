import { useState, useEffect } from "react";
import { vocabularyAPI, VocabularyCard, VocabularyStats, SubmitAttemptRequest } from "@/services/vocabularyAPI";
import { useToast } from "@/hooks/use-toast";

export const useVocabulary = () => {
  const [cards, setCards] = useState<VocabularyCard[]>([]);
  const [dueCards, setDueCards] = useState<VocabularyCard[]>([]);
  const [stats, setStats] = useState<VocabularyStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();

  // Load initial data
  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [allCards, dueCards, statsData] = await Promise.all([
        vocabularyAPI.getAllCards(),
        vocabularyAPI.getDueCards(),
        vocabularyAPI.getStats(),
      ]);
      
      setCards(allCards);
      setDueCards(dueCards);
      setStats(statsData);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to load vocabulary data";
      setError(errorMessage);
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Submit an attempt with spaced repetition
  const submitAttempt = async (request: SubmitAttemptRequest) => {
    try {
      const response = await vocabularyAPI.submitAttempt(request);
      
      // Show success message with spaced repetition info
      if (request.result === "easy") {
        toast({
          title: "Card Completed! 🎉",
          description: "Great job! This card has been moved to completed.",
          variant: "default",
        });
      } else {
        const reviewMessage = response.next_review_date 
          ? `You'll see this card again in ${response.interval_days} day${response.interval_days > 1 ? 's' : ''}.`
          : "You'll see this card again soon.";
        
        toast({
          title: "Card Scheduled for Review",
          description: reviewMessage,
          variant: "default",
        });
      }
      
      // Reload data to get updated states
      await loadData();
      
      return response;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to submit attempt";
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
      throw err;
    }
  };

  // Get cards by category
  const getCardsByCategory = (completed: boolean) => {
    return cards.filter(card => card.completed === completed);
  };

  // Get cards that are due for review today
  const getCardsForStudy = () => {
    return dueCards;
  };

  // Calculate completion percentage
  const getCompletionPercentage = () => {
    if (!stats) return 0;
    return stats.completion_percentage;
  };

  // Check if there are cards to study
  const hasCardsToStudy = () => {
    return dueCards.length > 0;
  };

  // Initialize data on mount
  useEffect(() => {
    loadData();
  }, []);

  return {
    // Data
    cards,
    dueCards,
    stats,
    loading,
    error,
    
    // Actions
    submitAttempt,
    loadData,
    
    // Computed values
    getCardsByCategory,
    getCardsForStudy,
    getCompletionPercentage,
    hasCardsToStudy,
    
    // Convenience getters
    completedCards: getCardsByCategory(true),
    upcomingCards: getCardsByCategory(false),
    studyCards: getCardsForStudy(),
  };
};
