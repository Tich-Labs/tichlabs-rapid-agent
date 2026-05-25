import { useState, useCallback, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import {
  Heart,
  Shield,
  Home,
  Stethoscope,
  Scale,
  PhoneCall,
  ArrowLeft,
  AlertTriangle,
  Search,
  Loader2,
  Briefcase,
  SearchX,
  X,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "@/components/locale-switcher.tsx";
import { matchServices as mcpMatchServices, type ServiceMatch } from "@/lib/mcp-client";
import { collection, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ServiceCard, categoryColor, CATEGORY_LABEL, type CategoryConfig, type ServiceCardData } from "@/components/referral/ServiceCard.tsx";
import { QuickPickCard } from "@/components/referral/QuickPickCard.tsx";

type CategoryFilter = "health" | "police" | "shelter" | "psychosocial" | "legal" | "hotline" | "economic_empowerment" | null;
type CountyFilter = "kakamega" | "vihiga" | "nairobi" | null;

interface ReferralService {
  _id: string;
  id?: string;
  name: string;
  category: string;
  county: string;
  description?: string;
  phone?: string;
  address?: string;
  isActive?: boolean;
  is_active?: boolean;
}

const CATEGORIES: (CategoryConfig & { id: CategoryFilter extends infer T ? T : never; subtitle: string })[] = [
  { id: "health" as const, label: "Medical care", subtitle: "Hospitals, clinics, treatment", icon: Stethoscope, color: categoryColor("health") },
  { id: "shelter" as const, label: "Safe shelter", subtitle: "Emergency housing, rescue centres", icon: Home, color: categoryColor("shelter") },
  { id: "psychosocial" as const, label: "Counselling", subtitle: "Emotional support, trauma care", icon: Heart, color: categoryColor("psychosocial") },
  { id: "hotline" as const, label: "Hotlines", subtitle: "Free crisis lines, 24/7 support", icon: PhoneCall, color: categoryColor("hotline") },
  { id: "police" as const, label: "Police", subtitle: "Report incident, get protection", icon: Shield, color: categoryColor("police") },
  { id: "legal" as const, label: "Legal help", subtitle: "Free legal aid, justice support", icon: Scale, color: categoryColor("legal") },
  { id: "economic_empowerment" as const, label: "Livelihood support", subtitle: "Skills training, financial independence", icon: Briefcase, color: categoryColor("economic_empowerment") },
];

const QUICK_PICK_IDS = ["health", "shelter", "psychosocial", "hotline"];

const COUNTIES = ["kakamega", "vihiga", "nairobi"] as const;

const SEARCH_SUGGESTIONS = [
  "I need a safe place to stay",
  "I need medical attention",
  "Someone to talk to",
  "I want to report an incident",
];

function normalizePhoneForFreeCall(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  return /^(0800|116|1195|1199|999|112|1508|1519|1190|1198|21661)/.test(cleaned) || /^\d{1,5}$/.test(cleaned);
}

export default function ReferralDirectoryPage() {
  const navigate = useNavigate();
  const { lng } = useParams<{ lng: string }>();
  const { t } = useTranslation("referral");
  const { t: tc } = useTranslation("common");

  const [selectedCategory, setSelectedCategory] = useState<CategoryFilter>(null);
  const [selectedCounty, setSelectedCounty] = useState<CountyFilter>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [aiMatches, setAiMatches] = useState<ServiceMatch[] | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout>>();

  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [emergencyExpanded, setEmergencyExpanded] = useState(false);
  const [showMorePicks, setShowMorePicks] = useState(false);

  const [services, setServices] = useState<ReferralService[] | undefined>(undefined);
  const [loadError, setLoadError] = useState<string | null>(null);

  useEffect(() => {
    setLoadError(null);
    getDocs(collection(db, "referral_services"))
      .then((snap) => {
        const docs = snap.docs.map((d) => ({ _id: d.id, ...d.data() } as ReferralService));
        setServices(docs);
      })
      .catch((err) => {
        setLoadError(err instanceof Error ? err.message : String(err));
        setServices([]);
      });
  }, []);

  const isLoading = services === undefined;

  const filteredServices = ((services ?? []) as ReferralService[]).filter((s) => {
    if (s.isActive === false || s.is_active === false) return false;
    return true;
  });

  const countyFiltered = selectedCounty
    ? filteredServices.filter((s) => s.county?.toLowerCase() === selectedCounty)
    : filteredServices;

  const categoryFiltered = selectedCategory
    ? countyFiltered.filter((s) => s.category === selectedCategory)
    : countyFiltered;

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);
      if (query.length < 3) { setAiMatches(null); return; }
      debounceRef.current = setTimeout(async () => {
        try {
          setAiLoading(true);
          const result = await mcpMatchServices({
            incidentType: selectedCategory ?? "other",
            location: selectedCounty ?? "",
            description: query,
            limit: 10,
          });
          setAiMatches(result.matches ?? []);
        } catch { setAiMatches(null); }
        finally { setAiLoading(false); }
      }, 600);
    },
    [selectedCategory, selectedCounty]
  );

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const displayServices = aiMatches && aiMatches.length > 0
    ? aiMatches.map((m): ServiceCardData => ({
        _id: m.serviceId,
        name: m.name,
        category: m.category,
        county: m.county,
        description: m.description,
        phone: m.phone,
        _aiMatch: m,
      }))
    : categoryFiltered.map((s): ServiceCardData => ({
        _id: s._id,
        name: s.name,
        category: s.category,
        county: s.county,
        description: s.description,
        phone: s.phone,
      }));

  const aiActive = aiMatches !== null && aiMatches.length > 0;
  const hasActiveFilters = selectedCategory !== null || selectedCounty !== null;
  const filterCount = (selectedCategory ? 1 : 0) + (selectedCounty ? 1 : 0);

  const freeCallCount = displayServices.filter((s) => s.phone && normalizePhoneForFreeCall(s.phone)).length;

  const visiblePicks = showMorePicks ? CATEGORIES : CATEGORIES.filter((c) => QUICK_PICK_IDS.includes(c.id));

  function handleCategoryPick(catId: string) {
    setSelectedCategory(selectedCategory === catId ? null : catId);
    setAiMatches(null);
  }

  function clearAll() {
    setSelectedCategory(null);
    setSelectedCounty(null);
    setSearchQuery("");
    setAiMatches(null);
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-3 py-2.5 flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-8 w-8 cursor-pointer" onClick={() => navigate(`/${lng}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h1 className="flex-1 text-base font-bold leading-tight truncate">Find Help</h1>
          <span className="inline-flex items-center rounded-full px-2 py-0.5 text-sm font-medium bg-muted border border-border">
            {displayServices.length}
          </span>
          <LocaleSwitcher className="hidden sm:inline-flex" />
        </div>
      </header>

      {/* Emergency — collapsed row, tap to expand */}
      <button
        onClick={() => setEmergencyExpanded(!emergencyExpanded)}
        className="w-full flex items-center gap-2 px-4 py-2.5 bg-destructive/10 border-b border-destructive/20 text-sm text-destructive cursor-pointer"
        aria-expanded={emergencyExpanded}
      >
        <AlertTriangle className="h-4 w-4 flex-shrink-0" />
        <span className="flex-1 text-left font-medium">
          Emergency? Police <a href="tel:999" className="underline">999</a> · GBV Helpline <a href="tel:1195" className="underline">1195</a>
        </span>
        {emergencyExpanded ? <ChevronUp className="h-4 w-4 flex-shrink-0" /> : <ChevronDown className="h-4 w-4 flex-shrink-0" />}
      </button>
      {emergencyExpanded && (
        <div className="px-4 py-3 bg-destructive/5 border-b border-destructive/20 text-sm text-destructive">
          <p className="font-semibold mb-1">In immediate danger?</p>
          <p>Call <a href="tel:999" className="underline font-medium">999</a> (police) or <a href="tel:1195" className="underline font-medium">1195</a> (GBV helpline).</p>
          <p className="mt-1 text-destructive/70">Free · 24/7 · Confidential · No questions asked</p>
          <p className="mt-2 text-destructive/70 text-sm">
            If you cannot speak: text a trusted person, or visit the nearest police station or hospital.
          </p>
        </div>
      )}

      {/* Reassurance line */}
      <div className="text-center px-4 py-2.5 text-sm text-muted-foreground bg-muted/20 border-b border-border">
        You are not alone. These services are here to help. No sign-in required. Everything is anonymous.
      </div>

      <div className="max-w-5xl mx-auto px-3 py-5">
        {/* ─── SEARCH ─── */}
        <div className="mb-5">
          <div className="relative">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="What kind of help do you need?"
              inputMode="text"
              autoComplete="off"
              enterKeyHint="search"
              className="w-full pl-11 pr-4 py-3.5 rounded-xl border border-border bg-card text-base focus:outline-none focus:ring-2 focus:ring-primary"
            />
            {aiLoading && (
              <Loader2 className="absolute right-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary animate-spin" />
            )}
          </div>

          {/* Search suggestion chips */}
          {searchQuery.length === 0 && !aiActive && (
            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-sm text-muted-foreground self-center">Try:</span>
              {SEARCH_SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => handleSearch(s)}
                  className="px-3 py-1.5 rounded-full text-sm border border-border bg-muted/30 text-muted-foreground hover:bg-muted hover:text-foreground cursor-pointer transition-colors"
                >
                  {s}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* ─── QUICK PICKS ─── */}
        <div className="mb-4">
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2 sm:gap-3">
            {visiblePicks.map((cat) => (
              <QuickPickCard
                key={cat.id}
                icon={cat.icon}
                label={cat.label}
                subtitle={cat.subtitle}
                colorBar={cat.color.bar}
                selected={selectedCategory === cat.id}
                onClick={() => handleCategoryPick(cat.id)}
              />
            ))}
          </div>
          <button
            onClick={() => setShowMorePicks(!showMorePicks)}
            className="mt-3 text-sm text-primary hover:underline cursor-pointer"
          >
            {showMorePicks ? "− Show fewer" : "+ Also show: Police, Legal help, Livelihood support"}
          </button>
        </div>

        {/* ─── COUNTY ─── */}
        <div className="flex items-center gap-2 mb-4">
          <MapPin className="h-4 w-4 text-muted-foreground/60 flex-shrink-0" />
          {COUNTIES.map((c) => (
            <button
              key={c}
              onClick={() => { setSelectedCounty(selectedCounty === c ? null : c); setAiMatches(null); }}
              className={cn(
                "px-3 py-1 rounded-full text-sm transition-colors cursor-pointer capitalize",
                selectedCounty === c
                  ? "bg-primary/10 text-primary font-medium"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
            >
              {c}
            </button>
          ))}
        </div>

        {/* Mobile filter button — only when filters are active */}
        {filterCount > 0 && (
          <div className="md:hidden mb-3">
            <button
              onClick={() => setMobileFilterOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-lg border border-border bg-card text-sm font-medium cursor-pointer hover:bg-muted/50 transition-colors"
            >
              <Filter className="h-4 w-4" />
              Filters · {filterCount}
            </button>
          </div>
        )}

        {/* ─── RESULTS HEADER ─── */}
        <div className="flex items-center gap-2 mb-4 text-sm text-muted-foreground">
          {aiActive ? (
            <span>{displayServices.length} results for your search</span>
          ) : hasActiveFilters ? (
            <>
              <span>
                {displayServices.length} {CATEGORY_LABEL[selectedCategory!] ?? "service"}{displayServices.length !== 1 ? "s" : ""}
                {selectedCounty && ` in ${selectedCounty.charAt(0).toUpperCase() + selectedCounty.slice(1)}`}
              </span>
              <button onClick={clearAll} className="text-primary hover:underline cursor-pointer text-sm">Clear</button>
            </>
          ) : (
            <span>{displayServices.length} services near you · {freeCallCount} free helplines</span>
          )}
        </div>

        {/* ─── ERROR ─── */}
        {loadError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive mb-4">
            Unable to load services. Please try again, or call <a href="tel:1195" className="underline font-medium">1195</a> for immediate help.
          </div>
        )}

        {/* ─── LOADING ─── */}
        {isLoading && (
          <div>
            <p className="text-sm text-muted-foreground text-center mb-4">Finding services that match your needs...</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="rounded-xl border border-border p-4 space-y-3">
                  <Skeleton className="h-5 w-3/4" />
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-12 w-full rounded-xl" />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ─── EMPTY ─── */}
        {!isLoading && displayServices.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-4">
              <SearchX className="h-10 w-10 text-muted-foreground/50" />
            </div>
            <p className="text-base font-semibold">Nothing matched your search</p>
            <p className="text-sm text-muted-foreground mt-1 mb-4">
              Try describing your situation differently, or browse all 176 services below
            </p>
            <Button variant="outline" onClick={clearAll} className="cursor-pointer">
              Browse all services
            </Button>
          </div>
        )}

        {/* ─── CARD GRID ─── */}
        {!isLoading && displayServices.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {displayServices.map((service) => (
              <ServiceCard
                key={service._id}
                service={service}
                categoryCfg={CATEGORIES.find((c) => c.id === service.category)}
              />
            ))}
          </div>
        )}
      </div>

      {/* ─── MOBILE BOTTOM SHEET ─── */}
      {mobileFilterOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <div className="absolute inset-0 bg-black/50" onClick={() => setMobileFilterOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 bg-background rounded-t-2xl max-h-[70vh] overflow-y-auto shadow-xl">
            <div className="sticky top-0 bg-background border-b border-border px-4 py-3 flex items-center justify-between">
              <h2 className="font-semibold">Filters</h2>
              <button onClick={() => setMobileFilterOpen(false)} className="p-1 cursor-pointer">
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="p-4 space-y-5">
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">County</p>
                <div className="flex flex-wrap gap-2">
                  {COUNTIES.map((c) => (
                    <button
                      key={c}
                      onClick={() => setSelectedCounty(selectedCounty === c ? null : c)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer capitalize",
                        selectedCounty === c
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">Service type</p>
                <div className="flex flex-wrap gap-2">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat.id}
                      onClick={() => handleCategoryPick(cat.id)}
                      className={cn(
                        "px-3 py-1.5 rounded-full text-sm font-medium border transition-colors cursor-pointer",
                        selectedCategory === cat.id
                          ? "bg-primary/10 text-primary border-primary/30"
                          : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                      )}
                    >
                      <cat.icon className="h-3 w-3 inline mr-1" />
                      {cat.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="sticky bottom-0 bg-background border-t border-border px-4 py-3 flex items-center gap-3">
              <button onClick={clearAll} className="text-sm text-muted-foreground hover:text-foreground cursor-pointer">
                Clear all
              </button>
              <Button onClick={() => setMobileFilterOpen(false)} className="flex-1 cursor-pointer">
                Show results
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
