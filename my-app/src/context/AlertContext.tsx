"use client";

import { createContext, useContext, useState, ReactNode } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { AlertCircle, CheckCircle2, Info, X } from "lucide-react";

// Define the types of alerts we can have
type AlertType = "success" | "error" | "info";

interface AlertContextType {
  showAlert: (message: string, type?: AlertType) => void;
}

const AlertContext = createContext<AlertContextType | undefined>(undefined);

export function AlertProvider({ children }: { children: ReactNode }) {
  const [alert, setAlert] = useState<{ message: string; type: AlertType } | null>(null);

  const showAlert = (message: string, type: AlertType = "info") => {
    setAlert({ message, type });

    // Auto-dismiss the alert after 4 seconds
    setTimeout(() => {
      setAlert(null);
    }, 4000);
  };

  // Helper to get the right icon and colors based on alert type
  const getAlertStyles = (type: AlertType) => {
    switch (type) {
      case "success":
        return { icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, border: "border-green-500/50" };
      case "error":
        return { icon: <AlertCircle className="w-5 h-5 text-red-500" />, border: "border-red-500/50" };
      default:
        return { icon: <Info className="w-5 h-5 text-blue-500" />, border: "border-blue-500/50" };
    }
  };

  return (
    <AlertContext.Provider value={{ showAlert }}>
      {children}

      {/* The Global Alert UI */}
      <AnimatePresence>
        {alert && (
          <motion.div
            initial={{ opacity: 0, y: -50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-6 left-1/2 -translate-x-1/2 z-100 flex items-center shadow-2xl"
          >
            <div className={`bg-black/90 backdrop-blur-md border ${getAlertStyles(alert.type).border} text-white px-5 py-3 rounded-full flex items-center space-x-3 shadow-[0_0_20px_rgba(0,0,0,0.5)]`}>
              {getAlertStyles(alert.type).icon}
              <span className="font-medium text-sm tracking-wide">{alert.message}</span>
              <button
                onClick={() => setAlert(null)}
                className="ml-4 pl-3 border-l border-gray-700 text-gray-400 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </AlertContext.Provider>
  );
}

// Custom hook to use the alert anywhere!
export const useAlert = () => {
  const context = useContext(AlertContext);
  if (context === undefined) {
    throw new Error("useAlert must be used within an AlertProvider");
  }
  return context;
};