import { useState, useEffect, useCallback, useRef } from "react";
import { toast } from "sonner";
import { useSupabaseMutation } from "@/hooks/use-supabase-query";
import { supabaseQueries } from "@/hooks/use-supabase-query";
import { supabase } from "@/lib/supabase";

const QUEUE_KEY = "tichlabs_offline_incident_queue";
const MAX_RETRIES = 5;

export type IncidentDraft = {
  offlineId: string;
  savedAt: string;
  retryCount: number;
  reporterType: string;
  volunteerId?: string;
  incidentDate: string;
  incidentTime?: string;
  incidentType: string;
  location: string;
  description: string;
  notes?: string;
  survivorAgeGroup: string;
  survivorGender: string;
  submitterContact?: string;
};

function loadQueue(): IncidentDraft[] {
  try {
    const raw = localStorage.getItem(QUEUE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as IncidentDraft[];
    // Migrate older drafts that don't have retryCount or reporterType
    return parsed.map((item) => ({ ...item, retryCount: item.retryCount ?? 0, reporterType: item.reporterType ?? "self" }));
  } catch {
    return [];
  }
}

function saveQueue(queue: IncidentDraft[]) {
  try {
    localStorage.setItem(QUEUE_KEY, JSON.stringify(queue));
  } catch {
    // Storage full or unavailable — silently fail
  }
}

export function useOfflineIncidentQueue() {
  const [queue, setQueue] = useState<IncidentDraft[]>(loadQueue);
  // Use a ref for the syncing flag to avoid stale closure issues in async loops
  const isSyncingRef = useRef(false);
  const [isSyncing, setIsSyncing] = useState(false);
  const createIncident = useSupabaseMutation(
    async (incident: any) => {
      const { data, error } = await supabase
        .from('incidents')
        .insert(incident)
        .select()
        .single()
      if (error) throw error
      return data
    }
  );

  // Persist queue to localStorage whenever it changes
  useEffect(() => {
    saveQueue(queue);
  }, [queue]);

  // Add an incident to the offline queue
  const enqueue = useCallback(
    (draft: Omit<IncidentDraft, "offlineId" | "savedAt" | "retryCount">) => {
      const item: IncidentDraft = {
        ...draft,
        offlineId: `offline-${Date.now()}-${Math.random().toString(36).slice(2)}`,
        savedAt: new Date().toISOString(),
        retryCount: 0,
      };
      setQueue((prev) => {
        const updated = [...prev, item];
        saveQueue(updated); // persist immediately so it's available for sync
        return updated;
      });
      return item.offlineId;
    },
    []
  );

  // Remove a specific item from queue by offlineId
  const dequeue = useCallback((offlineId: string) => {
    setQueue((prev) => {
      const updated = prev.filter((item) => item.offlineId !== offlineId);
      saveQueue(updated);
      return updated;
    });
  }, []);

  // Attempt to sync all queued incidents to the backend
  const syncQueue = useCallback(async () => {
    // Use ref to avoid race conditions from stale closure
    if (isSyncingRef.current) return;

    const current = loadQueue();
    // Only attempt items that haven't exceeded the retry limit
    const eligible = current.filter((item) => item.retryCount < MAX_RETRIES);
    if (eligible.length === 0) return;

    isSyncingRef.current = true;
    setIsSyncing(true);

    let synced = 0;
    let failed = 0;

    for (const item of eligible) {
      try {
        await createIncident.mutateAsync({
          reporter_type: item.reporterType,
          volunteer_id: item.volunteerId,
          incident_date: item.incidentDate,
          incident_time: item.incidentTime,
          incident_type: item.incidentType,
          location: item.location,
          description: item.description,
          notes: item.notes,
          survivor_age_group: item.survivorAgeGroup,
          survivor_gender: item.survivorGender,
          submitter_contact: item.submitterContact,
          offline_id: item.offlineId,
        });

        // Remove successfully synced item immediately and persist
        setQueue((prev) => {
          const updated = prev.filter((q) => q.offlineId !== item.offlineId);
          saveQueue(updated);
          return updated;
        });
        synced++;
      } catch {
        // Increment retry count for failed items
        setQueue((prev) => {
          const updated = prev.map((q) =>
            q.offlineId === item.offlineId
              ? { ...q, retryCount: q.retryCount + 1 }
              : q
          );
          saveQueue(updated);
          return updated;
        });
        failed++;
      }
    }

    isSyncingRef.current = false;
    setIsSyncing(false);

    if (synced > 0) {
      toast.success(
        `${synced} offline incident${synced > 1 ? "s" : ""} synced successfully`
      );
    }
    if (failed > 0) {
      toast.error(
        `${failed} incident${failed > 1 ? "s" : ""} failed to sync. Will retry when online.`
      );
    }

    // Warn about permanently failed items
    const deadItems = loadQueue().filter((q) => q.retryCount >= MAX_RETRIES);
    if (deadItems.length > 0) {
      toast.warning(
        `${deadItems.length} incident${deadItems.length > 1 ? "s" : ""} could not be synced after ${MAX_RETRIES} attempts. Please contact support.`,
        { duration: 8000 }
      );
    }
  }, [createIncident]);

  // Auto-sync when coming back online
  useEffect(() => {
    const handleOnline = () => {
      const current = loadQueue();
      const eligible = current.filter((item) => item.retryCount < MAX_RETRIES);
      if (eligible.length > 0) {
        toast.info(
          `Back online. Syncing ${eligible.length} saved incident${eligible.length > 1 ? "s" : ""}...`
        );
        void syncQueue();
      }
    };

    window.addEventListener("online", handleOnline);
    return () => window.removeEventListener("online", handleOnline);
  }, [syncQueue]);

  const deadCount = queue.filter((q) => q.retryCount >= MAX_RETRIES).length;
  const pendingCount = queue.filter((q) => q.retryCount < MAX_RETRIES).length;

  return {
    queue,
    queueCount: pendingCount,
    deadCount,
    isSyncing,
    enqueue,
    dequeue,
    syncQueue,
  };
}
