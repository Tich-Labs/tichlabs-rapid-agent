import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { Label } from "@/components/ui/label.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { toast } from "sonner";
import { cn } from "@/lib/utils.ts";
import { useOfflineIncidentQueue } from "@/hooks/use-offline-incident-queue.ts";
import { runAutoRiskAssessment } from "@/hooks/use-auto-risk-assessment";
import { useSupabaseMutation } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/components/providers/supabase";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "@/components/locale-switcher.tsx";
import {
  ChevronLeft,
  ChevronRight,
  CheckCircle2,
  ClipboardList,
  MapPin,
  User,
  Users,
  UserCheck,
  FileText,
  Send,
  AlertTriangle,
  WifiOff,
  ShieldCheck,
  ShieldAlert,
  AlertOctagon,
  HeartCrack,
  Home,
  UserX,
  Flame,
  Search,
  HelpCircle,
  KeyRound,
  Smartphone,
  Baby,
} from "lucide-react";

// --- Constants ---

const INCIDENT_TYPE_VALUES = [
  "physical_abuse",
  "sexual_abuse",
  "emotional_abuse",
  "neglect",
  "bullying_harassment",
  "domestic_violence",
  "child_exploitation",
  "missing_child",
  "tech_enabled_abuse",
  "other",
] as const;

const INCIDENT_TYPE_ICONS: Record<string, typeof ShieldAlert> = {
  physical_abuse: ShieldAlert,
  sexual_abuse: AlertOctagon,
  emotional_abuse: HeartCrack,
  neglect: Home,
  bullying_harassment: UserX,
  domestic_violence: Flame,
  child_exploitation: Baby,
  missing_child: Search,
  tech_enabled_abuse: Smartphone,
  other: HelpCircle,
};

const AGE_GROUP_VALUES = [
  "under_10",
  "10_14",
  "15_18",
  "18_22",
  "23_27",
  "28_35",
  "35_plus",
  "unknown",
] as const;

const GENDER_VALUES = ["male", "female", "other", "prefer_not_to_say"] as const;

const REPORTER_TYPE_VALUES = ["self", "on_behalf", "volunteer"] as const;

type IncidentType = (typeof INCIDENT_TYPE_VALUES)[number];
type AgeGroup = (typeof AGE_GROUP_VALUES)[number];
type Gender = (typeof GENDER_VALUES)[number];
type ReporterType = (typeof REPORTER_TYPE_VALUES)[number];

const REPORTER_ICONS: Record<string, typeof User> = {
  self: User,
  on_behalf: Users,
  volunteer: UserCheck,
};

interface FormData {
  reporterType: ReporterType | "";
  volunteerId: string;
  incidentDate: string;
  incidentTime: string;
  incidentType: IncidentType | "";
  location: string;
  description: string;
  notes: string;
  survivorAgeGroup: AgeGroup | "";
  survivorGender: Gender | "";
  submitterContact: string;
  reporterInitials: string;
  reporterBirthMonth: string;
  reporterBirthYear: string;
}

const STEP_ICONS = [UserCheck, ClipboardList, MapPin, User, FileText];

// --- Step indicator ---
function StepIndicator({ current, stepTitles }: { current: number; stepTitles: string[] }) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-muted/40 border-b border-border">
      {stepTitles.map((_, i) => (
        <div key={i} className="flex items-center">
          <div
            className={cn(
              "w-7 h-7 rounded-full flex items-center justify-center text-sm font-bold transition-all",
              current > i + 1
                ? "bg-primary text-primary-foreground"
                : current === i + 1
                ? "bg-primary text-primary-foreground ring-2 ring-primary/30"
                : "bg-muted text-muted-foreground"
            )}
          >
            {current > i + 1 ? <CheckCircle2 className="h-4 w-4" /> : i + 1}
          </div>
          {i < stepTitles.length - 1 && (
            <div
              className={cn(
                "h-0.5 w-6 sm:w-10 mx-1 transition-colors",
                current > i + 1 ? "bg-primary" : "bg-border"
              )}
            />
          )}
        </div>
      ))}
    </div>
  );
}

