"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, ChevronRight, Bike, Car, Truck, Sun, Moon } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "next-auth/react";
import { RootState } from "../store";
import { toggleTheme } from "../store/themeSlice";

interface NavbarProps {
  onLoginClick: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();

  const profileRef = useRef<HTMLDivElement>(null);

  // Close desktop dropdown if clicked outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setIsProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    await signOut({ callbackUrl: "/" });
    setIsProfileOpen(false);
    setIsMobileProfileOpen(false);
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : "U";

  // Shared Profile UI for both Desktop Dropdown and Mobile Bottom Sheet
  const ProfileMenuContent = () => (
    <div className="flex flex-col text-black dark:text-white">
      <div className="mb-4">
        <h4 className="font-bold text-lg">{user?.name || "User"}</h4>
        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mt-1">
          {user?.role || "USER"}
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => dispatch(toggleTheme())}
          className="w-full bg-gray-50 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 rounded-2xl p-3 flex justify-between items-center transition-colors"
        >
          <span className="font-semibold text-sm">App Theme</span>
          {themeMode === "dark" ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-gray-700" />}
        </button>

        <button className="w-full bg-gray-50 dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 rounded-2xl p-2.5 flex justify-between items-center transition-colors group">
          <div className="flex items-center space-x-3">
            <div className="flex items-center bg-black dark:bg-white text-white dark:text-black px-2.5 py-1.5 rounded-xl space-x-1">
              <Bike className="w-3.5 h-3.5" />
              <Car className="w-3.5 h-3.5" />
              <Truck className="w-3.5 h-3.5" />
            </div>
            <span className="text-sm font-bold">Become a Partner</span>
          </div>
          <ChevronRight className="w-4 h-4 text-gray-400 group-hover:text-black dark:group-hover:text-white transition-colors" />
        </button>
      </div>

      {/* Logout Button */}
      <button
        onClick={handleLogout}
        className="w-full flex items-center space-x-3 mt-4 p-2 rounded-xl transition-colors text-gray-800 dark:text-gray-200 hover:text-red-500"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-bold">Logout</span>
      </button>
    </div>
  );

  return (
    <nav className="absolute top-0 left-0 w-full z-50 flex items-center justify-between px-6 py-6 md:px-16 text-white bg-transparent">

      {/* LOGO */}
      <div className="text-2xl font-black tracking-widest uppercase">
        Saarthi
      </div>

      {/* DESKTOP LINKS */}
      <div className="hidden md:flex space-x-8 text-sm font-medium">
        <span className="hover:text-gray-300 cursor-pointer transition-colors">Home</span>
        <span className="hover:text-gray-300 cursor-pointer transition-colors">Bookings</span>
        <span className="hover:text-gray-300 cursor-pointer transition-colors">About Us</span>
        <span className="hover:text-gray-300 cursor-pointer transition-colors">Contact</span>
      </div>

      {/* DESKTOP AUTH / PROFILE */}
      <div className="hidden md:flex items-center space-x-4">
        {isAuthenticated ? (
          <div className="relative" ref={profileRef}>
            <button
              onClick={() => setIsProfileOpen(!isProfileOpen)}
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg hover:ring-4 hover:ring-white/30 transition-all"
            >
              {userInitial}
            </button>

            {/* Desktop Profile Dropdown */}
            <AnimatePresence>
              {isProfileOpen && (
                <motion.div
                  initial={{ opacity: 0, y: 10, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 10, scale: 0.95 }}
                  transition={{ duration: 0.2 }}
                  className="absolute right-0 mt-4 w-72 bg-white dark:bg-[#0a0a0a] dark:border dark:border-gray-800 rounded-3xl p-5 shadow-2xl origin-top-right"
                >
                  <ProfileMenuContent />
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        ) : (
          <button
            onClick={onLoginClick}
            className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:bg-gray-200  transition-shadow"
          >
            Login
          </button>
        )}
      </div>

      {/* MOBILE CONTROLS */}
      <div className="md:hidden flex items-center space-x-4">
        {isAuthenticated ? (
          <button
            onClick={() => setIsMobileProfileOpen(true)}
            className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg"
          >
            {userInitial}
          </button>
        ) : (
          <button
            onClick={onLoginClick}
            className="bg-white text-black dark:bg-[#0a0a0a] dark:text-white dark:border dark:border-gray-600 px-4 py-1.5 rounded-full font-bold text-sm"
          >
            Login
          </button>
        )}
        <button onClick={() => setIsMobileMenuOpen(true)}>
          <Menu className="w-7 h-7" />
        </button>
      </div>

      {/* MOBILE HAMBURGER MENU */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed inset-0 z-60 bg-[#0a0a0a] text-white p-6 flex flex-col"
          >
            <div className="flex justify-between items-center mb-12">
              <div className="text-2xl font-black tracking-widest uppercase">Saarthi</div>
              <div className="flex items-center space-x-4">
                {isAuthenticated && (
                  <div className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg">
                    {userInitial}
                  </div>
                )}
                <button onClick={() => setIsMobileMenuOpen(false)}>
                  <X className="w-7 h-7 text-gray-400 hover:text-white transition-colors" />
                </button>
              </div>
            </div>

            <div className="flex flex-col space-y-6 text-xl font-medium text-gray-400">
              <span className="hover:text-white cursor-pointer transition-colors">Home</span>
              <div className="h-px w-full bg-gray-800/50"></div>
              <span className="hover:text-white cursor-pointer transition-colors">Bookings</span>
              <div className="h-px w-full bg-gray-800/50"></div>
              <span className="hover:text-white cursor-pointer transition-colors">About Us</span>
              <div className="h-px w-full bg-gray-800/50"></div>
              <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MOBILE PROFILE BOTTOM SHEET */}
      <AnimatePresence>
        {isMobileProfileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileProfileOpen(false)}
              className="fixed inset-0 bg-black/60 z-60 md:hidden"
            />
            <motion.div
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] dark:border-t dark:border-gray-800 rounded-t-4xl p-6 pb-10 z-70 md:hidden shadow-2xl"
            >
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6"></div>
              <ProfileMenuContent />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </nav>
  );
}