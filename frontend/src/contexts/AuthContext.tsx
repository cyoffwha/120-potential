import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { BACKEND_URL } from "../config";

interface UserProfile {
  name: string;
  email: string;
  picture: string;
}

interface AuthContextType {
  user: UserProfile | null;
  setUser: (user: UserProfile | null) => void;
  handleGoogleLogin: (credentialResponse: any) => Promise<void>;
  handleLogout: () => void;
  isAuthenticated: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserProfile | null>(null);
  
  // Check if user is authenticated
  const isAuthenticated = user !== null;

  // Restore user from localStorage on mount
  useEffect(() => {
    const storedCredential = localStorage.getItem("google_credential");
    if (storedCredential) {
      fetch(`${BACKEND_URL}/auth/google`, {
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
      try {
        const res = await fetch(`${BACKEND_URL}/auth/google`, {
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
        console.error("Failed to store user in backend:", e);
        alert("Google login succeeded but user data could not be stored in backend. Check the browser console for more details.");
      }
    }
  };

  // Handle Google logout
  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem("google_credential");
  };

  return (
    <AuthContext.Provider value={{ user, setUser, handleGoogleLogin, handleLogout, isAuthenticated }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
