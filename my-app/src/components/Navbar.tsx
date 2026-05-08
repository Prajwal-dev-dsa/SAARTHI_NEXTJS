import { motion } from "framer-motion";

interface NavbarProps {
  onLoginClick: () => void;
}

export default function Navbar({ onLoginClick }: NavbarProps) {
  return (
    <motion.nav
      initial={{ y: -100, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.8, ease: "easeOut" }}
      className="relative z-10 flex items-center justify-between px-6 py-5 md:px-16"
    >
      <div className="text-2xl font-black tracking-widest uppercase">Saarthi</div>

      <div className="hidden md:flex space-x-8 text-sm font-medium text-gray-300">
        <span className="hover:text-white cursor-pointer transition-colors">Home</span>
        <span className="hover:text-white cursor-pointer transition-colors">Bookings</span>
        <span className="hover:text-white cursor-pointer transition-colors">About Us</span>
        <span className="hover:text-white cursor-pointer transition-colors">Contact</span>
      </div>

      <button
        onClick={onLoginClick}
        className="bg-white text-black px-6 py-2 rounded-full font-semibold text-sm hover:bg-gray-200 transition-colors"
      >
        Login
      </button>
    </motion.nav>
  );
}