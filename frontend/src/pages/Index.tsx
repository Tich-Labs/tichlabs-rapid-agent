import { motion } from "motion/react";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  ShieldCheck,
  ClipboardList,
  Bell,
  BarChart3,
  WifiOff,
  Users,
  ArrowRight,
  CheckCircle2,
  Lock,
  FileText,
  Workflow,
  ChevronRight,
  Heart,
  Sparkles,
  Activity,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "@/components/locale-switcher.tsx";
import { Authenticated, Unauthenticated } from "@/components/auth-components";

export default function Index() {
  const navigate = useNavigate();
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation(["landing", "common"]);

  const features = [
    { icon: ClipboardList, title: t("features.structuredLogging"), description: t("features.structuredLoggingDesc") },
    { icon: WifiOff, title: t("features.offlinePWA"), description: t("features.offlinePWADesc") },
    { icon: Sparkles, title: t("features.aiAssistant"), description: t("features.aiAssistantDesc") },
    { icon: Activity, title: t("features.fhirIntegration"), description: t("features.fhirIntegrationDesc") },
    { icon: Bell, title: t("features.notifications"), description: t("features.notificationsDesc") },
    { icon: Lock, title: t("features.rbac"), description: t("features.rbacDesc") },
    { icon: BarChart3, title: t("features.reporting"), description: t("features.reportingDesc") },
    { icon: FileText, title: t("features.pdfExport"), description: t("features.pdfExportDesc") },
  ];

  const workflow = [
    { role: t("workflow.volunteer"), action: t("workflow.volunteerAction"), color: "bg-primary" },
    { role: t("workflow.mobilizer"), action: t("workflow.mobilizerAction"), color: "bg-primary/80" },
    { role: t("workflow.counselor"), action: t("workflow.counselorAction"), color: "bg-primary/60" },
    { role: t("workflow.programLead"), action: t("workflow.programLeadAction"), color: "bg-primary/40" },
    { role: t("workflow.executiveDirector"), action: t("workflow.executiveDirectorAction"), color: "bg-primary/25" },
  ];

  const privacyPoints = [
    t("privacy.point1"),
    t("privacy.point2"),
    t("privacy.point3"),
    t("privacy.point4"),
    t("privacy.point5"),
  ];

  return (
    <div className="min-h-screen bg-background text-foreground">
      {/* Navbar */}
      <nav className="sticky top-0 z-50 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <img src="/tichlabs.logo.jpeg" alt="Tich Labs" className="h-8 w-auto object-contain" />
            <span className="font-bold text-sm text-foreground">
              {t("app.name", { ns: "common" })}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <LocaleSwitcher className="hidden sm:inline-flex" />
            <Button
              onClick={() => navigate(`/${lng}/referral`)}
              variant="ghost"
              className="text-sm font-medium hidden sm:inline-flex cursor-pointer"
            >
              <Heart className="mr-1.5 h-4 w-4" />
              {t("nav.findHelp", { ns: "common" })}
            </Button>
            <Button
              onClick={() => navigate(`/${lng}/incidents/safety`)}
              className="bg-primary text-white hover:bg-primary/90 font-semibold cursor-pointer"
            >
              <ClipboardList className="mr-2 h-4 w-4" />
              {t("nav.reportIncident", { ns: "common" })}
            </Button>
            <Unauthenticated>
              <SignInButton className="bg-transparent border border-border text-foreground hover:bg-muted" />
            </Unauthenticated>
            <Authenticated>
              <Button variant="ghost" onClick={() => navigate(`/${lng}/dashboard`)} className="cursor-pointer">
                {t("nav.dashboard", { ns: "common" })} <ArrowRight className="ml-1 h-4 w-4" />
              </Button>
            </Authenticated>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative overflow-hidden bg-[oklch(0.15_0.03_195)] text-white py-24 px-4">

        <div className="relative max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: "easeOut" }}
          >
            <Badge className="mb-4 bg-primary/20 text-primary-foreground border-primary/40 hover:bg-primary/20">
              {t("hero.badge")}
            </Badge>
            <h1 className="text-4xl sm:text-5xl font-bold leading-tight text-balance mb-6">
              {t("hero.title1")}
              <br />
              <span className="text-primary">{t("hero.title2")}</span>
            </h1>
            <p className="text-lg text-white/70 leading-relaxed mb-8 max-w-lg">
              {t("hero.description")}
            </p>
            <div className="flex flex-wrap gap-3">
              <Button
                size="lg"
                onClick={() => navigate(`/${lng}/incidents/safety`)}
                className="bg-primary hover:bg-primary/90 text-white font-bold text-base px-7 cursor-pointer"
              >
                <ClipboardList className="mr-2 h-5 w-5" />
                {t("hero.reportIncident")}
              </Button>
              <Unauthenticated>
                <SignInButton className="bg-white/10 text-white border-white/20 hover:bg-white/20 h-11 px-6 text-base" />
              </Unauthenticated>
              <Authenticated>
                <Button
                  size="lg"
                  variant="secondary"
                  onClick={() => navigate(`/${lng}/dashboard`)}
                  className="bg-white/10 text-white border-white/20 hover:bg-white/20 cursor-pointer"
                >
                  {t("hero.openDashboard")} <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Authenticated>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 32 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, delay: 0.2, ease: "easeOut" }}
            className="hidden lg:grid grid-cols-2 gap-4"
          >
            {[
              { icon: ShieldCheck, label: t("hero.dataPrivacy"), sub: t("hero.dataPrivacySub") },
              { icon: WifiOff, label: t("hero.offlineMode"), sub: t("hero.offlineModeSub") },
              { icon: Users, label: t("hero.reporterTypes"), sub: t("hero.reporterTypesSub") },
              { icon: Workflow, label: t("hero.roleLevels"), sub: t("hero.roleLevelsSub") },
            ].map((item, i) => (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.1 }}
                className="bg-white/8 border border-white/10 rounded-xl p-5 backdrop-blur"
              >
                <item.icon className="h-8 w-8 text-primary mb-3" />
                <div className="font-semibold text-white text-sm">{item.label}</div>
                <div className="text-sm text-white/50 mt-0.5">{item.sub}</div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-3">
              {t("features.badge")}
            </Badge>
            <h2 className="text-3xl font-bold mb-4">{t("features.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("features.description")}
            </p>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feat, i) => (
              <motion.div
                key={feat.title}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="border border-border rounded-xl p-6 hover:border-primary/30 hover:shadow-md transition-all group bg-card"
              >
                <div className="w-11 h-11 rounded-lg bg-accent flex items-center justify-center mb-4 group-hover:bg-primary/10 transition-colors">
                  <feat.icon className="h-5 w-5 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-2">{feat.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{feat.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Workflow */}
      <section className="py-20 px-4 bg-muted/30">
        <div className="max-w-4xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-14"
          >
            <Badge variant="secondary" className="mb-3">
              {t("workflow.badge")}
            </Badge>
            <h2 className="text-3xl font-bold mb-4">{t("workflow.title")}</h2>
            <p className="text-muted-foreground max-w-xl mx-auto">
              {t("workflow.description")}
            </p>
          </motion.div>

          <div className="space-y-3">
            {workflow.map((step, i) => (
              <motion.div
                key={step.role}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="flex items-center gap-4 bg-card border border-border rounded-xl p-4 shadow-sm"
              >
                <div
                  className={`w-9 h-9 rounded-full ${step.color} flex items-center justify-center flex-shrink-0`}
                >
                  <span className="text-white font-bold text-sm">{i + 1}</span>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-sm text-foreground">{step.role}</div>
                  <div className="text-sm text-muted-foreground mt-0.5">{step.action}</div>
                </div>
                {i < workflow.length - 1 && (
                  <ChevronRight className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                )}
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Privacy section */}
      <section className="py-20 px-4 bg-background">
        <div className="max-w-6xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <Badge variant="secondary" className="mb-3">
              {t("privacy.badge")}
            </Badge>
            <h2 className="text-3xl font-bold mb-6">{t("privacy.title")}</h2>
            <div className="space-y-4">
              {privacyPoints.map((point) => (
                <div key={point} className="flex items-start gap-3">
                  <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                  <span className="text-sm text-muted-foreground leading-relaxed">{point}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="relative"
          >
            <img
              src="https://images.unsplash.com/photo-1531844251246-9a1bfaae09fc?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&w=800"
              alt={t("privacy.imageAlt")}
              className="rounded-2xl w-full object-cover shadow-xl h-72 lg:h-96"
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40" />
            <div className="absolute bottom-4 left-4 right-4 text-white">
              <div className="text-sm font-semibold">{t("privacy.imageCaption")}</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 px-4 bg-[oklch(0.15_0.03_195)] text-white">
        <div className="max-w-2xl mx-auto text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
          >
            <ShieldCheck className="h-12 w-12 text-primary mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4">{t("cta.title")}</h2>
            <p className="text-white/60 mb-8 leading-relaxed">{t("cta.description")}</p>
            <Unauthenticated>
              <SignInButton className="bg-primary text-white hover:bg-primary/90 px-8 py-2 h-12 text-base" />
            </Unauthenticated>
            <Authenticated>
              <Button
                size="lg"
                onClick={() => navigate(`/${lng}/dashboard`)}
                className="bg-primary hover:bg-primary/90 cursor-pointer"
              >
                {t("hero.openDashboard")} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Authenticated>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-background py-8 px-4 border-t border-border">
        <div className="max-w-6xl mx-auto flex items-center justify-center">
          <div className="flex items-center gap-2">
            <img src="/tichlabs.logo.jpeg" alt="Tich Labs" className="h-7 w-auto object-contain" />
            <span className="text-sm font-semibold text-foreground">{t("app.name", { ns: "common" })}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
