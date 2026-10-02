import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { authenticate, findUser, type AuthUser } from "@/services/auth";
import {
  clearSession,
  loadSessionUserName,
  saveSessionUserName,
} from "@/services/session";

type AuthContextValue = {
  user: AuthUser | null;
  isRestoring: boolean;
  signIn: (userId: string, password: string) => Promise<boolean>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore the logged-in user from SecureStore. Only the user name is stored;
  // role and lab are re-read from UserRole.json so changes there take effect,
  // and a user removed from the file is logged out.
  useEffect(() => {
    (async () => {
      try {
        const storedUserName = await loadSessionUserName();
        if (storedUserName) {
          const restored = findUser(storedUserName);
          if (restored) setUser(restored);
          else await clearSession();
        }
      } catch (e) {
        console.warn("Failed to restore session", e);
      } finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  const signIn = async (userId: string, password: string) => {
    const result = authenticate(userId, password);
    if (!result) return false;
    try {
      await saveSessionUserName(result.userName);
    } catch (e) {
      // Still log in for this session; the user just won't stay logged in.
      console.warn("Failed to save session", e);
    }
    setUser(result);
    return true;
  };

  const signOut = async () => {
    try {
      await clearSession();
    } catch (e) {
      console.warn("Failed to clear session", e);
    }
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, isRestoring, signIn, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used inside AuthProvider");
  return context;
}
