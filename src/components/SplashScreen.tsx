import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface SplashScreenProps {
  onComplete: () => void;
}

const LOADING_STEPS = [
  "Inicializando sistema de control...",
  "Cargando inventario biomédico...",
  "Conectando base de datos local...",
  "Listo para operar"
];

export default function SplashScreen({ onComplete }: SplashScreenProps) {
  const [progress, setProgress] = useState(0);
  const [stepIndex, setStepIndex] = useState(0);
  const [isExiting, setIsExiting] = useState(false);

  useEffect(() => {
    // Progress bar animation
    const progressInterval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(progressInterval);
          return 100;
        }
        // Speed up slightly as it goes
        const increment = Math.floor(Math.random() * 8) + 4;
        return Math.min(prev + increment, 100);
      });
    }, 100);

    return () => clearInterval(progressInterval);
  }, []);

  useEffect(() => {
    // Dynamic text steps based on progress
    if (progress < 25) {
      setStepIndex(0);
    } else if (progress < 60) {
      setStepIndex(1);
    } else if (progress < 90) {
      setStepIndex(2);
    } else {
      setStepIndex(3);
    }

    if (progress === 100) {
      // Small delay at 100% for a polished user experience before fading out
      const exitTimeout = setTimeout(() => {
        setIsExiting(true);
        // Let the fade-out animation complete before triggering onComplete
        const completeTimeout = setTimeout(() => {
          onComplete();
        }, 600);
        return () => clearTimeout(completeTimeout);
      }, 500);

      return () => clearTimeout(exitTimeout);
    }
  }, [progress, onComplete]);

  return (
    <AnimatePresence>
      {!isExiting && (
        <motion.div
          id="apb-splash-screen"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="fixed inset-0 bg-white z-[9999] flex flex-col items-center justify-center p-6 text-blue-950 overflow-hidden"
        >
          {/* Ambient light effects in background - intense elegant red glows at top and bottom */}
          <div className="absolute top-0 inset-x-0 h-64 bg-gradient-to-b from-red-600/20 via-red-500/10 to-transparent blur-xl pointer-events-none" />
          <div className="absolute bottom-0 inset-x-0 h-64 bg-gradient-to-t from-red-600/20 via-red-500/10 to-transparent blur-xl pointer-events-none" />
          
          {/* Circular deep red diffuse lights */}
          <div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-br from-red-500/30 to-rose-600/20 rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
          <div className="absolute -bottom-32 left-1/2 -translate-x-1/2 w-[600px] h-[350px] bg-gradient-to-tr from-red-500/30 to-rose-600/20 rounded-full blur-[90px] pointer-events-none animate-pulse" style={{ animationDuration: '4s' }} />
          
          {/* Subtle warm center balance */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] bg-red-100/15 rounded-full blur-3xl pointer-events-none" />

          <div className="relative max-w-md w-full flex flex-col items-center text-center space-y-8 z-10">
            {/* Elegant typographic entrance instead of physical icon */}
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 1, ease: "easeOut" }}
              className="relative flex flex-col items-center justify-center p-6"
            >
              <h1 className="text-7xl font-black tracking-widest text-blue-950 drop-shadow-[0_4px_12px_rgba(15,23,42,0.1)] select-none">APB</h1>
              <div className="w-16 h-1.5 bg-blue-950 rounded-full mt-3 shadow-md shadow-blue-950/20" />
            </motion.div>

            {/* Branding Titles */}
            <div className="space-y-2">
              <motion.p
                initial={{ y: 15, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.3, duration: 0.6 }}
                className="text-sm text-blue-950 uppercase tracking-widest font-black max-w-xs mx-auto"
              >
                Asesoría y Pluriservicios Biomédicos
              </motion.p>
            </div>

            {/* Loading Indicator Area */}
            <div className="w-full max-w-xs space-y-3 pt-6">
              {/* Custom Elegant Progress Bar */}
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden border border-slate-200 p-[1px]">
                <motion.div
                  className="h-full bg-gradient-to-r from-blue-950 via-blue-800 to-sky-600 rounded-full"
                  initial={{ width: "0%" }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>

              {/* Status & Percentage */}
              <div className="flex justify-between items-center text-[11px] font-bold text-blue-950 font-mono">
                <span className="animate-pulse">{LOADING_STEPS[stepIndex]}</span>
                <span className="text-blue-950 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
                  {progress}%
                </span>
              </div>
            </div>

            {/* Sub-footer detail */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.95 }}
              transition={{ delay: 0.8 }}
              className="text-[10px] text-blue-950/90 font-bold uppercase tracking-wider pt-8"
            >
              Control Técnico Biomédico Autorizado
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
