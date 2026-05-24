import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

function getFirebaseApp() {
  if (getApps().length > 0) return getApps()[0];

  const json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  if (!json) {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON environment variable is required. " +
      "Set it to the JSON content of your Firebase service account key."
    );
  }

  let serviceAccount: Record<string, unknown>;
  try {
    serviceAccount = JSON.parse(json);
  } catch {
    throw new Error(
      "FIREBASE_SERVICE_ACCOUNT_JSON is not valid JSON. " +
      "Paste the entire service account key file contents."
    );
  }

  return initializeApp({
    credential: cert(serviceAccount as any),
  });
}

let _db: FirebaseFirestore.Firestore | null = null;

export function getDb(): FirebaseFirestore.Firestore {
  if (!_db) {
    _db = getFirestore(getFirebaseApp());
  }
  return _db;
}

export const db: FirebaseFirestore.Firestore = new Proxy({} as FirebaseFirestore.Firestore, {
  get(_target, prop) {
    return (getDb() as any)[prop];
  },
});

export interface Incident {
  _id: string;
  _creationTime: number;
  description: string;
  incidentDate: string;
  incidentTime?: string;
  incidentType: string;
  isEscalated: boolean;
  location: string;
  notes?: string;
  status: string;
  survivorAgeGroup: string;
  survivorGender: string;
  submitterContact?: string;
}

export interface ReferralService {
  _id: string;
  name: string;
  category: string;
  county: string;
  description?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
}

function toIncident(doc: FirebaseFirestore.DocumentSnapshot): Incident {
  const data = doc.data() ?? {};
  return {
    _id: doc.id,
    _creationTime: data.createdAt?._seconds
      ? data.createdAt._seconds * 1000
      : data.createdAt?.getTime?.()
      ?? data._creationTime
      ?? Date.now(),
    description: data.description ?? "",
    incidentDate: data.incidentDate ?? data.incident_date ?? "",
    incidentTime: data.incidentTime ?? data.incident_time,
    incidentType: data.incidentType ?? data.incident_type ?? "",
    isEscalated: data.isEscalated ?? data.is_escalated ?? false,
    location: data.location ?? "",
    notes: data.notes,
    status: data.status ?? "new",
    survivorAgeGroup: data.survivorAgeGroup ?? data.survivor_age_group ?? "",
    survivorGender: data.survivorGender ?? data.survivor_gender ?? "",
    submitterContact: data.submitterContact ?? data.submitter_contact,
  };
}

function toReferralService(doc: FirebaseFirestore.DocumentSnapshot): ReferralService {
  const data = doc.data() ?? {};
  return {
    _id: doc.id,
    name: data.name ?? "",
    category: data.category ?? "",
    county: data.county ?? "",
    description: data.description,
    phone: data.phone,
    address: data.address,
    isActive: data.isActive ?? data.is_active ?? true,
  };
}

export async function getIncident(id: string): Promise<Incident | null> {
  try {
    const snapshot = await getDb().collection("incidents").doc(id).get();
    if (!snapshot.exists) return null;
    return toIncident(snapshot);
  } catch {
    return null;
  }
}

export async function getActiveServices(): Promise<ReferralService[]> {
  try {
    const snapshot = await getDb()
      .collection("referral_services")
      .where("is_active", "==", true)
      .orderBy("name")
      .get();

    return snapshot.docs.map(toReferralService);
  } catch {
    return [];
  }
}

export async function listIncidents(): Promise<Incident[]> {
  try {
    const snapshot = await getDb()
      .collection("incidents")
      .orderBy("createdAt", "desc")
      .get();

    return snapshot.docs.map(toIncident);
  } catch {
    return [];
  }
}
