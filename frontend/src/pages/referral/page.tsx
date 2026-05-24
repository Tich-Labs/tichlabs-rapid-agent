import { useState, useCallback, useRef, useEffect } from "react";
import { Badge } from "@/components/ui/badge.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { cn } from "@/lib/utils.ts";
import {
  Heart,
  Shield,
  Home,
  Brain,
  Scale,
  Phone,
  MapPin,
  ArrowLeft,
  Info,
  AlertTriangle,
  Search,
  Sparkles,
  Loader2,
  Headphones,
  Briefcase,
} from "lucide-react";
import { useNavigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import LocaleSwitcher from "@/components/locale-switcher.tsx";
import { useFirestoreQuery } from "@/hooks/use-firestore-query";
import { listDocuments } from "@/lib/firestore";
import { matchServices as mcpMatchServices, type ServiceMatch } from "@/lib/mcp-client";

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

  const CATEGORIES = [
    { id: "health" as const, label: t("categories.health"), icon: Heart, color: "bg-red-100 text-red-700 border-red-200", description: t("categories.healthDesc") },
    { id: "police" as const, label: t("categories.police"), icon: Shield, color: "bg-blue-100 text-blue-700 border-blue-200", description: t("categories.policeDesc") },
    { id: "shelter" as const, label: t("categories.shelter"), icon: Home, color: "bg-amber-100 text-amber-700 border-amber-200", description: t("categories.shelterDesc") },
    { id: "psychosocial" as const, label: t("categories.psychosocial"), icon: Brain, color: "bg-purple-100 text-purple-700 border-purple-200", description: t("categories.psychosocialDesc") },
    { id: "legal" as const, label: t("categories.legal"), icon: Scale, color: "bg-green-100 text-green-700 border-green-200", description: t("categories.legalDesc") },
    { id: "hotline" as const, label: t("categories.hotline"), icon: Headphones, color: "bg-pink-100 text-pink-700 border-pink-200", description: t("categories.hotlineDesc") },
    { id: "economic_empowerment" as const, label: t("categories.economicEmpowerment"), icon: Briefcase, color: "bg-teal-100 text-teal-700 border-teal-200", description: t("categories.economicEmpowermentDesc") },
  ];

  const COUNTIES = [
    { id: "kakamega" as const, label: t("counties.kakamega") },
    { id: "vihiga" as const, label: t("counties.vihiga") },
    { id: "nairobi" as const, label: t("counties.nairobi") },
  ];

  const { data: services } = useFirestoreQuery(
    ["firestore", "referral-services"],
    () => listDocuments<ReferralService>("referral_services")
  );

  const isLoading = services === undefined;

  const filteredServices = ((services ?? []) as ReferralService[]).filter((s) => {
    if (s.isActive === false || s.is_active === false) return false;
    return true;
  });

  const countyFiltered = selectedCounty
    ? filteredServices.filter((s) => s.county?.toLowerCase() === selectedCounty)
    : filteredServices;

  const handleSearch = useCallback(
    (query: string) => {
      setSearchQuery(query);
      if (debounceRef.current) clearTimeout(debounceRef.current);

      if (query.length < 3) {
        setAiMatches(null);
        return;
      }

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
        } catch {
          setAiMatches(null);
        } finally {
          setAiLoading(false);
        }
      }, 600);
    },
    [selectedCategory, selectedCounty]
  );

  useEffect(() => {
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, []);

  const displayServices = aiMatches && aiMatches.length > 0
    ? aiMatches.map((m): ReferralService & { _aiMatch?: ServiceMatch } => ({
        _id: m.serviceId,
        id: m.serviceId,
        name: m.name,
        category: m.category,
        county: m.county,
        description: m.description,
        phone: m.phone,
        address: m.address,
        _aiMatch: m,
      }))
    : countyFiltered;

  const aiActive = aiMatches !== null && aiMatches.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur border-b border-border">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            className="h-9 w-9 cursor-pointer"
            onClick={() => navigate(`/${lng}`)}
          >
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-sm font-bold leading-tight">{t("header.title")}</h1>
            <p className="text-xs text-muted-foreground">{t("header.subtitle")}</p>
          </div>
          <LocaleSwitcher className="hidden sm:inline-flex" />
          <Badge variant="secondary" className="text-xs">
            {aiActive ? `${aiMatches!.length}` : countyFiltered.length} {tc("common.services")}
          </Badge>
        </div>
      </header>

      {/* Emergency banner */}
      <div className="bg-destructive/10 border-b border-destructive/20 px-4 py-3">
        <div className="max-w-5xl mx-auto flex items-start gap-2.5">
          <AlertTriangle className="h-4 w-4 text-destructive flex-shrink-0 mt-0.5" />
          <div className="text-xs text-destructive leading-relaxed">
            <strong>{t("emergency.title")}</strong>{" "}
            <span dangerouslySetInnerHTML={{ __html: t("emergency.body") }} />
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-6">
        {/* Pathway info box */}
        <div className="flex items-start gap-2.5 px-4 py-3 rounded-xl border border-primary/20 bg-primary/5 text-primary text-sm mb-6">
          <Info className="h-4 w-4 flex-shrink-0 mt-0.5" />
          <div className="leading-relaxed text-xs">
            <strong>{t("pathway.title")}</strong> {t("pathway.body")}
          </div>
        </div>

        {/* Filters */}
        <div className="space-y-4 mb-6">
          {/* County filter */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{t("filter.county")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCounty(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                  selectedCounty === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {tc("common.allCounties")}
              </button>
              {COUNTIES.map((county) => (
                <button
                  key={county.id}
                  onClick={() => setSelectedCounty(selectedCounty === county.id ? null : county.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                    selectedCounty === county.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  {county.label}
                </button>
              ))}
            </div>
          </div>

          {/* Category filter */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{t("filter.serviceType")}</p>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedCategory(null)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                  selectedCategory === null
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                )}
              >
                {tc("common.allTypes")}
              </button>
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategory(selectedCategory === cat.id ? null : cat.id)}
                  className={cn(
                    "px-3 py-1.5 rounded-full text-xs font-medium border transition-colors cursor-pointer",
                    selectedCategory === cat.id
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-muted/50 text-muted-foreground border-border hover:bg-muted"
                  )}
                >
                  <cat.icon className="h-3 w-3 inline mr-1" />
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Search input */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2 uppercase tracking-wide">{t("search.label")}</p>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                placeholder={t("search.placeholder")}
                className="w-full pl-9 pr-10 py-2.5 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary"
              />
              {aiLoading && (
                <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-primary animate-spin" />
              )}
            </div>
          </div>
        </div>

        {/* AI label */}
        {aiActive && (
          <div className="flex items-center gap-1.5 mb-3 text-xs text-primary">
            <Sparkles className="h-3.5 w-3.5" />
            Matched by Gemini 2.5
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        ) : displayServices.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mb-3">
              <Search className="h-5 w-5 text-muted-foreground" />
            </div>
            <p className="text-sm font-medium">{t("empty.title")}</p>
            <p className="text-xs text-muted-foreground mt-1">{t("empty.subtitle")}</p>
          </div>
        ) : aiActive ? (
          <div className="grid gap-2">
            {(displayServices as (ReferralService & { _aiMatch?: ServiceMatch })[]).map((service) => {
              const m = service._aiMatch;
              const catCfg = CATEGORIES.find((c) => c.id === service.category);
              const Icon = catCfg?.icon ?? Info;
              const colorClasses = catCfg?.color ?? "bg-muted text-muted-foreground border-border";
              return (
                <div
                  key={service._id}
                  className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
                >
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", colorClasses.split(" ")[0])}>
                    <Icon className={cn("h-4 w-4", colorClasses.split(" ")[1])} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{service.name}</p>
                      <Badge variant="secondary" className="text-[10px] capitalize flex-shrink-0">
                        {service.county}
                      </Badge>
                      {m && (
                        <span className="text-[10px] text-primary font-medium flex-shrink-0">
                          {m.relevanceScore}/100
                        </span>
                      )}
                    </div>
                    {service.description && (
                      <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{service.description}</p>
                    )}
                    {m?.reasoning && (
                      <p className="text-xs text-primary/70 mt-0.5 italic">{m.reasoning}</p>
                    )}
                    <div className="flex items-center gap-3 mt-1.5">
                      {service.phone && (
                        <a
                          href={`tel:${service.phone.replace(/\s/g, "")}`}
                          className="flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                        >
                          <Phone className="h-3 w-3" />
                          {service.phone}
                        </a>
                      )}
                      {service.address && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                          <MapPin className="h-3 w-3" />
                          {service.address}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="space-y-3">
            {CATEGORIES.filter((cat) => !selectedCategory || selectedCategory === cat.id).map((cat) => {
              const catServices = (displayServices as ReferralService[]).filter((s) => s.category === cat.id);
              if (catServices.length === 0) return null;
              const CatIcon = cat.icon;

              return (
                <div key={cat.id} className="mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <div className={cn("w-7 h-7 rounded-lg flex items-center justify-center", cat.color.split(" ")[0])}>
                      <CatIcon className={cn("h-3.5 w-3.5", cat.color.split(" ")[1])} />
                    </div>
                    <div>
                      <h3 className="text-sm font-semibold">{cat.label}</h3>
                      <p className="text-xs text-muted-foreground">{cat.description}</p>
                    </div>
                    <Badge variant="secondary" className="ml-auto text-xs">
                      {catServices.length}
                    </Badge>
                  </div>

                  <div className="grid gap-2">
                    {catServices.map((service) => (
                      <div
                        key={service._id}
                        className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:border-primary/20 transition-colors"
                      >
                        <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5", cat.color.split(" ")[0])}>
                          <CatIcon className={cn("h-4 w-4", cat.color.split(" ")[1])} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-medium truncate">{service.name}</p>
                            <Badge variant="secondary" className="text-[10px] capitalize flex-shrink-0">
                              {service.county}
                            </Badge>
                          </div>
                          {service.description && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{service.description}</p>
                          )}
                          <div className="flex items-center gap-3 mt-1.5">
                            {service.phone && (
                              <a
                                href={`tel:${service.phone.replace(/\s/g, "")}`}
                                className="flex items-center gap-1 text-xs text-primary font-medium hover:underline cursor-pointer"
                              >
                                <Phone className="h-3 w-3" />
                                {service.phone}
                              </a>
                            )}
                            {service.address && (
                              <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                <MapPin className="h-3 w-3" />
                                {service.address}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
