import React, { useState, useEffect } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBanner, setShowBanner] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBanner(true);
      const timer = setTimeout(() => setShowBanner(false), 3000);
      return () => clearTimeout(timer);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowBanner(true);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  if (!showBanner && isOnline) return null;

  return (
    <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl transition-all duration-300 transform translate-y-0 ${
      isOnline 
        ? 'bg-emerald-500 text-white' 
        : 'bg-rose-500 text-white animate-pulse'
    }`}>
      {isOnline ? (
        <>
          <Wifi className="w-5 h-5 shrink-0 animate-bounce" />
          <span className="text-xs font-bold">Network Connection Restored</span>
        </>
      ) : (
        <>
          <WifiOff className="w-5 h-5 shrink-0 animate-bounce" />
          <span className="text-xs font-bold">You are currently offline</span>
        </>
      )}
    </div>
  );
};

export default OfflineIndicator;
