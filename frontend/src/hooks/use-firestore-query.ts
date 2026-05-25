import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  getDocument,
  listDocuments,
  addDocument,
  setDocument,
  removeDocument,
  where,
  orderBy,
  limit,
} from "@/lib/firestore";
import { auth } from "@/lib/firebase";

export function useFirestoreQuery<T>(
  key: string[],
  queryFn: () => Promise<T>,
  enabled = true
) {
  return useQuery({ queryKey: key, queryFn, enabled });
}

export function useFirestoreMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: { onSuccess?: () => void; invalidateKeys?: string[][] }
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn,
    onSuccess: () => {
      if (options?.invalidateKeys) {
        options.invalidateKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: k }));
      } else {
        queryClient.invalidateQueries({ queryKey: ["firestore"] });
      }
      options?.onSuccess?.();
    },
  });
}

export const firestoreQueries = {
  getCurrentUser: async () => {
    const user = auth.currentUser;
    if (!user) {
      throw new Error("Not authenticated");
    }
    const profile = await getDocument<any>("users", user.uid);
    if (profile) return profile;

    const newUser = {
      id: user.uid,
      name: user.displayName ?? user.email?.split("@")[0] ?? "User",
      email: user.email ?? "",
      role: "program_lead" as const,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    await addDocument("users", newUser);
    return newUser;
  },

  listUsers: async () => {
    return listDocuments<any>("users", orderBy("createdAt", "desc"));
  },

  listServices: async () => {
    return listDocuments<any>("referral_services", orderBy("name", "asc"));
  },

  listIncidents: async () => {
    return listDocuments<any>("incidents", orderBy("createdAt", "desc"));
  },

  getIncident: async (id: string) => {
    return getDocument<any>("incidents", id);
  },

  getDashboardStats: async () => {
    const incidents = await listDocuments<any>("incidents");
    const total = incidents.length;
    const newCount = incidents.filter((i: any) => i.status === "new").length;
    const inProgress = incidents.filter((i: any) =>
      ["assigned", "pfa_in_progress", "under_review"].includes(i.status)
    ).length;
    const escalated = incidents.filter((i: any) => i.status === "escalated").length;
    const resolved = incidents.filter((i: any) =>
      ["resolved", "closed"].includes(i.status)
    ).length;
    return { total, new: newCount, inProgress, escalated, resolved };
  },

  getEscalatedIncidents: async () => {
    return listDocuments<any>(
      "incidents",
      where("status", "==", "escalated"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
  },

  getNewIncidents: async () => {
    return listDocuments<any>(
      "incidents",
      where("status", "==", "new"),
      orderBy("createdAt", "desc"),
      limit(5)
    );
  },

  getAuditLogs: async () => {
    return listDocuments<any>("audit_logs", orderBy("createdAt", "desc"), limit(200));
  },

  getAIRecommendations: async (incidentId: string) => {
    return listDocuments<any>(
      "ai_recommendations",
      where("incidentId", "==", incidentId),
      orderBy("createdAt", "desc")
    );
  },
};

export const firestoreMutations = {
  createIncident: async (incident: any) => {
    return addDocument("incidents", incident);
  },

  updateIncident: async ({ id, ...data }: any) => {
    return setDocument("incidents", id, data);
  },

  createService: async (service: any) => {
    return addDocument("referral_services", service);
  },

  updateService: async ({ id, ...data }: any) => {
    return setDocument("referral_services", id, data);
  },

  deleteService: async (id: string) => {
    return removeDocument("referral_services", id);
  },

  updateUserRole: async ({ userId, role }: { userId: string; role: string }) => {
    return setDocument("users", userId, { role });
  },

  toggleUserActive: async ({ userId, isActive }: { userId: string; isActive: boolean }) => {
    return setDocument("users", userId, { isActive });
  },

  addAuditLog: async (entry: any) => {
    return addDocument("audit_logs", entry);
  },
};

export { getDocument, listDocuments, addDocument, setDocument, removeDocument, where, orderBy, limit };
