import {
  useFirestoreQuery,
  useFirestoreMutation,
  firestoreQueries,
  firestoreMutations,
} from "@/hooks/use-firestore-query";
import { useInfiniteQuery } from "@tanstack/react-query";
import { orderBy, limit, type QueryConstraint } from "@/lib/firestore";
import { collection, query, getDocs, startAfter, type DocumentData } from "firebase/firestore";
import { db } from "@/lib/firebase";

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

function fromDoc<T>(doc: DocumentData): T {
  const data = doc.data?.() ?? doc;
  return { _id: doc.id, id: doc.id, ...data } as T;
}

interface PaginatedQueryOptions {
  collectionName: string;
  pageSize?: number;
  orderByField?: string;
  orderDirection?: "asc" | "desc";
}

export function usePaginatedQuery({
  collectionName,
  pageSize = 30,
  orderByField = "createdAt",
  orderDirection = "desc" as const,
}: PaginatedQueryOptions) {
  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    isError,
    error,
  } = useInfiniteQuery({
    queryKey: ["firestore", "paginated", collectionName, orderByField, orderDirection, pageSize],
    queryFn: async ({ pageParam }) => {
      const constraints: QueryConstraint[] = [
        orderBy(orderByField, orderDirection),
        limit(pageSize),
      ];

      const q = pageParam
        ? query(collection(db, collectionName), ...constraints, startAfter(pageParam))
        : query(collection(db, collectionName), ...constraints);

      const snap = await getDocs(q);
      const docs = snap.docs.map((d) => fromDoc<any>(d));
      const lastDoc = snap.docs[snap.docs.length - 1] ?? null;

      return { docs, lastDoc };
    },
    getNextPageParam: (lastPage) => lastPage.lastDoc ?? undefined,
    initialPageParam: null as unknown as DocumentData,
  });

  return {
    data: data?.pages.flatMap((p) => p.docs) ?? [],
    loading: isLoading,
    error: isError ? (error as Error) : null,
    fetchNextPage,
    hasMore: !!hasNextPage,
    isFetchingNextPage,
  };
}
