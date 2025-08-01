import { Calendar } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ActivityDay {
  date: string;
  count: number;
  level: 0 | 1 | 2 | 3 | 4; // 0 = no activity, 1-4 = increasing activity levels
}

interface ActivityCalendarProps {
  className?: string;
}

export const ActivityCalendar = ({ className }: ActivityCalendarProps) => {
  // Generate mock data for the past 365 days (full year)
  const generateMockData = (): ActivityDay[] => {
    const days: ActivityDay[] = [];
    const today = new Date();
    
    for (let i = 364; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      
      // Generate realistic activity patterns
      const dayOfWeek = date.getDay();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      
      // Higher activity on weekdays, some gaps for realism
      let count = 0;
      const random = Math.random();
      
      if (isWeekend) {
        // Weekend: 40% chance of activity
        if (random < 0.4) {
          count = Math.floor(Math.random() * 15) + 1; // 1-15 questions
        }
      } else {
        // Weekday: 75% chance of activity
        if (random < 0.75) {
          count = Math.floor(Math.random() * 25) + 5; // 5-30 questions
        }
      }
      
      // Determine activity level based on count
      let level: 0 | 1 | 2 | 3 | 4 = 0;
      if (count > 0) {
        if (count <= 5) level = 1;
        else if (count <= 10) level = 2;
        else if (count <= 20) level = 3;
        else level = 4;
      }
      
      days.push({
        date: date.toISOString().split('T')[0],
        count,
        level
      });
    }
    
    return days;
  };

  const activityData = generateMockData();
  
  // Get month labels for the year
  const getMonthLabels = () => {
    const months = [];
    const today = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const date = new Date(today);
      date.setMonth(date.getMonth() - i);
      months.push({
        name: date.toLocaleDateString('en-US', { month: 'short' }),
        fullName: date.toLocaleDateString('en-US', { month: 'long' })
      });
    }
    return months;
  };

  // Create a proper grid: 53 weeks × 7 days
  const createCalendarGrid = () => {
    const grid: (ActivityDay | null)[][] = [];
    
    // Initialize 7 rows (days of week), each with 53 columns (weeks)
    for (let day = 0; day < 7; day++) {
      grid[day] = new Array(53).fill(null);
    }
    
    // Fill the grid with activity data
    activityData.forEach((dayData, index) => {
      const date = new Date(dayData.date);
      const dayOfWeek = date.getDay(); // 0 = Sunday, 1 = Monday, etc.
      const weekIndex = Math.floor(index / 7);
      
      if (weekIndex < 53) {
        grid[dayOfWeek][weekIndex] = dayData;
      }
    });
    
    return grid;
  };

  const monthLabels = getMonthLabels();
  const calendarGrid = createCalendarGrid();
  
  // Day names for left labels
  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  const getActivityColor = (level: number): string => {
    switch (level) {
      case 0: return '#ebedf0'; // No activity - light gray
      case 1: return '#ffd70040'; // Light gold
      case 2: return '#ffd70070'; // Medium gold
      case 3: return '#ffd700a0'; // Strong gold
      case 4: return '#FFD700'; // Full gold (#FFD700)
      default: return '#ebedf0';
    }
  };

  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const totalDays = activityData.filter(day => day.count > 0).length;
  const currentStreak = calculateCurrentStreak(activityData);
  const totalQuestions = activityData.reduce((sum, day) => sum + day.count, 0);

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center gap-2">
          <Calendar className="h-5 w-5 text-primary" />
          <CardTitle>Study Activity</CardTitle>
        </div>
        <CardDescription>
          {totalQuestions} questions in the last year
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Stats */}
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-muted-foreground">Active days: </span>
              <span className="font-medium">{totalDays}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Current streak: </span>
              <span className="font-medium">{currentStreak} days</span>
            </div>
          </div>
          
          {/* Calendar Grid */}
          <div className="space-y-3">
            {/* Month labels across the top */}
            <div className="flex">
              <div className="w-10"></div> {/* Space for day labels */}
              <div className="flex-1 grid grid-cols-12 gap-1 text-xs text-muted-foreground">
                {monthLabels.map((month, index) => (
                  <div key={index} className="text-left">
                    {month.name}
                  </div>
                ))}
              </div>
            </div>
            
            {/* Calendar grid with day labels on left */}
            <div className="flex">
              {/* Day labels column */}
              <div className="w-10 space-y-1">
                {dayNames.map((day, dayIndex) => (
                  <div 
                    key={day} 
                    className="h-4 text-xs text-muted-foreground flex items-center"
                    style={{ opacity: dayIndex % 2 === 0 ? 1 : 0 }} // Only show Mon, Wed, Fri, Sun
                  >
                    {dayIndex % 2 === 0 ? day : ''}
                  </div>
                ))}
              </div>
              
              {/* Activity squares grid */}
              <div className="flex-1 space-y-1">
                {calendarGrid.map((dayRow, dayIndex) => (
                  <div key={dayIndex} className="flex gap-1">
                    {dayRow.map((day, weekIndex) => (
                      <div
                        key={`${dayIndex}-${weekIndex}`}
                        className="w-4 h-4 rounded-sm border border-gray-200 hover:border-gray-400 transition-colors cursor-pointer"
                        style={{ backgroundColor: day ? getActivityColor(day.level) : '#ebedf0' }}
                        title={day ? `${formatDate(day.date)}: ${day.count} questions` : 'No data'}
                      />
                    ))}
                  </div>
                ))}
              </div>
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center justify-between text-xs text-muted-foreground">
            <span>Less</span>
            <div className="flex gap-1">
              {[0, 1, 2, 3, 4].map(level => (
                <div
                  key={level}
                  className="w-4 h-4 rounded-sm border border-gray-200"
                  style={{ backgroundColor: getActivityColor(level) }}
                />
              ))}
            </div>
            <span>More</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// Helper function to calculate current streak
function calculateCurrentStreak(days: ActivityDay[]): number {
  let streak = 0;
  const sortedDays = [...days].reverse(); // Start from most recent
  
  for (const day of sortedDays) {
    if (day.count > 0) {
      streak++;
    } else {
      break;
    }
  }
  
  return streak;
}
