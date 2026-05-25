import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils.ts";

interface QuickPickCardProps {
  icon: LucideIcon;
  label: string;
  subtitle: string;
  colorBar: string;
  selected: boolean;
  onClick: () => void;
}

export function QuickPickCard({ icon: Icon, label, subtitle, colorBar, selected, onClick }: QuickPickCardProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center gap-2 p-2.5 sm:p-3 rounded-xl border-2 transition-all cursor-pointer w-full text-left",
        selected
          ? "border-primary bg-primary/5 shadow-sm"
          : "border-border bg-card hover:border-primary/30 hover:bg-muted/20"
      )}
    >
      <div className={cn("w-1 self-stretch rounded-full flex-shrink-0", colorBar)} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground flex-shrink-0" />
          <span className="font-semibold text-sm sm:text-base">{label}</span>
        </div>
        <p className="hidden sm:block text-sm text-muted-foreground mt-0.5">{subtitle}</p>
      </div>
    </button>
  );
}
