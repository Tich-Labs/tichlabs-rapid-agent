import { useState } from "react";
import { Skeleton } from "@/components/ui/skeleton.tsx";
import { SignInButton } from "@/components/ui/signin.tsx";
import { Button } from "@/components/ui/button.tsx";
import { Badge } from "@/components/ui/badge.tsx";
import { Input } from "@/components/ui/input.tsx";
import { Textarea } from "@/components/ui/textarea.tsx";
import { useSupabaseQuery, useSupabaseMutation } from "@/hooks/use-supabase-query";
import { Authenticated, Unauthenticated, AuthLoading } from "@/components/auth-components";
import type { Id } from "@/types/supabase";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog.tsx";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select.tsx";
import { cn } from "@/lib/utils.ts";
import { toast } from "sonner";
import {
  Plus,
  Pencil,
  Trash2,
  Heart,
  Shield,
  Home,
  Brain,
  Scale,
  Phone,
  MapPin,
  ToggleLeft,
  ToggleRight,
  Search,
  Lock,
} from "lucide-react";

// ─── Constants ───────────────────────────────────────────────────────────────

const CATEGORY_OPTIONS = [
  { value: "health" as const, label: "Health Facility", icon: Heart, color: "bg-red-100 text-red-700" },
  { value: "police" as const, label: "Police Station", icon: Shield, color: "bg-blue-100 text-blue-700" },
  { value: "shelter" as const, label: "Rescue & Shelter", icon: Home, color: "bg-amber-100 text-amber-700" },
  { value: "psychosocial" as const, label: "Counselling", icon: Brain, color: "bg-purple-100 text-purple-700" },
  { value: "legal" as const, label: "Legal Services", icon: Scale, color: "bg-green-100 text-green-700" },
];

const COUNTY_OPTIONS = [
  { value: "kakamega" as const, label: "Kakamega" },
  { value: "vihiga" as const, label: "Vihiga" },
];

type Category = "health" | "police" | "shelter" | "psychosocial" | "legal";
type County = "kakamega" | "vihiga";

type FormData = {
  name: string;
  category: Category;
  county: County;
  description: string;
  phone: string;
  address: string;
};

const EMPTY_FORM: FormData = {
  name: "",
  category: "health",
  county: "kakamega",
  description: "",
  phone: "",
  address: "",
};

// ─── Inner page ──────────────────────────────────────────────────────────────

