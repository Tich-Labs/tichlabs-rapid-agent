import { useState, useCallback, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import { Download, AlertTriangle, FileText, TrendingUp, Activity } from "lucide-react";
import { cn } from "@/lib/utils.ts";
import { useSupabaseQuery } from "@/hooks/use-supabase-query";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-components";

// ─── Label maps ──────────────────────────────────────────────────────────────

const INCIDENT_TYPE_LABELS: Record<string, string> = {
  physical_abuse: "Physical Abuse",
  sexual_abuse: "Sexual Abuse",
  emotional_abuse: "Emotional Abuse",
  neglect: "Neglect",
  bullying_harassment: "Bullying / Harassment",
  substance_abuse: "Substance Abuse",
  domestic_violence: "Domestic Violence",
  child_labor: "Child Labor",
  child_exploitation: "Child Exploitation",
  missing_child: "Missing Child",
  tech_enabled_abuse: "Tech-Enabled Abuse",
  other: "Other",
};

const STATUS_LABELS: Record<string, string> = {
  new: "New",
  assigned: "Assigned",
  pfa_in_progress: "PFA In Progress",
  under_review: "Under Review",
  escalated: "Escalated",
  resolved: "Resolved",
  closed: "Closed",
};

const AGE_GROUP_LABELS: Record<string, string> = {
  under_10: "Under 10",
  "10_14": "10–14",
  "15_18": "15–18",
  "18_22": "18–22",
  "23_27": "23–27",
  "28_35": "28–35",
  "35_plus": "35+",
  "18_plus": "18+",
  unknown: "Unknown",
};

const GENDER_LABELS: Record<string, string> = {
  male: "Male",
  female: "Female",
  other: "Other",
  prefer_not_to_say: "Not Specified",
};

const CHART_COLORS = [
  "#c0392b",
  "#e67e22",
  "#f39c12",
  "#2ecc71",
  "#3498db",
  "#9b59b6",
  "#1abc9c",
  "#e74c3c",
  "#34495e",
  "#95a5a6",
];

// ─── Date helpers ─────────────────────────────────────────────────────────────

function formatDate(date: Date): string {
  return date.toISOString().split("T")[0];
}

type Preset = "week" | "month" | "3months" | "6months" | "year" | "custom";

function getPresetRange(preset: Preset): { from: string; to: string } {
  const today = new Date();
  const to = formatDate(today);

  switch (preset) {
    case "week": {
      const d = new Date(today);
      d.setDate(d.getDate() - 7);
      return { from: formatDate(d), to };
    }
    case "month": {
      return { from: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
    }
    case "3months": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 3);
      return { from: formatDate(d), to };
    }
    case "6months": {
      const d = new Date(today);
      d.setMonth(d.getMonth() - 6);
      return { from: formatDate(d), to };
    }
    case "year": {
      return { from: formatDate(new Date(today.getFullYear(), 0, 1)), to };
    }
    default:
      return { from: formatDate(new Date(today.getFullYear(), today.getMonth(), 1)), to };
  }
}

// ─── Chart helpers ────────────────────────────────────────────────────────────

function recordToChartData(
  record: Record<string, number>,
  labelMap: Record<string, string>
) {
  return Object.entries(record)
    .map(([key, value]) => ({ name: labelMap[key] ?? key, value }))
    .sort((a, b) => b.value - a.value);
}

// ─── CSV helpers ──────────────────────────────────────────────────────────────

type ExportRow = {
  ref: string;
  incidentDate: string;
  incidentTime: string;
  incidentType: string;
  location: string;
  survivorAgeGroup: string;
  survivorGender: string;
  status: string;
  isEscalated: boolean;
  escalatedAt: string;
  resolvedAt: string;
};

