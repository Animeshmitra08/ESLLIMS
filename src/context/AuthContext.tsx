import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import { setAuthToken, setUnauthorizedHandler } from "@/services/ApiServices";
import { isTokenExpired, login, type AuthUser } from "@/services/auth";
import {
  initializeNotifications,
  resetNotificationService,
  setCurrentUserForNotifications,
} from "@/services/NotificationService";
import { clearNotifications } from "@/services/notificationStore";
import { clearSession, loadSession, saveSession } from "@/services/session";

type AuthContextValue = {
  user: AuthUser | null;
  isRestoring: boolean;
  /** Rejects with an Error whose message can be shown to the user. */
  signIn: (userName: string, password: string) => Promise<void>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isRestoring, setIsRestoring] = useState(true);

  // Restore the saved user and token from SecureStore. An expired token is
  // discarded so the user logs in again.
  useEffect(() => {
    (async () => {
      try {
        const session = await loadSession();
        if (session && !isTokenExpired(session.tokenExpiry)) {
          console.log(session.token);
          
          setAuthToken(session.token);
          setUser(session.user);
        } else {
          await clearSession();
        }
      } catch (e) {
        console.warn("Failed to restore session", e);
      } finally {
        setIsRestoring(false);
      }
    })();
  }, []);

  // When the API rejects the token (401), log out.
  useEffect(() => {
    setUnauthorizedHandler(() => {
      signOut().catch((e) => console.warn("Failed to sign out", e));
    });
    return () => setUnauthorizedHandler(null);
  }, []);

  // Register this device for push notifications whenever someone is logged
  // in, whether they just signed in or their saved session was restored.
  useEffect(() => {
    if (!user) return;
    setCurrentUserForNotifications(user);
    initializeNotifications().catch((e) =>
      console.warn("Failed to initialize notifications", e)
    );
  }, [user]);

  const signIn = async (userName: string, password: string) => {
    const session = await login(userName, password);
    setAuthToken(session.token);
    try {
      await saveSession(session);
    } catch (e) {
      // Still log in for this session; the user just won't stay logged in.
      console.warn("Failed to save session", e);
    }
    setUser(session.user);
  };

  const signOut = async () => {
    setAuthToken(null);
    try {
      await clearSession();
    } catch (e) {
      console.warn("Failed to clear session", e);
    }
    try {
      await resetNotificationService();
      // Saved notifications belong to the user who is logging out.
      await clearNotifications();
    } catch (e) {
      console.warn("Failed to reset notifications", e);
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
