"use client";

import { useEffect } from "react";
import { SessionProvider, useSession } from "next-auth/react";
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
    if (status === "authenticated" && session?.user) {
      dispatch(
        setUser({
          id: session.user.id,
          name: session.user.name || "User",
          email: session.user.email || "",
          role: session.user.role || "USER",
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
          {/* Inject our background worker here */}
          <StateSync />
          {children}
        </AlertProvider>
      </Provider>
    </SessionProvider>
  );
}