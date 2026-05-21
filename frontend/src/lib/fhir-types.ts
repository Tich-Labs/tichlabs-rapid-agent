// FHIR R4 type definitions for Tich Labs Incident Tracker

export interface FHIRIdentifier {
  system?: string;
  value?: string;
}

export interface FHIRCoding {
  system?: string;
  code?: string;
  display?: string;
}

export interface FHIRCodeableConcept {
  coding?: FHIRCoding[];
  text?: string;
}

export interface FHIRReference {
  reference?: string;
  display?: string;
}

export interface FHIRPeriod {
  start?: string;
  end?: string;
}

export interface FHIRMeta {
  lastUpdated?: string;
  profile?: string[];
  tag?: FHIRCoding[];
}

// --- Observation (maps to Incident) ---

export interface FHIRObservation {
  resourceType: "Observation";
  id?: string;
  meta?: FHIRMeta;
  status: "final" | "registered" | "preliminary" | "amended";
  category?: FHIRCodeableConcept[];
  code: FHIRCodeableConcept;
  subject?: FHIRReference;
  effectiveDateTime?: string;
  valueString?: string;
  valueCodeableConcept?: FHIRCodeableConcept;
  component?: {
    code: FHIRCodeableConcept;
    valueCodeableConcept?: FHIRCodeableConcept;
    valueString?: string;
  }[];
  note?: { text: string }[];
}

// --- Patient (maps to Survivor - anonymized) ---

export interface FHIRPatient {
  resourceType: "Patient";
  id?: string;
  meta?: FHIRMeta;
  identifier?: FHIRIdentifier[];
  gender?: "male" | "female" | "other" | "unknown";
  birthDate?: string;
  generalPractitioner?: FHIRReference[];
}

// --- Location (maps to Referral Service) ---

export interface FHIRLocation {
  resourceType: "Location";
  id?: string;
  meta?: FHIRMeta;
  name?: string;
  description?: string;
  address?: {
    line?: string[];
    city?: string;
    state?: string;
    postalCode?: string;
  };
  telecom?: {
    system: "phone" | "email";
    value: string;
  }[];
  managingOrganization?: FHIRReference;
}

// --- ServiceRequest (maps to Referral) ---

export interface FHIRServiceRequest {
  resourceType: "ServiceRequest";
  id?: string;
  meta?: FHIRMeta;
  status: "draft" | "active" | "completed" | "cancelled";
  intent: "proposal" | "plan" | "order";
  code: FHIRCodeableConcept;
  subject: FHIRReference;
  requester?: FHIRReference;
  performer?: FHIRReference[];
  locationReference?: FHIRReference[];
  occurrenceDateTime?: string;
  reasonCode?: FHIRCodeableConcept[];
  note?: { text: string }[];
}

// --- Consent (maps to survivor consent) ---

export interface FHIRConsent {
  resourceType: "Consent";
  id?: string;
  meta?: FHIRMeta;
  status: "active" | "inactive" | "pending";
  scope: FHIRCodeableConcept;
  category: FHIRCodeableConcept[];
  patient: FHIRReference;
  dateTime?: string;
  policyRule?: FHIRCodeableConcept;
}

// --- Bundle ---

export interface FHIRBundleEntry {
  fullUrl?: string;
  resource: FHIRObservation | FHIRPatient | FHIRLocation | FHIRServiceRequest | FHIRConsent;
  request?: {
    method: "POST" | "PUT" | "GET" | "DELETE";
    url: string;
  };
}

export interface FHIRBundle {
  resourceType: "Bundle";
  id?: string;
  meta?: FHIRMeta;
  type: "collection" | "transaction" | "batch" | "document";
  timestamp?: string;
  entry?: FHIRBundleEntry[];
}
