/**
 * Safety Gate — shown before the incident reporting form.
 * Users must confirm they are in a safe space before continuing.
 */
import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { ShieldCheck, Heart, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button.tsx";
import { cn } from "@/lib/utils.ts";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "@/components/locale-switcher.tsx";

const SAFE_URL = "https://www.google.com";

export default function SafetyGatePage() {
  const navigate = useNavigate();
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("incidents");
  const [consented, setConsented] = useState(false);

  const handleLeave = () => {
    try { sessionStorage.clear(); } catch { /* ignore */ }
    window.location.replace(SAFE_URL);
  };

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-5 py-10">
      {/* Language switcher top-right */}
      <div className="absolute top-4 right-4">
        <LocaleSwitcher />
      </div>

      <motion.div
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="w-full max-w-sm flex flex-col items-center text-center gap-6"
      >
        {/* Icon */}
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <Heart className="h-9 w-9 text-primary" />
        </div>

        {/* Title + body */}
        <div className="space-y-3">
          <h1 className="text-2xl font-bold text-foreground">{t("safety.title")}</h1>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("safety.description")}
          </p>
        </div>

        {/* Consent checkbox */}
        <button
          type="button"
          onClick={() => setConsented((v) => !v)}
          className={cn(
            "w-full flex items-start gap-3 text-left p-4 rounded-xl border-2 transition-all cursor-pointer",
            consented
              ? "border-primary bg-primary/5"
              : "border-border bg-card hover:border-primary/40"
          )}
          aria-pressed={consented}
        >
          {/* Custom checkbox */}
          <div
            className={cn(
              "mt-0.5 w-5 h-5 flex-shrink-0 rounded border-2 flex items-center justify-center transition-all",
              consented ? "bg-primary border-primary" : "border-muted-foreground"
            )}
          >
            {consented && (
              <svg viewBox="0 0 12 10" fill="none" className="w-3 h-3">
                <path d="M1 5l3.5 3.5L11 1" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            )}
          </div>
          <span className="text-sm font-medium text-foreground leading-snug">
            {t("safety.consent")}
          </span>
        </button>

        {/* Actions */}
        <div className="flex flex-col gap-3 w-full">
          <Button
            className="w-full h-12 text-base font-semibold cursor-pointer"
            disabled={!consented}
            onClick={() => navigate(`/${lng}/incidents/new`)}
          >
            <ShieldCheck className="h-5 w-5 mr-2" />
            {t("safety.continue")}
          </Button>
          <Button
            variant="secondary"
            className="w-full h-12 text-base cursor-pointer"
            onClick={handleLeave}
          >
            <LogOut className="h-4 w-4 mr-2" />
            {t("safety.leave")}
          </Button>
        </div>

        <p className="text-sm text-muted-foreground leading-relaxed">
          {t("safety.footer")}
        </p>
      </motion.div>
    </div>
  );
}
