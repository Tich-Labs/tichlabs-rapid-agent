import {
  collection,
  doc,
  getDoc,
  getDocs,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  type DocumentData,
  type QueryConstraint,
} from "firebase/firestore";
import { db, type auth } from "@/lib/firebase";

function fromFirestore<T>(doc: DocumentData): T {
  const data = doc.data?.() ?? doc;
  return { id: doc.id, ...data } as T;
}

export async function getDocument<T>(collectionName: string, id: string): Promise<T | null> {
  const snap = await getDoc(doc(db, collectionName, id));
  if (!snap.exists()) return null;
  return fromFirestore<T>(snap);
}

export async function listDocuments<T>(
  collectionName: string,
  ...constraints: QueryConstraint[]
): Promise<T[]> {
  const q = query(collection(db, collectionName), ...constraints);
  const snap = await getDocs(q);
  return snap.docs.map((d) => fromFirestore<T>(d));
}

export async function addDocument<T extends Record<string, unknown>>(
  collectionName: string,
  data: T
): Promise<string> {
  const ref = await addDoc(collection(db, collectionName), {
    ...data,
    createdAt: Timestamp.now(),
    updatedAt: Timestamp.now(),
  });
  return ref.id;
}

export async function setDocument<T extends Record<string, unknown>>(
  collectionName: string,
  id: string,
  data: T
): Promise<void> {
  const ref = doc(db, collectionName, id);
  await updateDoc(ref, { ...data, updatedAt: Timestamp.now() } as any);
}

export async function removeDocument(collectionName: string, id: string): Promise<void> {
  await deleteDoc(doc(db, collectionName, id));
}

export { where, orderBy, limit, type QueryConstraint, Timestamp };
