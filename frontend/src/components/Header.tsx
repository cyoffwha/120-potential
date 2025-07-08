import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useEffect, useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { GoogleLogin, googleLogout } from "@react-oauth/google";
import { jwtDecode, JwtPayload } from "jwt-decode";

interface HeaderProps {
  activeSection?: string;
}

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface GoogleJwtPayload extends JwtPayload {
  name: string;
  email: string;
  picture: string;
}

export const Header = ({ activeSection = "Question Banks" }: HeaderProps) => {
  const navigationItems = [
    { label: "Dashboard", href: "#" },
    { label: "Practice", href: "#", active: true },
    { label: "Full practice", href: "#" },
    // { label: "Stats", href: "#" }
  ];

  // Google user state
  const [user, setUser] = useState<UserProfile | null>(null);

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedCredential = localStorage.getItem("google_credential");
    if (storedCredential) {
      // Optionally, re-send to backend for validation and get user info
      fetch("http://127.0.0.1:8079/auth/google", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ credential: storedCredential })
      })
        .then(res => res.ok ? res.json() : null)
        .then(data => {
          if (data && data.user) {
            setUser({
              name: data.user.name,
              email: data.user.email,
              picture: data.user.picture,
            });
          } else {
            localStorage.removeItem("google_credential");
          }
        })
        .catch(() => localStorage.removeItem("google_credential"));
    }
  }, []);

  // Handle Google login success
  const handleGoogleLogin = async (credentialResponse: any) => {
    if (credentialResponse.credential) {
      localStorage.setItem("google_credential", credentialResponse.credential);
      // Send credential to backend for user storage
      try {
        const res = await fetch("http://127.0.0.1:8079/auth/google", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ credential: credentialResponse.credential })
        });
        if (!res.ok) throw new Error("Failed to store user");
        const data = await res.json();
        setUser({
          name: data.user.name,
          email: data.user.email,
          picture: data.user.picture,
        });
      } catch (e) {
        alert("Google login succeeded but user could not be stored in backend.");
      }
    }
  };

  // Handle Google logout
  const handleLogout = () => {
    googleLogout();
    setUser(null);
    localStorage.removeItem("google_credential");
  };

  return (
    <header className="bg-primary border-b border-border px-6 py-3">
      <div className="flex items-center justify-between max-w-7xl mx-auto">
        {/* Logo/Brand */}
        <div className="flex items-center w-full">
          <h1 className="text-xl font-bold mr-8" style={{ color: '#F4EBEE' }}>120% Potential</h1>
          
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

        {/* Timer and User Avatar or Auth Buttons */}
        <div className="flex items-center space-x-4">
          {/* <Timer /> */}
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
            <GoogleLogin
              onSuccess={handleGoogleLogin}
              onError={() => alert("Google Login Failed")}
              width="240"
              theme="filled_blue"
              text="continue_with"
              shape="pill"
              logo_alignment="left"
              locale="en"
            />
          )}
        </div>
      </div>
    </header>
  );
};