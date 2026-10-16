import React, { useState, useEffect } from "react";

export function SplashScreen({ minDuration = 1100, onComplete }) {
  const [isVisible, setIsVisible] = useState(() => {
    try {
      if (typeof window !== "undefined" && window.sessionStorage) {
        return !sessionStorage.getItem("flash_splash_shown");
      }
    } catch (e) {
      // fallback
    }
    return false;
  });
  const [isFading, setIsFading] = useState(false);

  useEffect(() => {
    if (!isVisible) {
      if (onComplete) onComplete();
      return;
    }

    try {
      sessionStorage.setItem("flash_splash_shown", "1");
    } catch (e) {}

    const fadeTimer = setTimeout(() => {
      setIsFading(true);
    }, minDuration);

    const removeTimer = setTimeout(() => {
      setIsVisible(false);
      if (onComplete) onComplete();
    }, minDuration + 350);

    return () => {
      clearTimeout(fadeTimer);
      clearTimeout(removeTimer);
    };
  }, [isVisible, minDuration, onComplete]);

  if (!isVisible) return null;

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-white/95 backdrop-blur-md transition-opacity duration-350 ease-out select-none ${
        isFading ? "opacity-0 pointer-events-none" : "opacity-100"
      }`}
      aria-label="FLASH Loading Splash"
    >
      <style>{`
        @keyframes flashPop {
          0% {
            opacity: 0;
            transform: scale(0.3) translateY(24px);
          }
          45% {
            opacity: 1;
            transform: scale(1.14) translateY(-6px);
          }
          70% {
            transform: scale(0.96) translateY(2px);
          }
          85% {
            transform: scale(1.02) translateY(-1px);
          }
          100% {
            opacity: 1;
            transform: scale(1) translateY(0);
          }
        }
        @keyframes flashPulseRings {
          0% {
            transform: scale(0.65);
            opacity: 0.7;
          }
          100% {
            transform: scale(1.6);
            opacity: 0;
          }
        }
      `}</style>

      <div className="relative flex flex-col items-center px-4">
        {/* Ambient Glow */}
        <div className="absolute w-64 h-64 rounded-full bg-blue-500/10 blur-3xl -z-10 pointer-events-none" />

        {/* Pulse Ring */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 rounded-full border border-blue-400/25 -z-10 pointer-events-none"
          style={{ animation: "flashPulseRings 2s cubic-bezier(0.2, 0.8, 0.2, 1) infinite" }}
        />

        {/* Popping Logo (Mascot with FLASH written below) */}
        <img
          src="/branding/flash-logo-full.png"
          alt="FLASH"
          className="h-32 sm:h-44 w-auto max-w-[280px] sm:max-w-[360px] object-contain drop-shadow-lg"
          style={{
            animation: "flashPop 0.85s cubic-bezier(0.34, 1.56, 0.64, 1) forwards",
          }}
        />

        {/* Minimal loading bar */}
        <div className="mt-8 w-36 sm:w-48 h-1.5 bg-slate-100 rounded-full overflow-hidden shadow-inner">
          <div className="h-full bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 rounded-full animate-pulse" />
        </div>
      </div>
    </div>
  );
}