// --- Step 1: Who is reporting? ---
function StepReporter({ data, onChange, t }: { data: FormData; onChange: (f: Partial<FormData>) => void; t: (key: string, opts?: Record<string, unknown>) => string }) {
  return (
    <div className="space-y-6 px-4 py-6">
      <div>
        <h2 className="text-lg font-bold mb-1">{t("reporter.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("reporter.instruction")}</p>
      </div>

      <div className="grid grid-cols-1 gap-2">
        {REPORTER_TYPE_VALUES.map((typeValue) => {
          const Icon = REPORTER_ICONS[typeValue];
          const isSelected = data.reporterType === typeValue;
          const descKey = `reporter.${typeValue}Desc`;
          return (
            <button
              key={typeValue}
              type="button"
              onClick={() => onChange({ reporterType: typeValue, volunteerId: typeValue !== "volunteer" ? "" : data.volunteerId })}
              className={cn(
                "flex flex-col items-start gap-1 p-4 rounded-xl border-2 text-left transition-all active:scale-95 cursor-pointer",
                isSelected
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <div className="flex items-center gap-3">
                <Icon
                  className={cn(
                    "h-5 w-5",
                    isSelected ? "text-primary" : "text-muted-foreground"
                  )}
                />
                <span className="text-sm font-semibold">{t(`reporter.${typeValue}`)}</span>
              </div>
              <span className="text-sm text-muted-foreground ml-8">{t(descKey)}</span>
            </button>
          );
        })}
      </div>

      {data.reporterType === "volunteer" && (
        <div className="space-y-2">
          <Label htmlFor="volunteerId" className="text-sm font-medium">
            {t("reporter.volunteerIdLabel")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="volunteerId"
            placeholder={t("reporter.volunteerIdPlaceholder")}
            value={data.volunteerId}
            onChange={(e) => onChange({ volunteerId: e.target.value.toUpperCase().replace(/[^A-Z0-9-]/g, "") })}
            className="h-11 font-mono tracking-wider"
          />
          <p className="text-sm text-muted-foreground">{t("reporter.volunteerIdHint")}</p>
        </div>
      )}
    </div>
  );
}

// --- Step 2: Incident type + date/time ---
function StepIncidentType({ data, onChange, t }: { data: FormData; onChange: (f: Partial<FormData>) => void; t: (key: string, opts?: Record<string, unknown>) => string }) {
  return (
    <div className="space-y-6 px-4 py-6">
      <div>
        <h2 className="text-lg font-bold mb-1">{t("step1.question")}</h2>
        <p className="text-sm text-muted-foreground">{t("step1.instruction")}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
        {INCIDENT_TYPE_VALUES.map((typeValue) => {
          const Icon = INCIDENT_TYPE_ICONS[typeValue];
          const isSelected = data.incidentType === typeValue;
          return (
            <button
              key={typeValue}
              type="button"
              onClick={() => onChange({ incidentType: typeValue })}
              className={cn(
                "flex flex-col items-start gap-2 p-4 rounded-xl border-2 text-left transition-all active:scale-95 min-h-[80px] cursor-pointer",
                isSelected
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              <Icon
                className={cn(
                  "h-6 w-6",
                  isSelected ? "text-primary" : "text-muted-foreground"
                )}
              />
              <span className="text-sm font-semibold leading-tight">{t(`types.${typeValue}`)}</span>
            </button>
          );
        })}
      </div>

      {/* Tech-Enabled Abuse description */}
      {data.incidentType === "tech_enabled_abuse" && (
        <div className="flex items-start gap-2 p-3 rounded-lg bg-accent border border-border text-sm text-accent-foreground">
          <Smartphone className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
          <span>{t("step1.techAbuseInfo")}</span>
        </div>
      )}

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="incidentDate" className="text-sm font-medium">
            {t("step1.dateLabel")} <span className="text-destructive">*</span>
          </Label>
          <Input
            id="incidentDate"
            type="date"
            value={data.incidentDate}
            max={new Date().toISOString().split("T")[0]}
            onChange={(e) => onChange({ incidentDate: e.target.value })}
            className="h-11"
          />
        </div>
        <div className="space-y-2">
          <Label htmlFor="incidentTime" className="text-sm font-medium">
            {t("step1.timeLabel")}
          </Label>
          <Input
            id="incidentTime"
            type="time"
            value={data.incidentTime}
            onChange={(e) => onChange({ incidentTime: e.target.value })}
            className="h-11"
          />
        </div>
      </div>
    </div>
  );
}

// --- Step 3: Location + description ---
function StepLocationDesc({ data, onChange, t }: { data: FormData; onChange: (f: Partial<FormData>) => void; t: (key: string, opts?: Record<string, unknown>) => string }) {
  return (
    <div className="space-y-6 px-4 py-6">
      <div>
        <h2 className="text-lg font-bold mb-1">{t("step2.question")}</h2>
        <p className="text-sm text-muted-foreground">{t("step2.instruction")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="location" className="text-sm font-medium">
          {t("step2.locationLabel")} <span className="text-destructive">*</span>
        </Label>
        <Input
          id="location"
          placeholder={t("step2.locationPlaceholder")}
          value={data.location}
          onChange={(e) => onChange({ location: e.target.value })}
          className="h-11"
        />
        <p className="text-sm text-muted-foreground">{t("step2.locationHint")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="description" className="text-sm font-medium">
          {t("step2.descriptionLabel")} <span className="text-destructive">*</span>
        </Label>
        <Textarea
          id="description"
          placeholder={t("step2.descriptionPlaceholder")}
          value={data.description}
          onChange={(e) => onChange({ description: e.target.value })}
          rows={6}
          className="resize-none leading-relaxed"
        />
        <div className="flex justify-between text-sm text-muted-foreground">
          <span>{t("step2.descriptionHint")}</span>
          <span>{t("step2.charCount", { count: data.description.length })}</span>
        </div>
      </div>
    </div>
  );
}

// --- Step 4: Survivor info (anonymized) ---
function StepSurvivorInfo({ data, onChange, t }: { data: FormData; onChange: (f: Partial<FormData>) => void; t: (key: string, opts?: Record<string, unknown>) => string }) {
  return (
    <div className="space-y-6 px-4 py-6">
      <div>
        <h2 className="text-lg font-bold mb-1">{t("step3.question")}</h2>
        <p className="text-sm text-muted-foreground">{t("step3.instruction")}</p>
        <div className="mt-3 flex items-center gap-2 p-3 rounded-lg bg-accent text-accent-foreground text-sm border border-border">
          <AlertTriangle className="h-4 w-4 text-primary flex-shrink-0" />
          {t("step3.warning")}
        </div>
      </div>

      {/* Age group — dropdown */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {t("step3.ageLabel")} <span className="text-destructive">*</span>
        </Label>
        <Select
          value={data.survivorAgeGroup}
          onValueChange={(val) => onChange({ survivorAgeGroup: val as AgeGroup })}
        >
          <SelectTrigger className="h-11">
            <SelectValue placeholder={t("step3.agePlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            {AGE_GROUP_VALUES.map((ag) => (
              <SelectItem key={ag} value={ag}>
                {t(`age.${ag}`)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Gender — buttons */}
      <div className="space-y-3">
        <Label className="text-sm font-medium">
          {t("step3.genderLabel")} <span className="text-destructive">*</span>
        </Label>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {GENDER_VALUES.map((g) => (
            <button
              key={g}
              type="button"
              onClick={() => onChange({ survivorGender: g })}
              className={cn(
                "py-3 px-3 rounded-xl border-2 text-sm font-medium transition-all active:scale-95 text-left cursor-pointer",
                data.survivorGender === g
                  ? "border-primary bg-accent text-accent-foreground"
                  : "border-border bg-card hover:border-primary/40"
              )}
            >
              {t(`gender.${g}`)}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Step 5: Notes + reference builder / volunteer ID + optional contact + review ---
function StepReviewSubmit({ data, onChange, t }: { data: FormData; onChange: (f: Partial<FormData>) => void; t: (key: string, opts?: Record<string, unknown>) => string }) {
  const previewRef =
    data.reporterInitials.trim().length >= 2 &&
    data.reporterBirthMonth.trim().length > 0 &&
    data.reporterBirthYear.trim().length === 4
      ? `${data.reporterInitials.trim().toUpperCase()}${data.reporterBirthMonth.trim().padStart(2, "0")}${data.reporterBirthYear.trim()}`
      : null;

  return (
    <div className="space-y-6 px-4 py-6">
      <div>
        <h2 className="text-lg font-bold mb-1">{t("step4.question")}</h2>
        <p className="text-sm text-muted-foreground">{t("step4.instruction")}</p>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes" className="text-sm font-medium">
          {t("step4.notesLabel")}
        </Label>
        <Textarea
          id="notes"
          placeholder={t("step4.notesPlaceholder")}
          value={data.notes}
          onChange={(e) => onChange({ notes: e.target.value })}
          rows={4}
          className="resize-none"
        />
      </div>

      {/* Volunteer ID display (for volunteer reporters) */}
      {data.reporterType === "volunteer" && data.volunteerId && (
        <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
          <UserCheck className="h-4 w-4 text-primary flex-shrink-0" />
          <span className="text-sm font-mono font-bold text-primary tracking-widest">
            {data.volunteerId}
          </span>
          <span className="text-sm text-muted-foreground ml-auto">{t("reporter.volunteerIdLabel")}</span>
        </div>
      )}

      {/* Reference number builder (for self / on_behalf reporters) */}
      {data.reporterType !== "volunteer" && (
        <div className="space-y-3">
          <div>
            <Label className="text-sm font-medium">
              {t("step4.refLabel")}{" "}
              <span className="text-muted-foreground font-normal">{t("step4.refOptional")}</span>
            </Label>
            <p className="text-sm text-muted-foreground mt-1">
              {t("step4.refHint")}
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
            <div className="space-y-1.5">
              <Label htmlFor="refInitials" className="text-sm text-muted-foreground">
                {t("step4.initialsLabel")}
              </Label>
              <Input
                id="refInitials"
                placeholder="NT"
                maxLength={3}
                value={data.reporterInitials}
                onChange={(e) =>
                  onChange({ reporterInitials: e.target.value.replace(/[^a-zA-Z]/g, "") })
                }
                className="h-10 uppercase tracking-widest font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refMonth" className="text-sm text-muted-foreground">
                {t("step4.monthLabel")}
              </Label>
              <Input
                id="refMonth"
                placeholder="11"
                type="number"
                min={1}
                max={12}
                value={data.reporterBirthMonth}
                onChange={(e) => onChange({ reporterBirthMonth: e.target.value })}
                className="h-10 font-mono"
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="refYear" className="text-sm text-muted-foreground">
                {t("step4.yearLabel")}
              </Label>
              <Input
                id="refYear"
                placeholder="1974"
                type="number"
                min={1900}
                max={new Date().getFullYear()}
                value={data.reporterBirthYear}
                onChange={(e) => onChange({ reporterBirthYear: e.target.value })}
                className="h-10 font-mono"
              />
            </div>
          </div>
          {previewRef && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-primary/5 border border-primary/20">
              <KeyRound className="h-4 w-4 text-primary flex-shrink-0" />
              <span className="text-sm font-mono font-bold text-primary tracking-widest">
                #{previewRef}
              </span>
              <span className="text-sm text-muted-foreground ml-auto">{t("step4.yourReference")}</span>
            </div>
          )}
        </div>
      )}

      {/* Optional contact */}
      <div className="space-y-2">
        <Label htmlFor="submitterContact" className="text-sm font-medium">
          {t("step4.emailLabel")} <span className="text-muted-foreground font-normal">{t("step4.emailOptional")}</span>
        </Label>
        <Input
          id="submitterContact"
          type="email"
          placeholder={t("step4.emailPlaceholder")}
          value={data.submitterContact}
          onChange={(e) => onChange({ submitterContact: e.target.value })}
          className="h-11"
        />
        <p className="text-sm text-muted-foreground">
          {t("step4.emailHint")}
        </p>
      </div>

      {/* Review summary */}
      <div className="rounded-xl border border-border bg-muted/30 overflow-hidden">
        <div className="px-4 py-3 bg-muted/50 border-b border-border">
          <h3 className="text-sm font-semibold">{t("step4.reviewTitle")}</h3>
        </div>
        <div className="divide-y divide-border">
          {[
            { label: t("review.reporter"), value: data.reporterType ? t(`reporter.${data.reporterType}`) : "—" },
            ...(data.reporterType === "volunteer" && data.volunteerId
              ? [{ label: t("review.volunteerId"), value: data.volunteerId }]
              : []),
            { label: t("review.type"), value: data.incidentType ? t(`types.${data.incidentType}`) : "—" },
            { label: t("review.date"), value: data.incidentDate || "—" },
            { label: t("review.time"), value: data.incidentTime || t("review.notSpecified") },
            { label: t("review.location"), value: data.location || "—" },
            { label: t("review.ageGroup"), value: data.survivorAgeGroup ? t(`age.${data.survivorAgeGroup}`) : "—" },
            { label: t("review.gender"), value: data.survivorGender ? t(`gender.${data.survivorGender}`) : "—" },
          ].map((row) => (
            <div key={row.label} className="flex items-start px-4 py-2.5 gap-3">
              <span className="text-sm text-muted-foreground w-20 flex-shrink-0 pt-0.5">{row.label}</span>
              <span className="text-sm font-medium text-foreground break-words flex-1">{row.value}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// --- Validation per step ---
function validate(step: number, data: FormData, t: (key: string) => string): string | null {
  if (step === 1) {
    if (!data.reporterType) return t("validation.selectReporter");
    if (data.reporterType === "volunteer" && !data.volunteerId.trim()) return t("validation.enterVolunteerId");
  }
  if (step === 2) {
    if (!data.incidentType) return t("validation.selectType");
    if (!data.incidentDate) return t("validation.enterDate");
  }
  if (step === 3) {
    if (!data.location.trim()) return t("validation.enterLocation");
    if (data.description.trim().length < 30) return t("validation.descriptionMin");
  }
  if (step === 4) {
    if (!data.survivorAgeGroup) return t("validation.selectAge");
    if (!data.survivorGender) return t("validation.selectGender");
  }
  return null;
}

// --- Main form page (PUBLIC — no auth required) ---
export default function NewIncidentPage() {
  const navigate = useNavigate();
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("incidents");
  const { user, isLoading: authLoading } = useAuth();
  const createIncident = useSupabaseMutation(
    async (incident: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("incidents")
        .insert(incident)
        .select()
        .single();
      if (error) throw error;
      return data;
    }
  );
  const { enqueue } = useOfflineIncidentQueue();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const stepTitles = [
    t("reporter.title"),
    t("step1.title"),
    t("step2.title"),
    t("step3.title"),
    t("step4.title"),
  ];

  useEffect(() => {
    const on = () => setIsOnline(true);
    const off = () => setIsOnline(false);
    window.addEventListener("online", on);
    window.addEventListener("offline", off);
    return () => {
      window.removeEventListener("online", on);
      window.removeEventListener("offline", off);
    };
  }, []);

  const [form, setForm] = useState<FormData>({
    reporterType: "",
    volunteerId: "",
    incidentDate: new Date().toISOString().split("T")[0],
    incidentTime: "",
    incidentType: "",
    location: "",
    description: "",
    notes: "",
    survivorAgeGroup: "",
    survivorGender: "",
    submitterContact: "",
    reporterInitials: "",
    reporterBirthMonth: "",
    reporterBirthYear: "",
  });

  const update = (fields: Partial<FormData>) => {
    setForm((prev) => ({ ...prev, ...fields }));
    setError(null);
  };

  const handleNext = () => {
    const err = validate(step, form, t);
    if (err) { setError(err); return; }
    setStep((s) => s + 1);
    window.scrollTo(0, 0);
  };

  const handleBack = () => {
    setStep((s) => s - 1);
    setError(null);
    window.scrollTo(0, 0);
  };

  const buildRefId = (incidentId: string): string => {
    const initials = form.reporterInitials.trim().toUpperCase();
    const month = form.reporterBirthMonth.trim();
    const year = form.reporterBirthYear.trim();
    if (initials.length >= 2 && month.length > 0 && year.length === 4) {
      return `${initials}${month.padStart(2, "0")}${year}`;
    }
    return incidentId.slice(-8).toUpperCase();
  };

  const handleSubmit = async () => {
    if (!form.reporterType || !form.incidentType || !form.survivorAgeGroup || !form.survivorGender) return;
    setSubmitting(true);

    // Offline — queue and redirect
    if (!isOnline) {
      enqueue({
        reporterType: form.reporterType,
        volunteerId: form.volunteerId || undefined,
        incidentDate: form.incidentDate,
        incidentTime: form.incidentTime || undefined,
        incidentType: form.incidentType,
        location: form.location,
        description: form.description,
        notes: form.notes || undefined,
        survivorAgeGroup: form.survivorAgeGroup,
        survivorGender: form.survivorGender,
        submitterContact: form.submitterContact || undefined,
      });
      toast.success(t("toast.savedOffline"), { duration: 4000 });
      navigate(`/${lng}/dashboard`);
      setSubmitting(false);
      return;
    }

    try {
      const offlineId = `${Date.now()}-${Math.random().toString(36).slice(2)}`;
      const data = await createIncident.mutateAsync({
        reporter_type: form.reporterType,
        volunteer_id: form.volunteerId || undefined,
        incident_date: form.incidentDate,
        incident_time: form.incidentTime || undefined,
        incident_type: form.incidentType,
        location: form.location,
        description: form.description,
        notes: form.notes || undefined,
        survivor_age_group: form.survivorAgeGroup,
        survivor_gender: form.survivorGender,
        submitter_contact: form.submitterContact || undefined,
        offline_id: offlineId,
        ai_status: "pending",
      });
      const incidentId = (data as { id: string }).id;

      // Fire-and-forget AI risk assessment — do not block navigation
      runAutoRiskAssessment(incidentId, {
        incidentType: form.incidentType,
        description: form.description,
        location: form.location,
        survivorAgeGroup: form.survivorAgeGroup,
        survivorGender: form.survivorGender,
      }).catch(() => {});

      // Authenticated users go to dashboard; anonymous reporters go to success page
      const isAuthenticated = !authLoading && user != null;
      if (isAuthenticated) {
        toast.success(t("toast.success"));
        navigate(`/${lng}/dashboard`);
      } else {
        const refId = buildRefId(incidentId);
        navigate(`/${lng}/incidents/success?ref=${refId}`);
      }
    } catch {
      toast.error(t("toast.error"));
    } finally {
      setSubmitting(false);
    }
  };

  const CurrentStepIcon = STEP_ICONS[step - 1];

  return (
    <div className="max-w-lg mx-auto min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-background border-b border-border flex items-center gap-3 px-4 py-3 flex-shrink-0">
        <Button
          variant="ghost"
          size="icon"
          className="h-9 w-9 cursor-pointer"
          onClick={() => (step > 1 ? handleBack() : navigate(`/${lng}`))}
        >
          <ChevronLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2 flex-1">
          <ShieldCheck className="h-5 w-5 text-primary flex-shrink-0" />
          <div>
            <h1 className="text-base font-bold leading-tight">{t("form.title")}</h1>
            <p className="text-sm text-muted-foreground">
              {t("form.step", { current: step, total: stepTitles.length, title: stepTitles[step - 1] })}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1.5">
          <LocaleSwitcher className="hidden sm:inline-flex" />
          <Badge variant="secondary" className="text-sm">
            {step}/{stepTitles.length}
          </Badge>
          {!isOnline && (
            <Badge variant="secondary" className="text-sm bg-amber-100 text-amber-800 border-amber-200">
              {t("common.offline", { ns: "common" })}
            </Badge>
          )}
        </div>
      </div>

      {/* Anonymous notice */}
      <div className="px-4 py-2.5 bg-primary/5 border-b border-primary/10 flex items-center gap-2">
        <ShieldCheck className="h-3.5 w-3.5 text-primary flex-shrink-0" />
        <p className="text-sm text-primary/80 font-medium">
          {t("form.anonymous")}
        </p>
      </div>

      {/* Step indicator */}
      <StepIndicator current={step} stepTitles={stepTitles} />

      {/* Form content */}
      <div className="flex-1 overflow-y-auto">
        {step === 1 && <StepReporter data={form} onChange={update} t={t} />}
        {step === 2 && <StepIncidentType data={form} onChange={update} t={t} />}
        {step === 3 && <StepLocationDesc data={form} onChange={update} t={t} />}
        {step === 4 && <StepSurvivorInfo data={form} onChange={update} t={t} />}
        {step === 5 && <StepReviewSubmit data={form} onChange={update} t={t} />}
      </div>

      {/* Error message */}
      {error && (
        <div className="mx-4 mb-2 px-4 py-3 rounded-xl bg-destructive/10 border border-destructive/20 text-destructive text-sm flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 flex-shrink-0" />
          {error}
        </div>
      )}

      {/* Sticky footer navigation */}
      <div className="sticky bottom-0 bg-background border-t border-border px-4 py-4 flex gap-3 flex-shrink-0">
        {step > 1 && (
          <Button variant="secondary" className="flex-1 cursor-pointer" onClick={handleBack} disabled={submitting}>
            <ChevronLeft className="h-4 w-4 mr-1" /> {t("buttons.back")}
          </Button>
        )}
        {step < stepTitles.length ? (
          <Button className="flex-1 cursor-pointer" onClick={handleNext}>
            {t("buttons.continue")} <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        ) : (
          <Button className="flex-1 cursor-pointer" onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              t("buttons.submitting")
            ) : !isOnline ? (
              <><WifiOff className="h-4 w-4 mr-2" /> {t("buttons.saveOffline")}</>
            ) : (
              <><Send className="h-4 w-4 mr-2" /> {t("buttons.submitReport")}</>
            )}
          </Button>
        )}
      </div>
    </div>
  );
}