function generateAndDownloadCSV(rows: ExportRow[], filename: string) {
  const headers = [
    "Reference",
    "Date",
    "Time",
    "Type",
    "Location",
    "Survivor Age Group",
    "Survivor Gender",
    "Status",
    "Escalated",
    "Escalated At",
    "Resolved At",
  ];

  const dataRows = rows.map((r) => [
    r.ref,
    r.incidentDate,
    r.incidentTime,
    INCIDENT_TYPE_LABELS[r.incidentType] ?? r.incidentType,
    r.location,
    AGE_GROUP_LABELS[r.survivorAgeGroup] ?? r.survivorAgeGroup,
    GENDER_LABELS[r.survivorGender] ?? r.survivorGender,
    STATUS_LABELS[r.status] ?? r.status,
    r.isEscalated ? "Yes" : "No",
    r.escalatedAt,
    r.resolvedAt,
  ]);

  const csvContent = [headers, ...dataRows]
    .map((row) =>
      row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(",")
    )
    .join("\n");

  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

// ─── Inner component (authenticated + authorized) ─────────────────────────────

function ReportsPageInner() {
  const today = new Date();
  const [preset, setPreset] = useState<Preset>("month");
  const [customFrom, setCustomFrom] = useState(
    formatDate(new Date(today.getFullYear(), today.getMonth(), 1))
  );
  const [customTo, setCustomTo] = useState(formatDate(today));

  const dateRange = useMemo(
    () =>
      preset === "custom"
        ? { from: customFrom, to: customTo }
        : getPresetRange(preset),
    [preset, customFrom, customTo]
  );

  const reportData = useSupabaseQuery();
  const exportData = useSupabaseQuery();
  const userProfile = useSupabaseQuery();

  const handleExportCSV = useCallback(() => {
    if (!exportData || exportData.length === 0) return;
    generateAndDownloadCSV(exportData as ExportRow[], `tichlabs-incidents-${dateRange.from}-to-${dateRange.to}.csv`);
  }, [exportData, dateRange]);

  // Access guard — only program leads and executive directors
  if (
    userProfile !== undefined &&
    userProfile !== null &&
    (userProfile.role === "pending" ||
      userProfile.role === "volunteer" ||
      userProfile.role === "counselor")
  ) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center px-4">
        <AlertTriangle className="w-12 h-12 text-muted-foreground" />
        <h2 className="text-xl font-bold">Access Restricted</h2>
        <p className="text-muted-foreground max-w-sm">
          Reports are available to Program Leads and Executive Directors only.
        </p>
      </div>
    );
  }

  const byTypeData = reportData
    ? recordToChartData(reportData.byType, INCIDENT_TYPE_LABELS)
    : [];
  const byStatusData = reportData
    ? recordToChartData(reportData.byStatus, STATUS_LABELS)
    : [];
  const byAgeData = reportData
    ? recordToChartData(reportData.byAgeGroup, AGE_GROUP_LABELS)
    : [];
  const byGenderData = reportData
    ? recordToChartData(reportData.byGender, GENDER_LABELS)
    : [];
  const byMonthData = reportData
    ? Object.entries(reportData.byMonth)
        .map(([month, count]) => ({ month, count }))
        .sort((a, b) => a.month.localeCompare(b.month))
    : [];

  const presets: { value: Preset; label: string }[] = [
    { value: "week", label: "Last 7 days" },
    { value: "month", label: "This Month" },
    { value: "3months", label: "Last 3 Months" },
    { value: "6months", label: "Last 6 Months" },
    { value: "year", label: "This Year" },
    { value: "custom", label: "Custom Range" },
  ];

  return (
    <div className="p-4 md:p-6 space-y-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Reports & Analytics</h1>
          <p className="text-sm text-muted-foreground">
            Fully anonymized — no personal information is included in exports.
          </p>
        </div>
        <Button
          onClick={handleExportCSV}
          disabled={!exportData || exportData.length === 0}
          size="sm"
          className="gap-2"
        >
          <Download className="w-4 h-4" />
          Export CSV
        </Button>
      </div>

      {/* Date Range Filter */}
      <Card>
        <CardContent className="pt-4 pb-4">
          <div className="flex flex-wrap gap-2 mb-3">
            {presets.map((p) => (
              <button
                key={p.value}
                onClick={() => setPreset(p.value)}
                className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium transition-colors border",
                  preset === p.value
                    ? "bg-primary text-primary-foreground border-primary"
                    : "bg-transparent text-muted-foreground border-border hover:bg-accent"
                )}
              >
                {p.label}
              </button>
            ))}
          </div>

          {preset === "custom" ? (
            <div className="flex flex-col sm:flex-row gap-3 mt-2">
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">From</label>
                <input
                  type="date"
                  value={customFrom}
                  max={customTo}
                  onChange={(e) => setCustomFrom(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
              <div className="flex-1">
                <label className="text-xs text-muted-foreground block mb-1">To</label>
                <input
                  type="date"
                  value={customTo}
                  min={customFrom}
                  onChange={(e) => setCustomTo(e.target.value)}
                  className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-primary"
                />
              </div>
            </div>
          ) : (
            <p className="text-xs text-muted-foreground">
              Showing data from <strong>{dateRange.from}</strong> to{" "}
              <strong>{dateRange.to}</strong>
            </p>
          )}
        </CardContent>
      </Card>

      {/* Summary Stats */}
      {reportData === undefined ? (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-xl" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {(
            [
              {
                label: "Total Incidents",
                value: reportData.total,
                icon: FileText,
                color: "text-primary",
              },
              {
                label: "Escalated",
                value: reportData.escalated,
                icon: AlertTriangle,
                color: "text-destructive",
              },
              {
                label: "Resolved",
                value: reportData.resolved,
                icon: TrendingUp,
                color: "text-green-600",
              },
              {
                label: "In Progress",
                value:
                  reportData.total -
                  reportData.resolved -
                  (reportData.byStatus["new"] ?? 0),
                icon: Activity,
                color: "text-amber-600",
              },
            ] as const
          ).map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="pt-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs text-muted-foreground">{label}</p>
                    <p className={cn("text-3xl font-bold mt-1", color)}>{value}</p>
                  </div>
                  <Icon className={cn("w-5 h-5 mt-1", color)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Charts */}
      {reportData === undefined ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-64 w-full rounded-xl" />
          ))}
        </div>
      ) : reportData.total === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-16 gap-3">
            <FileText className="w-10 h-10 text-muted-foreground" />
            <p className="text-muted-foreground text-sm">
              No incidents recorded in this period.
            </p>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Incident Type */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Incidents by Type</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={byTypeData}
                    layout="vertical"
                    margin={{ left: 8, right: 20, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 11 }} allowDecimals={false} />
                    <YAxis
                      dataKey="name"
                      type="category"
                      tick={{ fontSize: 10 }}
                      width={140}
                    />
                    <Tooltip />
                    <Bar dataKey="value" fill={CHART_COLORS[0]} radius={[0, 4, 4, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Status breakdown */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Incidents by Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart
                    data={byStatusData}
                    margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                      {byStatusData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Age Group */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">
                  Survivor Age Group
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={byAgeData}
                    margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="value" fill={CHART_COLORS[4]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Gender Pie */}
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Survivor Gender</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <PieChart>
                    <Pie
                      data={byGenderData}
                      cx="50%"
                      cy="50%"
                      innerRadius={55}
                      outerRadius={85}
                      paddingAngle={3}
                      dataKey="value"
                    >
                      {byGenderData.map((_, index) => (
                        <Cell
                          key={index}
                          fill={CHART_COLORS[index % CHART_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Monthly Trend */}
          {byMonthData.length > 1 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Monthly Trend</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={byMonthData}
                    margin={{ left: 8, right: 16, top: 4, bottom: 4 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} allowDecimals={false} />
                    <Tooltip />
                    <Bar dataKey="count" fill={CHART_COLORS[0]} radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          )}

          {/* Monthly Summary Table */}
          {byMonthData.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-semibold">Monthly Summary</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-border">
                        <th className="text-left py-2 px-3 text-muted-foreground font-medium">
                          Month
                        </th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                          Incidents
                        </th>
                        <th className="text-right py-2 px-3 text-muted-foreground font-medium">
                          % of Period
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {byMonthData.map(({ month, count }) => (
                        <tr
                          key={month}
                          className="border-b border-border/40 hover:bg-accent/30 transition-colors"
                        >
                          <td className="py-2 px-3 font-medium">{month}</td>
                          <td className="py-2 px-3 text-right">{count}</td>
                          <td className="py-2 px-3 text-right text-muted-foreground">
                            {reportData.total > 0
                              ? `${Math.round((count / reportData.total) * 100)}%`
                              : "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-accent/30">
                        <td className="py-2 px-3 font-bold">Total</td>
                        <td className="py-2 px-3 text-right font-bold">
                          {reportData.total}
                        </td>
                        <td className="py-2 px-3 text-right font-bold">100%</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </>
      )}
    </div>
  );
}

// ─── Page wrapper ─────────────────────────────────────────────────────────────

export default function ReportsPage() {
  return (
    <>
      <Unauthenticated>
        <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4">
          <p className="text-muted-foreground">Please sign in to view reports.</p>
          <SignInButton />
        </div>
      </Unauthenticated>
      <AuthLoading>
        <div className="p-6 space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full" />
          ))}
        </div>
      </AuthLoading>
      <Authenticated>
        <ReportsPageInner />
      </Authenticated>
    </>
  );
}
