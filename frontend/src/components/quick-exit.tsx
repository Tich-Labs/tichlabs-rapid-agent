/**
 * QuickExit — persistent safety button visible on every page.
 * One tap clears sessionStorage and redirects to a neutral website.
 * Uses a portal so it always renders above other content.
 */
import { createPortal } from "react-dom";
import { LogOut } from "lucide-react";
import { useTranslation } from "react-i18next";

const SAFE_URL = "https://www.google.com";

function handleQuickExit() {
  // Clear any sensitive session data
  try {
    sessionStorage.clear();
  } catch {
    // ignore
  }
  // Replace history so back button doesn't return to this app
  window.location.replace(SAFE_URL);
}

export default function QuickExit() {
  const { t } = useTranslation("common");

  return createPortal(
    <button
      onClick={handleQuickExit}
      aria-label={t("quickExit.label")}
      className="fixed bottom-5 right-5 z-[9999] flex items-center gap-1.5 bg-destructive text-destructive-foreground text-xs font-bold px-3 py-2 rounded-full shadow-lg hover:bg-destructive/90 active:scale-95 transition-all cursor-pointer select-none"
    >
      <LogOut className="h-3.5 w-3.5" />
      <span className="hidden sm:inline">{t("quickExit.label")}</span>
      <span className="sm:hidden">Exit</span>
    </button>,
    document.body
  );
}
