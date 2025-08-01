import { useState, useEffect } from "react";
import { vocabularyAPI, VocabularyCard, VocabularyStats, SubmitAttemptRequest } from "@/services/vocabularyAPI";
import { useToast } from "@/hooks/use-toast";

// NOTE: Currently using mock data for demonstration purposes
// TODO: Replace with actual API calls when vocabulary backend is ready

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
      
      // TODO: Replace with real API calls when backend is ready
      // Mock data for demonstration
      const mockCards: VocabularyCard[] = [
        {
          id: 1,
          word: "eloquent",
          definition: "fluent and persuasive in speaking or writing",
          example: "The speaker gave an eloquent speech that moved the entire audience.",
          difficulty: "Medium",
          category: "Academic",
          completed: false,
          reviewed: true,
          next_review_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
          failure_count: 0,
          is_due_for_review: false
        },
        {
          id: 2,
          word: "ubiquitous",
          definition: "present, appearing, or found everywhere",
          example: "Smartphones have become ubiquitous in modern society.",
          difficulty: "Hard",
          category: "Academic",
          completed: false,
          reviewed: true,
          next_review_date: new Date().toISOString(),
          failure_count: 1,
          is_due_for_review: true
        },
        {
          id: 3,
          word: "meticulous",
          definition: "showing great attention to detail; very careful and precise",
          example: "The scientist was meticulous in recording her experimental data.",
          difficulty: "Medium",
          category: "Academic",
          completed: false,
          reviewed: true,
          next_review_date: new Date().toISOString(),
          failure_count: 0,
          is_due_for_review: true
        },
        {
          id: 4,
          word: "ephemeral",
          definition: "lasting for a very short time",
          example: "The beauty of cherry blossoms is ephemeral, lasting only a few weeks.",
          difficulty: "Hard",
          category: "Academic",
          completed: false,
          reviewed: true,
          next_review_date: new Date(Date.now() - 60 * 60 * 1000).toISOString(),
          failure_count: 2,
          is_due_for_review: true
        },
        {
          id: 5,
          word: "tenacious",
          definition: "holding firmly to something; persistent",
          example: "Despite many setbacks, she remained tenacious in pursuing her goals.",
          difficulty: "Easy",
          category: "Common",
          completed: false,
          reviewed: true,
          next_review_date: new Date().toISOString(),
          failure_count: 0,
          is_due_for_review: true
        },
        {
          id: 6,
          word: "cogent",
          definition: "clear, logical, and convincing",
          example: "The lawyer presented a cogent argument that swayed the jury.",
          difficulty: "Hard",
          category: "Academic",
          completed: true,
          reviewed: true,
          next_review_date: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
          failure_count: 0,
          is_due_for_review: false
        },
        {
          id: 7,
          word: "gregarious",
          definition: "fond of the company of others; sociable",
          example: "She was naturally gregarious and made friends easily.",
          difficulty: "Medium",
          category: "Personality",
          completed: false,
          reviewed: false,
          failure_count: 0,
          is_due_for_review: true
        },
        {
          id: 8,
          word: "pernicious",
          definition: "having a harmful effect in a gradual or subtle way",
          example: "The pernicious effects of pollution are often not immediately visible.",
          difficulty: "Hard",
          category: "Academic",
          completed: false,
          reviewed: true,
          next_review_date: new Date().toISOString(),
          failure_count: 1,
          is_due_for_review: true
        }
      ];

      const mockDueCards = mockCards.filter(card => card.is_due_for_review);

      const mockStats: VocabularyStats = {
        total_cards: mockCards.length,
        due_today: mockDueCards.length,
        completed_cards: mockCards.filter(card => card.completed).length,
        completion_percentage: Math.round((mockCards.filter(card => card.completed).length / mockCards.length) * 100)
      };
      
      setCards(mockCards);
      setDueCards(mockDueCards);
      setStats(mockStats);
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
      // TODO: Replace with real API call when backend is ready
      // Mock implementation for demonstration
      const mockResponse = {
        success: true,
        interval_days: request.result === "easy" ? 0 : (request.result === "again" ? 1 : 3),
        next_review_date: request.result === "easy" ? null : new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      };
      
      // Update local state to simulate the API response
      setCards(prevCards => 
        prevCards.map(card => 
          card.id === request.card_id 
            ? {
                ...card,
                completed: request.result === "easy",
                failure_count: request.result === "again" ? card.failure_count + 1 : card.failure_count,
                is_due_for_review: request.result === "easy" ? false : true,
                next_review_date: mockResponse.next_review_date || undefined
              }
            : card
        )
      );
      
      // Show success message with spaced repetition info
      if (request.result === "easy") {
        toast({
          title: "Card Completed! 🎉",
          description: "Great job! This card has been moved to completed.",
          variant: "default",
        });
      } else {
        const reviewMessage = mockResponse.next_review_date 
          ? `You'll see this card again in ${mockResponse.interval_days} day${mockResponse.interval_days > 1 ? 's' : ''}.`
          : "You'll see this card again soon.";
        
        toast({
          title: "Card Scheduled for Review",
          description: reviewMessage,
          variant: "default",
        });
      }
      
      // Reload data to get updated states
      await loadData();
      
      return mockResponse;
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
