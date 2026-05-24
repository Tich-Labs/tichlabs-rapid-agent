import { Building2, MapPin } from "lucide-react";

const ORG_NAME = import.meta.env.VITE_ORG_NAME ?? "Youth Changers Kenya";
const ORG_LOCATION = import.meta.env.VITE_ORG_LOCATION ?? "Kakamega & Vihiga";

export default function OrgBanner() {
  return (
    <div className="flex items-center gap-2 px-4 py-1.5 bg-primary/5 border-b border-primary/10 text-xs text-muted-foreground">
      <Building2 className="h-3.5 w-3.5 text-primary/60" />
      <span className="font-medium text-foreground/80">{ORG_NAME}</span>
      <span className="text-primary/30">·</span>
      <MapPin className="h-3 w-3 text-primary/50" />
      <span>{ORG_LOCATION}</span>
      <Badge />
    </div>
  );
}

function Badge() {
  return (
    <span className="ml-auto text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground border border-border">
      Demo org
    </span>
  );
}
