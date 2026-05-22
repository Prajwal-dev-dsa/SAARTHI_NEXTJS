"use client";

import { useEffect } from "react";
import { SessionProvider, useSession, signOut } from "next-auth/react";
import { Provider, useDispatch, useSelector } from "react-redux";
import { store, RootState } from "../store";
import { setUser, logoutUser } from "../store/authSlice";
import { setTheme } from "../store/themeSlice";
import { AlertProvider } from "../context/AlertContext";

function StateSync() {
  const { data: session, status } = useSession();
  const dispatch = useDispatch();
  const themeMode = useSelector((state: RootState) => state.theme.mode);

  // 1. Sync NextAuth Session -> Redux Store
  useEffect(() => {
    if (session?.error === "UserDeleted") {
      dispatch(logoutUser());
      signOut({ callbackUrl: "/" });
      return;
    }

    // Normal Login Sync
    if (status === "authenticated" && session?.user && !session.error) {
      dispatch(
        setUser({
          id: session.user.id,
          name: session.user.name || "User",
          email: session.user.email || "",
          role: session.user.role || "USER",
          partnerOnboardingSteps: session.user.partnerOnboardingSteps || 0,
          partnerStatus: (session.user as any).partnerStatus || "PENDING",
          rejectReason: (session.user as any).rejectReason || null
        })
      );
    } else if (status === "unauthenticated") {
      dispatch(logoutUser());
    }
  }, [status, session, dispatch]);

  // 2. Load Theme from Browser Storage on Initial Load
  useEffect(() => {
    const savedTheme = localStorage.getItem("saarthi-theme");
    if (savedTheme === "dark" || savedTheme === "light") {
      dispatch(setTheme(savedTheme));
    }
  }, [dispatch]);

  // 3. Apply Theme to HTML Tag & Save to Browser Storage when it changes
  useEffect(() => {
    const root = document.documentElement;
    if (themeMode === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("saarthi-theme", themeMode);
  }, [themeMode]);

  return null;
}

// --- MASTER PROVIDER WRAPPER ---
export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <SessionProvider>
      <Provider store={store}>
        <AlertProvider>
          <StateSync />
          {children}
        </AlertProvider>
      </Provider>
    </SessionProvider>
  );
}