import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
// import { Timer } from "./Timer";

interface HeaderProps {
  activeSection?: string;
}

export const Header = ({ activeSection = "Question Banks" }: HeaderProps) => {
  const navigationItems = [
    { label: "Home", href: "#" },
    { label: "Practice Tests", href: "#" },
    { label: "Question Banks", href: "#", active: true },
    { label: "Charts", href: "#" }
  ];

  return (
    <header className="bg-primary border-b border-border px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo/Brand */}
        <div className="flex items-center space-x-6">
          <h1 className="text-xl font-bold text-primary-foreground">120% Potential</h1>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active || item.label === activeSection ? "secondary" : "ghost"}
                size="sm"
                className="text-sm text-primary-foreground hover:bg-primary-hover"
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* Timer and User Avatar */}
        <div className="flex items-center space-x-4">
          {/* <Timer /> */}
          <Avatar className="h-8 w-8">
            <AvatarFallback className="bg-secondary text-secondary-foreground">
              U
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </header>
  );
};