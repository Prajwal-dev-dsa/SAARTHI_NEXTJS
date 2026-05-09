import { motion } from "framer-motion";
import { Bike, Car, Bus, Truck } from "lucide-react";

interface HeroProps {
  onBookNowClick: () => void;
}

export default function Hero({ onBookNowClick }: HeroProps) {
  return (
    <main className="relative z-10 flex flex-col items-center pt-8 justify-center min-h-[80vh] text-center px-4">
      <motion.h1
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.2 }}
        className="text-5xl md:text-9xl font-bold mb-4 tracking-tight"
      >
        Book Any Vehicle
      </motion.h1>

      <motion.p
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.4 }}
        className="text-gray-300 text-lg md:text-xl mb-10 max-w-lg"
      >
        From daily rides to heavy transport — all in one platform.
      </motion.p>

      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.6 }}
        className="flex space-x-6 md:space-x-10 mb-12 text-gray-400"
      >
        <Bike className="w-8 h-8 hover:text-white cursor-pointer transition-colors" />
        <Car className="w-8 h-8 hover:text-white cursor-pointer transition-colors" />
        <Bus className="w-8 h-8 hover:text-white cursor-pointer transition-colors" />
        <Truck className="w-8 h-8 hover:text-white cursor-pointer transition-colors" />
      </motion.div>

      <motion.button
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        transition={{ duration: 0.5, delay: 0.8 }}
        onClick={onBookNowClick}
        className="bg-white text-black px-10 py-4 rounded-full font-bold text-lg shadow-[0_0_20px_rgba(255,255,255,0.3)] hover:shadow-[0_0_30px_rgba(255,255,255,0.5)] transition-shadow"
      >
        Book Now
      </motion.button>
    </main>
  );
}