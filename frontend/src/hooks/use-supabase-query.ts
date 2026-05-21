import {
  useFirestoreQuery,
  useFirestoreMutation,
  firestoreQueries,
  firestoreMutations,
} from "@/hooks/use-firestore-query";

export function useSupabaseQuery<T>(queryFn?: () => Promise<T>) {
  const key = queryFn ? ["firestore", queryFn.toString().slice(0, 80)] : ["firestore", "noop"];
  return useFirestoreQuery(key, queryFn ?? (async () => null as unknown as T), !!queryFn);
}

export function useSupabaseQueryCamel<T>(queryFn: () => Promise<any>) {
  return useSupabaseQuery<T>(queryFn);
}

export function useSupabaseMutation<TData = unknown, TVariables = unknown>(
  mutationFn: (variables: TVariables) => Promise<TData>,
  options?: { onSuccess?: () => void }
) {
  return useFirestoreMutation(mutationFn, {
    onSuccess: options?.onSuccess,
  });
}

export const supabaseQueries = firestoreQueries;
export const supabaseMutations = firestoreMutations;
export { firestoreQueries, firestoreMutations };

export class ConvexError extends Error {
  constructor(message: string) { super(message); this.name = "ConvexError"; }
}
export function usePaginatedQuery(name: any, args?: any, opts?: any) {
  return { results: [], status: "success", loadMore: () => {} };
}
