# Educational Platform Interface - Setup Guide

This React TypeScript interface replicates a professional educational testing platform similar to SAT practice systems.

## 🎯 Features Included

- **Clean Header Navigation** - Professional top navigation with user avatar
- **Question Bank Display** - Comprehensive question metadata and controls  
- **Reading Passages** - Multi-text display with proper typography
- **Multiple Choice Interface** - Interactive question answering with radio buttons
- **Question Navigation Grid** - Visual question status tracking with color coding
- **Responsive Design** - Works on desktop, tablet, and mobile
- **Accessibility** - Proper ARIA labels and keyboard navigation

## 🚀 How to Use This Code in Your Project

### Prerequisites
```bash
# Required dependencies (already included in this project)
npm install @radix-ui/react-avatar
npm install @radix-ui/react-radio-group  
npm install @radix-ui/react-label
npm install lucide-react
```

### 1. Copy the Design System
First, copy the design system from `src/index.css` - specifically the educational color scheme:

```css
/* Add to your index.css */
:root {
  /* Educational blue theme */
  --primary: 210 100% 50%;
  --primary-foreground: 0 0% 100%;
  --primary-hover: 210 100% 45%;
  
  /* Educational status colors */
  --success: 142 76% 36%;
  --incorrect: 0 84% 60%;
  --review: 45 93% 47%;
  --unanswered: 220 8.9% 46.1%;
  
  --accent: 188 100% 45%;
  --accent-foreground: 0 0% 100%;
}
```

### 2. Update Tailwind Config
Add the educational colors to your `tailwind.config.ts`:

```typescript
// Add to your colors section
colors: {
  // ... existing colors
  success: {
    DEFAULT: 'hsl(var(--success))',
    foreground: 'hsl(var(--success-foreground))'
  },
  correct: 'hsl(var(--correct))',
  incorrect: 'hsl(var(--incorrect))',
  review: 'hsl(var(--review))',
  unanswered: 'hsl(var(--unanswered))',
}
```

### 3. Copy Components
Copy these component files to your project:

- `src/components/Header.tsx` - Main navigation header
- `src/components/QuestionBank.tsx` - Question metadata display
- `src/components/ReadingPassage.tsx` - Text passages viewer  
- `src/components/MultipleChoice.tsx` - Question interface
- `src/components/QuestionNavigation.tsx` - Question grid navigation
- `src/components/EducationPlatform.tsx` - Main layout component

### 4. Basic Implementation

```typescript
import { EducationPlatform } from "@/components/EducationPlatform";

function App() {
  return <EducationPlatform />;
}
```

## 🎨 Customization Options

### Customize Question Data
```typescript
// Custom passages for ReadingPassage component
const customPassages = [
  {
    title: "Text 1",
    content: "Your custom reading passage content here..."
  },
  {
    title: "Text 2", 
    content: "Additional passage content..."
  }
];

<ReadingPassage passages={customPassages} />
```

### Custom Multiple Choice Questions
```typescript
const customOptions = [
  { id: "A", text: "Your first answer option" },
  { id: "B", text: "Your second answer option" },
  { id: "C", text: "Your third answer option" },
  { id: "D", text: "Your fourth answer option" }
];

<MultipleChoice 
  question="Your custom question text?"
  options={customOptions}
  onAnswerChange={(answer) => console.log('Selected:', answer)}
/>
```

### Question Status Tracking
```typescript
const questionStatuses = [
  { questionNumber: 1, status: 'correct' },
  { questionNumber: 2, status: 'incorrect' },
  { questionNumber: 3, status: 'review' },
  { questionNumber: 4, status: 'unanswered' }
];

<QuestionNavigation 
  questionStatuses={questionStatuses}
  onQuestionSelect={(num) => console.log('Question:', num)}
/>
```

## 🎯 Component Props Reference

### Header Component
```typescript
interface HeaderProps {
  activeSection?: string; // Currently active navigation item
}
```

### QuestionBank Component
```typescript
interface QuestionBankProps {
  questionId?: string;      // e.g., "#01382"
  totalQuestions?: number;  // Total number of questions
}
```

### ReadingPassage Component
```typescript
interface PassageText {
  title: string;   // e.g., "Text 1"
  content: string; // The passage content
}

interface ReadingPassageProps {
  passages?: PassageText[];
}
```

### MultipleChoice Component
```typescript
interface ChoiceOption {
  id: string;   // e.g., "A", "B", "C", "D"
  text: string; // Answer option text
}

interface MultipleChoiceProps {
  question?: string;
  options?: ChoiceOption[];
  selectedAnswer?: string;
  onAnswerChange?: (answer: string) => void;
}
```

### QuestionNavigation Component
```typescript
interface QuestionStatus {
  questionNumber: number;
  status: 'correct' | 'incorrect' | 'review' | 'unanswered' | 'current';
}

interface QuestionNavigationProps {
  totalQuestions?: number;
  currentQuestion?: number;
  questionStatuses?: QuestionStatus[];
  onQuestionSelect?: (questionNumber: number) => void;
}
```

## 🎨 Design System Colors

The interface uses a professional educational color scheme:

- **Primary Blue**: `hsl(210 100% 50%)` - Main interactive elements
- **Success Green**: `hsl(142 76% 36%)` - Correct answers
- **Error Red**: `hsl(0 84% 60%)` - Incorrect answers  
- **Warning Yellow**: `hsl(45 93% 47%)` - Review/flagged items
- **Accent Teal**: `hsl(188 100% 45%)` - Special actions

## 📱 Responsive Behavior

- **Desktop**: Full 3-column layout with sidebar navigation
- **Tablet**: 2-column layout, navigation stacks below
- **Mobile**: Single column, all components stack vertically

## ♿ Accessibility Features

- Proper ARIA labels on all interactive elements
- Keyboard navigation support
- High contrast color combinations
- Screen reader friendly structure
- Focus management for question navigation

## 🔧 Advanced Customization

### Theming
Override CSS variables to match your brand:

```css
:root {
  --primary: YOUR_BRAND_COLOR;
  --accent: YOUR_ACCENT_COLOR;
  /* etc... */
}
```

### State Management
For complex applications, integrate with your state management:

```typescript
// Example with Context/Redux
const [questions, setQuestions] = useQuestions();
const [currentAnswer, setCurrentAnswer] = useCurrentAnswer();

<MultipleChoice 
  selectedAnswer={currentAnswer}
  onAnswerChange={setCurrentAnswer}
/>
```

This interface provides a solid foundation for educational platforms, testing systems, or any application requiring structured question-answer workflows.
