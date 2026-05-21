import { useState, useEffect } from "react";
import { WifiOff, Wifi, X } from "lucide-react";
import { cn } from "@/lib/utils.ts";

export function OfflineBanner() {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showBackOnline, setShowBackOnline] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowBackOnline(true);
      // Hide "back online" banner after 3s
      setTimeout(() => setShowBackOnline(false), 3000);
    };
    const handleOffline = () => {
      setIsOnline(false);
      setShowBackOnline(false);
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline && !showBackOnline) return null;

  return (
    <div
      className={cn(
        "flex items-center gap-2 px-4 py-2 text-xs font-medium transition-all",
        isOnline
          ? "bg-green-50 text-green-700 border-b border-green-200"
          : "bg-amber-50 text-amber-800 border-b border-amber-200"
      )}
    >
      {isOnline ? (
        <>
          <Wifi className="h-3.5 w-3.5 flex-shrink-0" />
          <span>Back online — saved incidents are syncing.</span>
        </>
      ) : (
        <>
          <WifiOff className="h-3.5 w-3.5 flex-shrink-0" />
          <span>
            You are offline. Incidents will be saved locally and synced when you reconnect.
          </span>
        </>
      )}
    </div>
  );
}
