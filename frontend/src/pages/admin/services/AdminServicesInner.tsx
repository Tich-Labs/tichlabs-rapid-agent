import { useState } from "react";
import { useSupabaseQuery, useSupabaseMutation, supabaseQueries, supabaseMutations } from "@/hooks/use-supabase-query";

function AdminServicesInner() {
  const { data: user, isLoading: userLoading } = useSupabaseQuery(
    supabaseQueries.getCurrentUser
  );
  const { data: services, isLoading: servicesLoading } = useSupabaseQuery(
    supabaseQueries.listServices
  );

  const createService = useSupabaseMutation(
    supabaseMutations.createService
  );
  const updateService = useSupabaseMutation(
    supabaseMutations.updateService
  );
  const removeService = useSupabaseMutation(
    supabaseMutations.deleteService
  );

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<FormData>(EMPTY_FORM);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterCategory, setFilterCategory] = useState<Category | "all">("all");
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Loading state
  if (userLoading || servicesLoading) {
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
  const filtered = (services || []).filter((s: any) => {
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
  const handleEdit = (service: any) => {
    setEditingId(service.id);
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
        await updateService.mutateAsync({
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
        await createService.mutateAsync({
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
      toast.error("Something went wrong");
      console.error(error);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Delete service
  const handleDelete = async () => {
    if (!deleteConfirmId) return;
    try {
      await removeService.mutateAsync(deleteConfirmId);
      toast.success("Service deleted");
      setDeleteConfirmId(null);
    } catch (error) {
      toast.error("Failed to delete service");
      console.error(error);
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Referral Services</h1>
          <p className="text-sm text-muted-foreground">
            Manage verified services for referral
          </p>
        </div>
        <Button onClick={handleCreate}>
          <Plus className="h-4 w-4" />
          Add Service
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <Input
          placeholder="Search services..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="sm:max-w-xs"
        />
        <Select value={filterCategory} onValueChange={(v) => setFilterCategory(v as any)}>
          <SelectTrigger className="sm:w-[200px]">
            <SelectValue placeholder="All Categories" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Health Facility">Health Facility</SelectItem>
            <SelectItem value="Police Station">Police Station</SelectItem>
            <SelectItem value="Rescue & Shelter">Rescue & Shelter</SelectItem>
            <SelectItem value="Counselling">Counselling</SelectItem>
            <SelectItem value="Legal Service">Legal Service</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Services Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>County</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                    No services found
                  </TableCell>
                </TableRow>
              ) : (
                filtered.map((service: any) => (
                  <TableRow key={service.id}>
                    <TableCell className="font-medium">{service.name}</TableCell>
                    <TableCell>
                      <Badge variant="outline">{service.category}</Badge>
                    </TableCell>
                    <TableCell>{service.county}</TableCell>
                    <TableCell>
                      <Badge variant={service.status === 'Active' ? 'default' : 'secondary'}>
                        {service.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button variant="ghost" size="sm" onClick={() => handleEdit(service)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteConfirmId(service.id)}
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? 'Edit Service' : 'Add New Service'}</DialogTitle>
            <DialogDescription>
              {editingId ? 'Update service details' : 'Add a new referral service'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Service Name</Label>
              <Input
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter service name"
              />
            </div>
            <div>
              <Label>Category</Label>
              <Select
                value={form.category}
                onValueChange={(v) => setForm({ ...form, category: v as Category })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Health Facility">Health Facility</SelectItem>
                  <SelectItem value="Police Station">Police Station</SelectItem>
                  <SelectItem value="Rescue & Shelter">Rescue & Shelter</SelectItem>
                  <SelectItem value="Counselling">Counselling</SelectItem>
                  <SelectItem value="Legal Service">Legal Service</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>County</Label>
              <Select
                value={form.county}
                onValueChange={(v) => setForm({ ...form, county: v as County })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select county" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Kakamega">Kakamega</SelectItem>
                  <SelectItem value="Vihiga">Vihiga</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Description</Label>
              <Textarea
                value={form.description}
                onChange={(e) => setForm({ ...form, description: e.target.value })}
                placeholder="Optional description"
              />
            </div>
            <div>
              <Label>Phone</Label>
              <Input
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                placeholder="Phone number"
              />
            </div>
            <div>
              <Label>Address</Label>
              <Textarea
                value={form.address}
                onChange={(e) => setForm({ ...form, address: e.target.value })}
                placeholder="Physical address"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSubmit} disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : editingId ? 'Update' : 'Create'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog open={!!deleteConfirmId} onOpenChange={() => setDeleteConfirmId(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Service</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this service? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
