import { useState, useEffect } from "react";
import { Download, X } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

export function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("tichlabs_install_dismissed") === "true";
    } catch {
      return false;
    }
  });
  const [isIOS, setIsIOS] = useState(false);
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  useEffect(() => {
    // Detect iOS Safari
    const ua = navigator.userAgent;
    const ios = /iPad|iPhone|iPod/.test(ua) && !("MSStream" in window);
    const standalone = ("standalone" in navigator) && (navigator as Navigator & { standalone?: boolean }).standalone;
    setIsIOS(ios && !standalone);

    // Capture install prompt for Android/desktop
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", handler);
    return () => window.removeEventListener("beforeinstallprompt", handler);
  }, []);

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem("tichlabs_install_dismissed", "true");
    } catch {
      // ignore
    }
  };

  const handleInstall = async () => {
    if (!installEvent) return;
    await installEvent.prompt();
    const result = await installEvent.userChoice;
    if (result.outcome === "accepted") {
      setInstallEvent(null);
    }
  };

  if (dismissed) return null;

  // Android / Desktop install prompt
  if (installEvent) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
            <img src="/icon/icon-192.png" alt="Tich Labs" className="w-8 h-8 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Install Tich Labs Tracker</div>
            <div className="text-xs text-muted-foreground">
              Add to home screen for offline access
            </div>
          </div>
          <div className="flex items-center gap-1.5 flex-shrink-0">
            <Button size="sm" onClick={handleInstall} className="h-8 px-3 text-xs">
              <Download className="h-3.5 w-3.5 mr-1" /> Install
            </Button>
            <button
              onClick={handleDismiss}
              className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
            >
              <X className="h-3.5 w-3.5 text-muted-foreground" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // iOS Safari install guide
  if (isIOS && !showIOSGuide) {
    return (
      <div className="fixed bottom-4 left-4 right-4 z-50 max-w-sm mx-auto">
        <div className="bg-card border border-border rounded-2xl shadow-xl p-4 flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
            <img src="/icon/icon-192.png" alt="Tich Labs" className="w-8 h-8 rounded-lg" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold">Install Tich Labs Tracker</div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Tap <span className="font-bold">Share</span> {" "}
              then <span className="font-bold">"Add to Home Screen"</span> for offline access.
            </p>
          </div>
          <button
            onClick={handleDismiss}
            className="w-7 h-7 flex items-center justify-center rounded-full hover:bg-muted transition-colors flex-shrink-0"
          >
            <X className="h-3.5 w-3.5 text-muted-foreground" />
          </button>
        </div>
      </div>
    );
  }

  return null;
}
