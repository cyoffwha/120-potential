# Vocabulary Flashcard System with Spaced Repetition

## Overview

This vocabulary flashcard system implements spaced repetition to help users learn and retain vocabulary words efficiently. Cards are scheduled for review at increasing intervals based on user performance.

## How It Works

### Spaced Repetition Algorithm

1. **Easy Button**: Marks the card as completed. The card will not appear again.
2. **Again Button**: Schedules the card for review at increasing intervals:
   - 1st failure: Review in 1 day
   - 2nd failure: Review in 3 days  
   - 3rd failure: Review in 1 week (7 days)
   - 4th failure: Review in 2 weeks (14 days)
   - 5th+ failure: Review in 1 month (30 days)

### Database Schema

#### Vocabulary Cards
- `id`: Unique identifier
- `word`: The vocabulary word
- `definition`: Word definition
- `example`: Example sentence (optional)
- `difficulty`: Easy/Medium/Hard
- `category`: Grouping category (optional)

#### User Vocabulary Attempts
- `user_id`: User who attempted the card
- `card_id`: Card being attempted
- `result`: "again" or "easy"
- `time_elapsed_seconds`: Time spent on the card
- `attempted_at`: Timestamp of attempt
- `interval_days`: Days until next review
- `next_review_date`: Scheduled review date
- `failure_count`: Number of "again" attempts

## API Endpoints

### GET /vocabulary/cards
Returns all vocabulary cards with user progress status.

### GET /vocabulary/due-cards  
Returns only cards that are due for review today (including new cards).

### POST /vocabulary/submit-attempt
Submit a user's attempt on a card.

**Request Body:**
```json
{
  "card_id": 1,
  "result": "again",
  "time_elapsed_seconds": 5.5
}
```

**Response:**
```json
{
  "status": "success",
  "message": "Vocabulary attempt submitted successfully", 
  "next_review_date": "2025-08-02",
  "failure_count": 1,
  "interval_days": 1
}
```

### GET /vocabulary/stats
Returns learning statistics.

**Response:**
```json
{
  "total_cards": 15,
  "completed_cards": 3,
  "due_today": 5,
  "completion_percentage": 20.0
}
```

## Frontend Features

### Study Interface
- Clean flashcard interface with click-to-reveal
- Progress tracking with completion percentage
- Separate lists for upcoming vs completed cards
- Visual indicators for difficulty levels

### Spaced Repetition Integration
- Shows only cards due for review
- Tracks review attempts and failure counts
- Provides user feedback on scheduling
- Timer tracking for engagement metrics

### User Experience
- Loading states during API calls
- Error handling with user-friendly messages
- Toast notifications for feedback
- Responsive design for all devices

## Setup Instructions

### Backend Setup
1. Database migrations are already applied via `add_spaced_repetition_columns.py`
2. Sample vocabulary data can be loaded via `add_sample_vocabulary.py`  
3. Server runs on port 8079 with uvicorn

### Frontend Setup
1. Vocabulary route is configured at `/vocabulary`
2. API service layer handles all backend communication
3. Custom hook `useVocabulary` manages state and API calls
4. UI components are fully integrated with Tailwind CSS

## Sample Vocabulary Data

The system includes 15 SAT-level vocabulary words:
- 5 Easy words (e.g., "Pragmatic", "Coherent")
- 6 Medium words (e.g., "Ubiquitous", "Venerate") 
- 4 Hard words (e.g., "Ephemeral", "Sanguine")

## Testing

The system can be tested by:
1. Starting the backend server
2. Loading the vocabulary page in the frontend
3. Practicing with flashcards using Easy/Again buttons
4. Observing spaced repetition scheduling in action

## Benefits

- **Efficient Learning**: Focus time on difficult words
- **Long-term Retention**: Scientifically-backed spacing intervals  
- **Progress Tracking**: Clear visibility into learning progress
- **Adaptive**: System adjusts to individual performance
- **Scalable**: Can handle large vocabulary sets efficiently
