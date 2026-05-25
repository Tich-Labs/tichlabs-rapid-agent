import { Phone } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import type { ServiceMatch } from "@/lib/mcp-client";

export interface ServiceCardData {
  _id: string;
  name: string;
  category: string;
  county: string;
  description?: string;
  phone?: string;
  _aiMatch?: ServiceMatch;
}

interface ServiceCardProps {
  service: ServiceCardData;
  categoryCfg?: CategoryConfig;
}

export interface CategoryConfig {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  color: {
    bg: string;
    text: string;
    border: string;
    bar: string;
  };
}

export const CATEGORY_LABEL: Record<string, string> = {
  health: "Medical care",
  police: "Police & reporting",
  shelter: "Safe shelter",
  psychosocial: "Counselling & support",
  legal: "Legal help",
  hotline: "Crisis hotline",
  economic_empowerment: "Livelihood support",
};

const FREE_CALL_PATTERN = /^(0800|116|1195|1199|999|112|1508|1519|1190|1198|21661)/;
const SHORT_CODE_PATTERN = /^\d{1,5}$/;

function isFreeCall(phone: string): boolean {
  const cleaned = phone.replace(/\s/g, "");
  return FREE_CALL_PATTERN.test(cleaned) || SHORT_CODE_PATTERN.test(cleaned);
}

export function categoryColor(cat: string): CategoryConfig["color"] {
  switch (cat) {
    case "health":       return { bg: "bg-teal-100", text: "text-teal-700", border: "border-teal-200", bar: "bg-teal-500" };
    case "police":       return { bg: "bg-blue-100", text: "text-blue-700", border: "border-blue-200", bar: "bg-blue-500" };
    case "shelter":      return { bg: "bg-amber-100", text: "text-amber-700", border: "border-amber-200", bar: "bg-amber-500" };
    case "psychosocial": return { bg: "bg-purple-100", text: "text-purple-700", border: "border-purple-200", bar: "bg-purple-500" };
    case "legal":        return { bg: "bg-indigo-100", text: "text-indigo-700", border: "border-indigo-200", bar: "bg-indigo-500" };
    case "economic_empowerment": return { bg: "bg-green-100", text: "text-green-700", border: "border-green-200", bar: "bg-green-500" };
    case "hotline":      return { bg: "bg-red-100", text: "text-red-700", border: "border-red-200", bar: "bg-red-500" };
    default:             return { bg: "bg-muted", text: "text-muted-foreground", border: "border-border", bar: "bg-muted-foreground" };
  }
}

export function ServiceCard({ service, categoryCfg }: ServiceCardProps) {
  const phone = service.phone;
  const free = phone ? isFreeCall(phone) : false;
  const colors = categoryCfg?.color ?? categoryColor(service.category);
  const isHotline = service.category === "hotline";

  return (
    <div className="flex flex-col h-full rounded-xl border border-border bg-card hover:border-primary/20 transition-colors overflow-hidden">
      <div className="flex gap-0 h-full">
        <div className={cn("w-1.5 flex-shrink-0", isHotline ? "bg-red-500" : colors.bar)} />
        <div className="flex-1 flex flex-col p-4 pl-3 min-w-0">
          <h3 className="font-bold text-base leading-snug mb-0.5">{service.name}</h3>
          <p className="text-sm text-muted-foreground">
            {CATEGORY_LABEL[service.category] ?? service.category}
          </p>
          {service.description && (
            <p className="text-sm text-muted-foreground/80 mt-2 leading-relaxed line-clamp-2">
              {service.description}
            </p>
          )}
          <div className="mt-auto pt-3 flex flex-col gap-2">
            {phone && (
              <a
                href={`tel:${phone.replace(/\s/g, "")}`}
                className={cn(
                  "flex items-center justify-center gap-1.5 w-full px-4 py-3 rounded-xl text-sm font-semibold transition-colors cursor-pointer min-h-[48px]",
                  free
                    ? "bg-green-600 text-white hover:bg-green-700"
                    : "bg-primary text-primary-foreground hover:bg-primary/90"
                )}
              >
                <Phone className="h-4 w-4 flex-shrink-0" />
                {free ? "Free · 24/7" : `Call ${phone}`}
              </a>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
