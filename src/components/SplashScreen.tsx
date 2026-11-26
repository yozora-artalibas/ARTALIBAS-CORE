import React, { useEffect, useState } from 'react';

export const SPLASH_DURATION_MS = 1000;
const SPLASH_FADE_MS = 150;

interface SplashScreenProps {
  onComplete: () => void;
}

export const SplashScreen: React.FC<SplashScreenProps> = ({ onComplete }) => {
  const [isFading, setIsFading] = useState<boolean>(false);

  useEffect(() => {
    const fadeTimer = window.setTimeout(() => {
      setIsFading(true);
    }, SPLASH_DURATION_MS - SPLASH_FADE_MS);

    const doneTimer = window.setTimeout(() => {
      onComplete();
    }, SPLASH_DURATION_MS);

    return () => {
      window.clearTimeout(fadeTimer);
      window.clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      data-testid="splash-screen"
      role="status"
      aria-label="Memuat Aplikasi Artalibas Core YTP 942"
      className={`fixed inset-0 z-[100] bg-black flex flex-col items-center justify-center px-6 transition-opacity duration-150 ${
        isFading ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center justify-center w-full max-w-[360px]">
        <img
          src="/assets/splash-logo-macan-512.png"
          alt="Logo Macan Yonif TP 942"
          width={512}
          height={512}
          loading="eager"
          decoding="sync"
          className="w-[270px] sm:w-[320px] max-w-[74vw] aspect-square object-contain select-none pointer-events-none"
        />
        <img
          src="/assets/splash-artalibas-text.png"
          alt="Artalibas Core YTP 942"
          loading="eager"
          decoding="sync"
          className="w-[250px] sm:w-[290px] max-w-[72vw] h-auto object-contain mt-3 select-none pointer-events-none"
        />
      </div>
    </div>
  );
};
