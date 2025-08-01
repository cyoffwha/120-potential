import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { googleLogout } from "@react-oauth/google";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { LoginModal } from "./LoginModal";

interface HeaderProps {
  activeSection?: string;
}

export const Header = ({ activeSection = "Question Banks" }: HeaderProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const currentPath = location.pathname;
  const { user, handleGoogleLogin, handleLogout, isAuthenticated } = useAuth();
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false);

  const navigationItems = [
    { label: "Home", href: "/", active: currentPath === "/" },
    { label: "Practice", href: "/practice", active: currentPath === "/practice", requiresAuth: true },
    { label: "Vocabulary", href: "/vocabulary", active: currentPath === "/vocabulary", requiresAuth: true },
    { label: "Dashboard", href: "/dashboard", active: currentPath === "/dashboard", requiresAuth: true },
    { label: "Full practice", href: "#", requiresAuth: true },
    // { label: "Add Question", href: "/add-question", active: currentPath === "/add-question" },
    // { label: "Stats", href: "#" }
  ];

  const handleNavItemClick = (item: typeof navigationItems[0]) => {
    if (item.requiresAuth && !isAuthenticated) {
      setIsLoginModalOpen(true);
    } else if (item.href.startsWith('/')) {
      navigate(item.href);
    }
  };

  const handleLoginSuccess = async (credentialResponse: any) => {
    await handleGoogleLogin(credentialResponse);
    setIsLoginModalOpen(false);
    // If user was trying to access practice, navigate there after login
    if (currentPath === "/" && navigationItems.find(item => item.requiresAuth && item.active)) {
      navigate('/practice');
    }
  };

  return (
    <header className="bg-primary border-b border-border px-6 py-3">
      <LoginModal 
        isOpen={isLoginModalOpen} 
        onClose={() => setIsLoginModalOpen(false)} 
        onSuccess={handleLoginSuccess} 
      />
      
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo/Brand */}
        <div className="flex items-center w-full">
          <Link to="/" className="text-xl font-bold mr-8" style={{ color: '#F4EBEE' }}>120% Potential</Link>
          
          {/* Navigation */}
          <nav className="flex items-center space-x-1">
            {navigationItems.map((item) => (
              <Button
                key={item.label}
                variant={item.active || item.label === activeSection ? "secondary" : "ghost"}
                size="sm"
                className="text-sm text-primary-foreground hover:bg-primary-hover"
                onClick={() => handleNavItemClick(item)}
              >
                {item.label}
              </Button>
            ))}
          </nav>
        </div>

        {/* User Avatar or Auth Buttons */}
        <div className="flex items-center space-x-4">
          {user ? (
            <Popover>
              <PopoverTrigger asChild>
                <Avatar className="h-8 w-8 cursor-pointer">
                  <AvatarImage src={user.picture} alt={user.name} />
                  <AvatarFallback className="bg-secondary text-secondary-foreground">
                    {user.name[0]}
                  </AvatarFallback>
                </Avatar>
              </PopoverTrigger>
              <PopoverContent align="end" className="w-64 p-4">
                <div className="mb-3">
                  <div className="font-semibold text-base mb-1">{user.name}</div>
                  <div className="text-xs text-muted-foreground mb-2">{user.email}</div>
                </div>
                <div className="flex flex-col gap-2">
                  <Button variant="outline" className="w-full">Settings</Button>
                  <Button variant="outline" className="w-full">Billing</Button>
                  <Button variant="destructive" className="w-full mt-2" onClick={handleLogout}>Log out</Button>
                </div>
              </PopoverContent>
            </Popover>
          ) : (
            <Button 
              variant="secondary" 
              size="sm" 
              onClick={() => setIsLoginModalOpen(true)}
            >
              Sign in
            </Button>
          )}
        </div>
      </div>
    </header>
  );
};