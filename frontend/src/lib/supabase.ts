import { auth } from "./firebase";
import { collection, getDocs, query, where, orderBy, limit as fsLimit, addDoc, updateDoc, deleteDoc } from "firebase/firestore";
import { db } from "./firebase";
import { signInWithGoogle, signOut as fbSignOut } from "./firebase";

function fromSnap(d: any) {
  const data = d.data?.() ?? d;
  return { id: d.id, ...data };
}

async function runQuery(q: any) {
  try {
    const snap = await getDocs(q);
    return { data: snap.docs.map((d: any) => fromSnap(d)), error: null };
  } catch (e) {
    return { data: [], error: e instanceof Error ? { message: e.message } : String(e) };
  }
}

function chain(obj: any) {
  return {
    eq(field: string, value: unknown) {
      const q = query(collection(db, obj._tbl), where(field, "==", value));
      return chain({ _tbl: obj._tbl, _q: q });
    },
    order(field: string, opts?: { ascending: boolean }) {
      const dir = (opts?.ascending === false) ? "desc" : "asc";
      const q = query(obj._q ?? collection(db, obj._tbl), orderBy(field, dir as any));
      return chain({ _tbl: obj._tbl, _q: q });
    },
    limit(n: number) {
      const q = query(obj._q ?? collection(db, obj._tbl), fsLimit(n));
      return {
        then: (resolve: (value: unknown) => void) => runQuery(q).then(resolve),
      };
    },
    single() {
      return {
        then: (resolve: (value: unknown) => void) =>
          getDocs(obj._q ?? collection(db, obj._tbl)).then((snap) => {
            const docs = snap.docs.map((d: any) => fromSnap(d));
            resolve({ data: docs[0] ?? null, error: null });
          }),
      };
    },
    select() { return this; },
    insert(row: any) {
      const p = addDoc(collection(db, obj._tbl), {
        ...row,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      return {
        select() {
          return {
            single() {
              return {
                then: (resolve: (value: unknown) => void) =>
                  p.then((ref: any) => resolve({ data: { id: ref.id, ...row }, error: null })),
              };
            },
          };
        },
      };
    },
    update(row: any) {
      return this;
    },
    delete() {
      return this;
    },
    then: (resolve: (value: unknown) => void) => runQuery(obj._q ?? collection(db, obj._tbl)).then(resolve),
  };
}

export const supabase = {
  auth: {
    getSession: async () => ({ data: { session: auth.currentUser ? { user: auth.currentUser } : null }, error: null }),
    getUser: async () => ({ data: { user: auth.currentUser }, error: null }),
    signInWithOAuth: async ({ provider }: { provider?: string }) => {
      try {
        await signInWithGoogle();
        return { error: null };
      } catch (e: any) {
        return { error: e };
      }
    },
    signOut: async () => {
      try {
        await fbSignOut();
        return { error: null };
      } catch (e: any) {
        return { error: e };
      }
    },
    onAuthStateChange: (cb: (event: string, session: unknown) => void) => {
      const unsub = auth.onAuthStateChanged((user) => cb("SIGNED_IN", { user }));
      return { data: { subscription: { unsubscribe: unsub } } };
    },
  },
  from: (table: string) => chain({ _tbl: table, _q: null }),
};
