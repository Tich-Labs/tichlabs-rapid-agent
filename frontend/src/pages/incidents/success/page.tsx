import { useSearchParams, useNavigate, useParams } from "react-router-dom";
import { motion } from "motion/react";
import { Button } from "@/components/ui/button.tsx";
import { CheckCircle2, ClipboardList, ShieldCheck, ArrowLeft } from "lucide-react";
import { useTranslation } from "react-i18next";

export default function IncidentSuccessPage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("incidents");
  const refId = params.get("ref") ?? "UNKNOWN";

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Header */}
      <div className="border-b border-border px-4 py-3 flex items-center gap-3">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <span className="font-semibold text-sm">{t("app.name", { ns: "common" })}</span>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12 text-center max-w-sm mx-auto w-full">
        <motion.div
          initial={{ scale: 0.5, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 15 }}
          className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6"
        >
          <CheckCircle2 className="h-10 w-10 text-primary" />
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="space-y-3 mb-8"
        >
          <h1 className="text-2xl font-bold text-foreground">{t("success.title")}</h1>
          <p className="text-muted-foreground text-sm leading-relaxed">
            {t("success.description")}
          </p>
        </motion.div>

        {/* Reference number */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35 }}
          className="w-full rounded-xl border-2 border-dashed border-primary/30 bg-primary/5 px-6 py-5 mb-8"
        >
          <p className="text-sm text-muted-foreground uppercase tracking-wider mb-1.5 font-medium">
            {t("success.refLabel")}
          </p>
          <p className="text-3xl font-bold text-primary tracking-widest">#{refId}</p>
          <p className="text-sm text-muted-foreground mt-2">
            {t("success.refHint")}
          </p>
        </motion.div>

        {/* What happens next */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.45 }}
          className="w-full bg-muted/40 rounded-xl p-4 mb-8 text-left space-y-3"
        >
          <p className="text-sm font-semibold text-muted-foreground uppercase tracking-wider">
            {t("success.nextTitle")}
          </p>
          {[
            t("success.step1"),
            t("success.step2"),
            t("success.step3"),
            t("success.step4"),
          ].map((step, i) => (
            <div key={i} className="flex items-start gap-3">
              <div className="w-5 h-5 rounded-full bg-primary/20 text-primary text-sm font-bold flex items-center justify-center flex-shrink-0 mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-foreground/80">{step}</p>
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.55 }}
          className="flex flex-col gap-3 w-full"
        >
          <Button
            className="w-full cursor-pointer"
            onClick={() => navigate(`/${lng}/incidents/safety`)}
          >
            <ClipboardList className="h-4 w-4 mr-2" />
            {t("success.submitAnother")}
          </Button>
          <Button variant="secondary" className="w-full cursor-pointer" onClick={() => navigate(`/${lng}`)}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {t("success.backHome")}
          </Button>
        </motion.div>

        <p className="text-sm text-muted-foreground mt-8 leading-relaxed">
          {t("success.footer")}
        </p>
      </div>
    </div>
  );
}
