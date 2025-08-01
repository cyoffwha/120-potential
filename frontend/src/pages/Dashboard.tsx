import { Header } from "@/components/Header";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { useState, useEffect } from "react";
import { userProgressService, UserStats as APIUserStats } from "../services/userProgressService";
import { ActivityCalendar } from "@/components/ActivityCalendar";

// NOTE: Currently using mock data for demonstration purposes
// TODO: Implement actual backend integration when ready

interface DomainPerformance {
  domain: string;
  accuracy: number;
}

interface DifficultyBreakdown {
  easy: number;
  medium: number;
  hard: number;
}

interface UserStats {
  questionsAnswered: number;
  totalQuestions: number;
  completionRate: number;
  accuracy: number;
  streakDays: number;
  difficultyBreakdown?: DifficultyBreakdown;
  domainPerformance?: DomainPerformance[];
}

const Dashboard = () => {
  const [stats, setStats] = useState<UserStats>({
    questionsAnswered: 0,
    totalQuestions: 0,
    completionRate: 0,
    accuracy: 0,
    streakDays: 0,
  });

  // Fetch stats from backend (using mock data for now)
  useEffect(() => {
    const fetchStats = async () => {
      try {
        // TODO: Uncomment when backend is ready
        // const apiStats = await userProgressService.getUserStats();
        
        // Mock data for demonstration
        const mockStats: UserStats = {
          questionsAnswered: 147,
          totalQuestions: 299,
          completionRate: 49,
          accuracy: 73,
          streakDays: 12,
          difficultyBreakdown: {
            easy: 68,
            medium: 52,
            hard: 27
          },
          domainPerformance: [
            { domain: "Math", accuracy: 81 },
            { domain: "Reading", accuracy: 69 },
            { domain: "Writing", accuracy: 78 },
            { domain: "Science", accuracy: 65 },
            { domain: "History", accuracy: 71 },
            { domain: "Literature", accuracy: 74 }
          ]
        };
        
        setStats(mockStats);
      } catch (error) {
        console.error("Failed to fetch stats:", error);
        // Fallback to mock data if API fails
        const mockStats = {
          questionsAnswered: 0,
          totalQuestions: 299,
          completionRate: 0,
          accuracy: 0,
          streakDays: 0,
          difficultyBreakdown: {
            easy: 0,
            medium: 0,
            hard: 0
          },
          domainPerformance: []
        };
        setStats(mockStats);
      }
    };

    fetchStats();
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Header activeSection="Dashboard" />
      <main className="max-w-7xl mx-auto px-6 py-8">
        <h1 className="text-3xl font-bold mb-6">Your Dashboard</h1>
        
        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <StatCard 
            title="Questions Completed" 
            value={`${stats.questionsAnswered}/${stats.totalQuestions}`}
            description="Questions answered out of total"
            footer={
              <div className="mt-2">
                <Progress value={stats.completionRate} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{stats.completionRate}% complete</p>
              </div>
            }
          />
          
          <StatCard 
            title="Accuracy" 
            value={`${stats.accuracy}%`}
            description="Correct answers percentage"
            footer={
              <div className="mt-2">
                <Progress value={stats.accuracy} className="h-2" />
              </div>
            }
          />
          
          <StatCard 
            title="Study Streak" 
            value={stats.streakDays}
            description={`${stats.streakDays} day${stats.streakDays !== 1 ? 's' : ''} in a row`}
            footer={
              <div className="mt-2 text-xs text-muted-foreground">
                Keep practicing daily to maintain your streak!
              </div>
            }
          />
        </div>
        
        {/* Activity Calendar */}
        <ActivityCalendar className="mb-8" />
        
        {/* Difficulty Breakdown */}
        {stats.difficultyBreakdown && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Difficulty Breakdown</CardTitle>
              <CardDescription>Questions answered by difficulty level</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <DifficultyBar 
                  label="Easy" 
                  count={stats.difficultyBreakdown.easy} 
                  color="bg-green-500" 
                />
                <DifficultyBar 
                  label="Medium" 
                  count={stats.difficultyBreakdown.medium} 
                  color="bg-blue-500" 
                />
                <DifficultyBar 
                  label="Hard" 
                  count={stats.difficultyBreakdown.hard} 
                  color="bg-orange-500" 
                />
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Domain Performance */}
        {stats.domainPerformance && (
          <Card>
            <CardHeader>
              <CardTitle>Domain Performance</CardTitle>
              <CardDescription>Accuracy by knowledge domain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {stats.domainPerformance.map((domain, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">{domain.domain}</span>
                      <span className="text-sm text-muted-foreground">{domain.accuracy}%</span>
                    </div>
                    <Progress value={domain.accuracy} className="h-2" />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
        
        {/* Study Recommendations */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle>Study Recommendations</CardTitle>
            <CardDescription>Personalized suggestions based on your performance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {stats.domainPerformance && stats.domainPerformance.length > 0 && (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <h3 className="font-medium mb-2">Focus Areas</h3>
                  <p className="text-sm text-muted-foreground mb-3">
                    Based on your performance, consider focusing on these areas:
                  </p>
                  <ul className="list-disc list-inside space-y-1 text-sm">
                    {[...stats.domainPerformance]
                      .sort((a, b) => a.accuracy - b.accuracy)
                      .slice(0, 2)
                      .map((domain, index) => (
                        <li key={index}>
                          <span className="font-medium">{domain.domain}</span> - Current accuracy: {domain.accuracy}%
                        </li>
                      ))
                    }
                  </ul>
                </div>
              )}
              
              <div className="p-4 border rounded-lg bg-muted/30">
                <h3 className="font-medium mb-2">Study Schedule</h3>
                <p className="text-sm text-muted-foreground">
                  To maximize retention, try this schedule:
                </p>
                <ul className="list-disc list-inside space-y-1 text-sm mt-2">
                  <li>Practice at least 20 minutes daily</li>
                  <li>Review difficult questions every 3 days</li>
                  <li>Take a full practice test weekly</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const StatCard = ({ title, value, description, footer }: { 
  title: string; 
  value: string | number; 
  description: string;
  footer?: React.ReactNode;
}) => {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg">{title}</CardTitle>
        <CardDescription>{description}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
        {footer}
      </CardContent>
    </Card>
  );
};

const DifficultyBar = ({ label, count, color }: { 
  label: string; 
  count: number; 
  color: string;
}) => {
  // Calculate percentage based on a reasonable maximum (e.g., 100 questions per difficulty)
  const maxQuestions = 100;
  const percentage = Math.min((count / maxQuestions) * 100, 100);
  
  return (
    <div className="space-y-1">
      <div className="flex items-center justify-between">
        <span className="text-sm font-medium">{label}</span>
        <span className="text-sm text-muted-foreground">{count} questions</span>
      </div>
      <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
        <div 
          className={`h-full ${color} rounded-full transition-all duration-300`} 
          style={{ width: `${percentage}%` }} 
        />
      </div>
    </div>
  );
};

export default Dashboard;
