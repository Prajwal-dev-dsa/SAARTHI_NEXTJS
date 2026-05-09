"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import { useSelector } from "react-redux";
import { RootState } from "../store";
import Navbar from "../components/Navbar";
import Hero from "../components/Hero";
import AuthModal from "../components/AuthModal";
import VehicleSlider from "@/components/VehicleSlider";
import Footer from "@/components/Footer";

const SLIDER_IMAGES = [
  "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558981285-6f0c94958bb6?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1485291571150-772bcfc10da5?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1542362567-b07e54358753?w=600&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1449426468159-d96dbf08f19f?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1617531653332-bd46c24f2068?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1502877338535-766e1452684a?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1511919884226-fd3cad34687c?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1498887960847-2a5e46312788?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1533473359331-0135ef1b58bf?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1552519507-da3b142c6e3d?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1494976388531-d1058494cdd8?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558981403-c5f9899a28bc?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1583121274602-3e2820c69888?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1489824904134-891ab64532f1?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1568772585407-9361f9bf3a87?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1558980394-4c7c9299fe96?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1514316454349-750a7fd3da3a?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1503327431567-3ab5e6e79140?q=80&w=1920&auto=format&fit=crop",
  "https://images.unsplash.com/photo-1493238792000-8113da705763?q=80&w=1920&auto=format&fit=crop",
];

export default function HomePage() {
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [defaultIsLogin, setDefaultIsLogin] = useState(true);

  // 3. Initialize router and get authentication state
  const router = useRouter();
  const isAuthenticated = useSelector((state: RootState) => state.auth.isAuthenticated);

  // Background Slider Logic
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentImageIndex((prev) => (prev + 1) % SLIDER_IMAGES.length);
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const openModal = (isLogin: boolean) => {
    setDefaultIsLogin(isLogin);
    setIsModalOpen(true);
  };

  // 4. Create the routing logic function
  const handleBookNowClick = () => {
    if (isAuthenticated) {
      router.push("/book"); // Navigate to the booking page if logged in
    } else {
      openModal(false); // Open the registration modal if not logged in
    }
  };

  return (
    <main className="font-sans bg-white dark:bg-[#050505] transition-colors duration-300">

      {/* --- SECTION 1: HERO & NAVBAR --- */}
      <section className="relative min-h-screen flex flex-col overflow-hidden bg-black text-white">

        {/* Background Layer */}
        <div className="absolute inset-0 z-0 bg-black">
          <AnimatePresence mode="popLayout">
            <motion.img
              key={currentImageIndex}
              src={SLIDER_IMAGES[currentImageIndex]}
              alt="Saarthi Background"
              className="absolute inset-0 w-full h-full object-cover opacity-30"
              initial={{ opacity: 0, scale: 1.05 }}
              animate={{ opacity: 0.3, scale: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
            />
          </AnimatePresence>
          <div className="absolute inset-0 bg-linear-to-b from-black/60 via-black/20 to-black/80 z-0" />
        </div>
        <div className="relative z-10 flex flex-col grow">
          <Navbar onLoginClick={() => openModal(true)} />
          <div className="grow flex items-center justify-center">
            {/* 5. Pass our new function to the Hero component */}
            <Hero onBookNowClick={handleBookNowClick} />
          </div>
        </div>
      </section>

      {/* --- SECTION 2: VEHICLE SLIDER --- */}
      <VehicleSlider />

      {/* --- SECTION 3: FOOTER --- */}
      <Footer />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        defaultIsLogin={defaultIsLogin}
      />
    </main>
  );
}