function AdminServicesInner() {
  const user = useSupabaseQuery();
  const services = useSupabaseQuery();
  const createService = useSupabaseMutation();
  const updateService = useSupabaseMutation();
  const removeService = useSupabaseMutation();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<Id<"referralServices"> | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<Id<"referralServices"> | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading state
  if (user === undefined || services === undefined) {
    return (
      <div className="p-6 space-y-3">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-8 w-full" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    );
  }

  // Access check
  const isAdmin = user?.role === "program_lead" || user?.role === "executive_director";
  if (!isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 text-center gap-4">
        <div className="w-14 h-14 rounded-full bg-destructive/10 flex items-center justify-center">
          <Lock className="h-7 w-7 text-destructive" />
        </div>
        <div>
          <h2 className="text-lg font-bold">Access Restricted</h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xs">
            Only Program Leads and Executive Directors can manage referral services.
          </p>
        </div>
      </div>
    );
  }

  // Filter services
  const filtered = services.filter((s) => {
    const matchesSearch =
      searchQuery === "" ||
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.description?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone?.includes(searchQuery);
    const matchesCategory = filterCategory === "all" || s.category === filterCategory;
    return matchesSearch && matchesCategory;
  });

  // Open dialog for create
  const handleCreate = () => {
    setEditingId(null);
    setForm(EMPTY_FORM);
    setDialogOpen(true);
  };

  // Open dialog for edit
  const handleEdit = (service: (typeof services)[number]) => {
    setEditingId(service._id);
    setForm({
      name: service.name,
      category: service.category,
      county: service.county,
      description: service.description ?? "",
      phone: service.phone ?? "",
      address: service.address ?? "",
    });
    setDialogOpen(true);
  };

  // Submit create/update
  const handleSubmit = async () => {
    if (!form.name.trim()) {
      toast.error("Service name is required");
      return;
    }
    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateService({
          id: editingId,
          name: form.name.trim(),
          category: form.category,
          county: form.county,
          description: form.description.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
        });
        toast.success("Service updated");
      } else {
        await createService({
          name: form.name.trim(),
          category: form.category,
          county: form.county,
          description: form.description.trim() || undefined,
          phone: form.phone.trim() || undefined,
          address: form.address.trim() || undefined,
        });
        toast.success("Service created");
      }
      setDialogOpen(false);
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Something went wrong");
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  // Toggle active/inactive
  const handleToggleActive = async (id: Id<"referralServices">, currentlyActive: boolean) => {
    try {
      await updateService({ id, isActive: !currentlyActive });
      toast.success(currentlyActive ? "Service deactivated" : "Service activated");
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  // Delete
  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await removeService({ id: deleteConfirmId });
      toast.success("Service deleted");
      setDeleteConfirmId(null);
    } catch (error) {
      if (error instanceof ConvexError) {
        const { message } = error.data as { code: string; message: string };
        toast.error(message);
      } else {
        toast.error("Something went wrong");
      }
    }
  };

  const getCategoryConfig = (cat: Category) =>
    CATEGORY_OPTIONS.find((c) => c.value === cat) ?? CATEGORY_OPTIONS[0];

  return (
    <div className="p-4 sm:p-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-lg font-bold">Manage Referral Services</h1>
          <p className="text-sm text-muted-foreground">
            Add, edit, or deactivate service providers in the directory
          </p>
        </div>
        <Button onClick={handleCreate} className="cursor-pointer">
          <Plus className="h-4 w-4 mr-1.5" />
          Add Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-5">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search by name, description, or phone..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Select
          value={filterCategory}
          onValueChange={(val) => setFilterCategory(val as Category | "all")}
        >
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            {CATEGORY_OPTIONS.map((cat) => (
              <SelectItem key={cat.value} value={cat.value}>
                {cat.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Stats */}
      <div className="flex items-center gap-4 mb-4 text-xs text-muted-foreground">
        <span>{services.length} total</span>
        <span>{services.filter((s) => s.isActive).length} active</span>
        <span>{services.filter((s) => !s.isActive).length} inactive</span>
        {filtered.length !== services.length && (
          <span className="text-primary font-medium">{filtered.length} matching filters</span>
        )}
      </div>

      {/* Services table/list */}
      <div className="border border-border rounded-xl overflow-hidden">
        {/* Table header */}
        <div className="hidden sm:grid grid-cols-[1fr_120px_100px_100px_90px] gap-3 px-4 py-2.5 bg-muted/40 border-b border-border text-xs font-medium text-muted-foreground uppercase tracking-wide">
          <span>Service</span>
          <span>Category</span>
          <span>County</span>
          <span>Status</span>
          <span>Actions</span>
        </div>

        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <Search className="h-8 w-8 text-muted-foreground/40 mb-2" />
            <p className="text-sm text-muted-foreground">No services match your filters</p>
          </div>
        ) : (
          filtered.map((service) => {
            const catConfig = getCategoryConfig(service.category);
            const CatIcon = catConfig.icon;

            return (
              <div
                key={service._id}
                className={cn(
                  "grid grid-cols-1 sm:grid-cols-[1fr_120px_100px_100px_90px] gap-2 sm:gap-3 px-4 py-3 border-b border-border last:border-0 items-center",
                  !service.isActive && "opacity-50"
                )}
              >
                {/* Name + details */}
                <div className="min-w-0">
                  <p className="text-sm font-medium truncate">{service.name}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {service.phone && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="h-3 w-3" />
                        {service.phone}
                      </span>
                    )}
                    {service.address && (
                      <span className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MapPin className="h-3 w-3" />
                        {service.address}
                      </span>
                    )}
                  </div>
                </div>

                {/* Category badge */}
                <div>
                  <span className={cn("inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium", catConfig.color)}>
                    <CatIcon className="h-3 w-3" />
                    {catConfig.label}
                  </span>
                </div>

                {/* County */}
                <div>
                  <Badge variant="secondary" className="text-[10px] capitalize">
                    {service.county}
                  </Badge>
                </div>

                {/* Status toggle */}
                <div>
                  <button
                    onClick={() => handleToggleActive(service._id, service.isActive)}
                    className="cursor-pointer flex items-center gap-1 text-xs"
                    title={service.isActive ? "Deactivate" : "Activate"}
                  >
                    {service.isActive ? (
                      <>
                        <ToggleRight className="h-5 w-5 text-green-600" />
                        <span className="text-green-700 font-medium">Active</span>
                      </>
                    ) : (
                      <>
                        <ToggleLeft className="h-5 w-5 text-muted-foreground" />
                        <span className="text-muted-foreground">Inactive</span>
                      </>
                    )}
                  </button>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 cursor-pointer"
                    onClick={() => handleEdit(service)}
                    title="Edit"
                  >
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive cursor-pointer"
                    onClick={() => setDeleteConfirmId(service._id)}
                    title="Delete"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Edit Service" : "Add New Service"}</DialogTitle>
            <DialogDescription>
              {editingId
                ? "Update the details for this referral service."
                : "Add a new service provider to the referral directory."}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Service Name *
              </label>
              <Input
                placeholder="e.g. Kakamega County Referral Hospital"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Category *
                </label>
                <Select
                  value={form.category}
                  onValueChange={(val) => setForm({ ...form, category: val as Category })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {CATEGORY_OPTIONS.map((cat) => (
                      <SelectItem key={cat.value} value={cat.value}>
                        {cat.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  County *
                </label>
                <Select
                  value={form.county}
                  onValueChange={(val) => setForm({ ...form, county: val as County })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COUNTY_OPTIONS.map((c) => (
                      <SelectItem key={c.value} value={c.value}>
                        {c.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div>
              <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                Description
              </label>
              <Textarea
                placeholder="Brief description of services offered"
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                rows={2}
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Phone
                </label>
                <Input
                  placeholder="e.g. 0700 000 000"
                  value={form.phone}
                  onChange={(e) => setForm({ ...form, phone: e.target.value })}
                />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                  Address
                </label>
                <Input
                  placeholder="e.g. Kakamega Town"
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDialogOpen(false)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="cursor-pointer"
            >
              {isSubmitting ? "Saving..." : editingId ? "Save Changes" : "Add Service"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmId !== null} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to permanently delete this service? This action cannot be
              undone. Consider deactivating instead if you may need it later.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setDeleteConfirmId(null)}
              className="cursor-pointer"
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDelete}
              className="cursor-pointer"
            >
              Delete Permanently
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─── Page wrapper ────────────────────────────────────────────────────────────

export default function AdminServicesPage() {
  return (
    <>
      <AuthLoading>
        <div className="p-6 space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </div>
      </AuthLoading>
      <Unauthenticated>
        <div className="flex items-center justify-center min-h-[60vh]">
          <SignInButton />
        </div>
      </Unauthenticated>
      <Authenticated>
        <AdminServicesInner />
      </Authenticated>
    </>
  );
}
