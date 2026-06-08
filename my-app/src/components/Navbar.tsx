"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut, ChevronRight, Bike, Car, Truck, Sun, Moon } from "lucide-react";
import { useSelector, useDispatch } from "react-redux";
import { signOut } from "next-auth/react";
import { RootState } from "../store";
import { toggleTheme } from "../store/themeSlice";
import { useRouter, usePathname } from "next/navigation";
import axios from "axios";
import { io, Socket } from "socket.io-client";

interface NavLink {
  name: string;
  href: string;
  showBadge?: boolean;
}

interface NavbarProps {
  onLoginClick: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isMobileProfileOpen, setIsMobileProfileOpen] = useState(false);
  const [pendingCount, setPendingCount] = useState(0);
  const [socket, setSocket] = useState<Socket | null>(null);

  const { user, isAuthenticated } = useSelector((state: RootState) => state.auth);
  const themeMode = useSelector((state: RootState) => state.theme.mode);
  const dispatch = useDispatch();
  const profileRef = useRef<HTMLDivElement>(null);

  const pathnameRef = useRef(pathname);
  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  // --- Fetch Initial Pending Requests Count & Socket Initialization ---
  useEffect(() => {
    if (isAuthenticated && user?.role === "PARTNER") {

      const fetchPendingCount = async () => {
        try {
          const res = await axios.get("/api/partner/bookings/pending-count");
          setPendingCount(res.data.count || 0);
        } catch (error) {
          console.error("Failed to fetch pending requests count");
        }
      };
      fetchPendingCount();

      const handleLocalUpdate = (e: Event) => {
        const customEvent = e as CustomEvent;
        setPendingCount(customEvent.detail);
      };
      window.addEventListener('update_pending_count', handleLocalUpdate);

      const socketUrl = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL || "http://localhost:8000";
      const newSocket = io(socketUrl);
      setSocket(newSocket);

      newSocket.on("connect", () => {
        newSocket.emit("register_partner", user.id);
      });

      newSocket.on("new_ride_request", () => {
        if (pathnameRef.current !== "/partner/requests") {
          setPendingCount((prev) => prev + 1);
        }
      });

      const decrementCount = () => setPendingCount((prev) => Math.max(0, prev - 1));
      newSocket.on("ride_cancelled", decrementCount);
      newSocket.on("ride_accepted", decrementCount);
      newSocket.on("ride_rejected", decrementCount);

      return () => {
        newSocket.disconnect();
        window.removeEventListener('update_pending_count', handleLocalUpdate);
      };
    }
  }, [isAuthenticated, user?.role, user?.id]);

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

  const USER_LINKS: NavLink[] = [
    { name: "Home", href: "/" },
    { name: "Bookings", href: "/user/bookings" },
    { name: "Book Vehicle", href: "/user/book" },
  ];

  const PARTNER_LINKS: NavLink[] = [
    { name: "Home", href: "/" },
    { name: "Pending Requests", href: "/partner/requests", showBadge: true },
    { name: "Bookings", href: "/partner/bookings" },
  ];

  const linksToRender = user?.role === "PARTNER" ? PARTNER_LINKS : USER_LINKS;

  // PROFILE DROPDOWN
  const ProfileMenuContent = () => (
    <div className="flex flex-col text-black dark:text-white">
      <div className="mb-4">
        <h4 className="font-bold text-lg">{user?.name || "User"}</h4>
        <p className="text-[10px] text-gray-500 dark:text-gray-400 font-black uppercase tracking-widest mt-1">
          {user?.role || "USER"}
        </p>
      </div>

      <div className="space-y-2">
        <button
          onClick={() => dispatch(toggleTheme())}
          className="w-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-2xl p-3 flex justify-between items-center transition-colors"
        >
          <span className="font-semibold text-sm">App Theme</span>
          {themeMode === "dark" ? <Sun className="w-4 h-4 text-white" /> : <Moon className="w-4 h-4 text-gray-700" />}
        </button>

        {user?.role !== "PARTNER" && (
          <button
            onClick={() => {
              router.push("/partner/onboarding/vehicle");
              setIsProfileOpen(false);
              setIsMobileProfileOpen(false);
            }}
            className="w-full bg-gray-100 dark:bg-white/10 hover:bg-gray-200 dark:hover:bg-white/20 rounded-2xl p-2.5 flex justify-between items-center transition-colors group"
          >
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
        )}
      </div>

      <button
        onClick={handleLogout}
        className="w-full flex items-center space-x-3 mt-4 p-2 rounded-xl transition-colors text-gray-800 dark:text-gray-200 hover:text-red-600 dark:hover:text-red-500"
      >
        <LogOut className="w-4 h-4" />
        <span className="text-sm font-bold">Logout</span>
      </button>
    </div>
  );

  return (
    <header className="absolute top-0 w-full z-50 bg-transparent pointer-events-auto">
      <nav className="relative flex items-center justify-between px-6 py-4 md:px-16 text-white transition-colors duration-300">

        {/* LOGO */}
        <div
          onClick={() => router.push("/")}
          className="text-2xl font-black tracking-widest uppercase cursor-pointer text-white"
        >
          Saarthi
        </div>

        {/* DESKTOP LINKS */}
        <div className="hidden md:flex items-center space-x-8 text-sm font-medium">
          {linksToRender.map((link) => (
            <div key={link.name} className="relative flex items-center">
              <span
                onClick={() => router.push(link.href)}
                className="text-white hover:text-gray-300 cursor-pointer transition-colors relative flex items-center drop-shadow-sm"
              >
                {link.name}

                {/* Hide badge if currently on the pending requests page */}
                {link.showBadge && pendingCount > 0 && pathname !== "/partner/requests" && (
                  <span className="ml-1.5 bg-red-600 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full shadow-lg">
                    {pendingCount}
                  </span>
                )}
              </span>
            </div>
          ))}
        </div>

        {/* DESKTOP AUTH / PROFILE */}
        <div className="hidden md:flex items-center space-x-4">
          {isAuthenticated ? (
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg hover:ring-4 hover:ring-white/30 transition-all shadow-md"
              >
                {userInitial}
              </button>

              <AnimatePresence>
                {isProfileOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: 10, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 10, scale: 0.95 }}
                    transition={{ duration: 0.2 }}
                    className="absolute right-0 mt-4 w-72 bg-white dark:bg-[#111] border border-gray-100 dark:border-gray-800 rounded-3xl p-5 shadow-2xl origin-top-right z-50 text-black dark:text-white"
                  >
                    <ProfileMenuContent />
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-white text-black px-6 py-2.5 rounded-full font-bold text-sm hover:scale-105 transition-transform shadow-md"
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
              className="w-10 h-10 rounded-full bg-white text-black flex items-center justify-center font-bold text-lg shadow-md"
            >
              {userInitial}
            </button>
          ) : (
            <button
              onClick={onLoginClick}
              className="bg-white text-black px-4 py-1.5 rounded-full font-bold text-sm shadow-md"
            >
              Login
            </button>
          )}
          <button onClick={() => setIsMobileMenuOpen(true)} className="relative">
            <Menu className="w-7 h-7 text-white drop-shadow-md" />
            {user?.role === "PARTNER" && pendingCount > 0 && pathname !== "/partner/requests" && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border border-white" />
            )}
          </button>
        </div>

        {/* MOBILE HAMBURGER MENU */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="fixed inset-0 z-60 bg-white dark:bg-[#0a0a0a] text-black dark:text-white p-6 flex flex-col"
            >
              <div className="flex justify-between items-center mb-12">
                <div onClick={() => { router.push("/"); setIsMobileMenuOpen(false); }} className="text-2xl font-black tracking-widest uppercase cursor-pointer">Saarthi</div>
                <div className="flex items-center space-x-4">
                  {isAuthenticated && (
                    <div className="w-10 h-10 rounded-full bg-black dark:bg-white text-white dark:text-black flex items-center justify-center font-bold text-lg">
                      {userInitial}
                    </div>
                  )}
                  <button onClick={() => setIsMobileMenuOpen(false)}>
                    <X className="w-7 h-7 text-gray-500 dark:text-gray-400 hover:text-black dark:hover:text-white transition-colors" />
                  </button>
                </div>
              </div>

              <div className="flex flex-col space-y-6 text-xl font-medium text-gray-600 dark:text-gray-400">
                {linksToRender.map((link, idx) => (
                  <div key={link.name}>
                    <div
                      className="flex justify-between items-center hover:text-black dark:hover:text-white cursor-pointer transition-colors"
                      onClick={() => { router.push(link.href); setIsMobileMenuOpen(false); }}
                    >
                      <span>{link.name}</span>
                      {link.showBadge && pendingCount > 0 && pathname !== "/partner/requests" && (
                        <span className="bg-red-600 text-white text-xs font-black px-2 py-1 rounded-md">
                          {pendingCount} New
                        </span>
                      )}
                    </div>
                    {idx !== linksToRender.length - 1 && <div className="h-px w-full bg-gray-100 dark:bg-gray-800/50 mt-6"></div>}
                  </div>
                ))}
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
                className="fixed bottom-0 left-0 w-full bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-gray-800 rounded-t-4xl p-6 pb-10 z-70 md:hidden shadow-2xl"
              >
                <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full mx-auto mb-6"></div>
                <div className="text-black dark:text-white">
                  <ProfileMenuContent />
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </nav>
    </header>
  );
}