// FHIR R4 mapping utilities for the PWA

import type {
  FHIRBundle,
  FHIRBundleEntry,
  FHIRObservation,
  FHIRPatient,
  FHIRLocation,
  FHIRServiceRequest,
  FHIRConsent,
} from "./fhir-types";

// --- Mapping helpers ---

const FHIR_CODE_SYSTEMS = {
  snomed: "http://snomed.info/sct",
  observationCategory: "http://terminology.hl7.org/CodeSystem/observation-category",
  administrativeGender: "http://hl7.org/fhir/administrative-gender",
  consentScope: "http://terminology.hl7.org/CodeSystem/consentscope",
  consentCategory: "http://terminology.hl7.org/CodeSystem/consentcategorycodes",
  v3ActCode: "http://terminology.hl7.org/CodeSystem/v3-ActCode",
  tichlabs: "https://tichlabs.com",
};

const INCIDENT_TYPE_SNOMED: Record<string, { code: string; display: string }> = {
  physical_abuse: { code: "442174008", display: "Physical abuse" },
  sexual_abuse: { code: "442172009", display: "Sexual abuse" },
  emotional_abuse: { code: "442164008", display: "Emotional abuse" },
  neglect: { code: "413097005", display: "Neglect" },
  bullying_harassment: { code: "248082000", display: "Harassment" },
  domestic_violence: { code: "413096001", display: "Domestic violence" },
  child_exploitation: { code: "413095002", display: "Child exploitation" },
  missing_child: { code: "38907003", display: "Child missing" },
  tech_enabled_abuse: { code: "713605000", display: "Abuse by electronic device" },
  substance_abuse: { code: "363406001", display: "Substance abuse" },
  child_labor: { code: "224173008", display: "Child labor" },
  other: { code: "416704001", display: "Abuse" },
};

const AGE_GROUP_BIRTH_DATE: Record<string, string> = {
  under_10: "2016-01-01",
  "10_14": "2012-01-01",
  "15_18": "2008-01-01",
  "18_22": "2004-01-01",
  "23_27": "2000-01-01",
  "28_35": "1993-01-01",
  "35_plus": "1988-01-01",
  "18_plus": "2004-01-01",
  unknown: "2000-01-01",
};

const SERVICE_CATEGORY_CODES: Record<string, { code: string; display: string }> = {
  health: { code: "HEALTH", display: "Healthcare Service" },
  police: { code: "POLICE", display: "Police Service" },
  shelter: { code: "SHELTER", display: "Shelter Service" },
  psychosocial: { code: "PSYCHOSOCIAL", display: "Psychosocial Service" },
  legal: { code: "LEGAL", display: "Legal Service" },
};

// --- Convert incident type to FHIR coding ---

export function getIncidentTypeFHIR(incidentType: string) {
  const entry = INCIDENT_TYPE_SNOMED[incidentType] ?? { code: "416704001", display: "Abuse" };
  return { ...entry, system: FHIR_CODE_SYSTEMS.snomed };
}

// --- Map gender to FHIR ---

export function mapGenderToFHIR(gender: string): "male" | "female" | "other" | "unknown" {
  switch (gender) {
    case "male": return "male";
    case "female": return "female";
    case "other": return "other";
    default: return "unknown";
  }
}

// --- Build Observation from Incident ---

export function buildObservation(incident: Record<string, unknown>): FHIRObservation {
  const typeCode = getIncidentTypeFHIR(String(incident.incidentType ?? ""));

  return {
    resourceType: "Observation",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Observation"],
      tag: [{ system: FHIR_CODE_SYSTEMS.tichlabs, code: "sgbv", display: "SGBV Incident" }],
    },
    status: "final",
    category: [
      {
        coding: [
          { system: FHIR_CODE_SYSTEMS.observationCategory, code: "social-history", display: "Social History" },
        ],
        text: "SGBV Incident",
      },
    ],
    code: {
      coding: [typeCode],
      text: String(incident.incidentType ?? "").replace(/_/g, " "),
    },
    effectiveDateTime: String(incident.incidentDate ?? ""),
    valueString: String(incident.description ?? ""),
    component: [
      {
        code: {
          coding: [{ system: FHIR_CODE_SYSTEMS.snomed, code: "424144002", display: "Current chronological age" }],
        },
        valueString: String(incident.survivorAgeGroup ?? ""),
      },
      {
        code: {
          coding: [{ system: FHIR_CODE_SYSTEMS.snomed, code: "263495000", display: "Gender" }],
        },
        valueCodeableConcept: {
          coding: [
            {
              system: FHIR_CODE_SYSTEMS.administrativeGender,
              code: mapGenderToFHIR(String(incident.survivorGender ?? "")),
              display: String(incident.survivorGender ?? ""),
            },
          ],
        },
      },
    ],
    note: incident.notes ? [{ text: String(incident.notes) }] : undefined,
  };
}

// --- Build Patient from Incident ---

export function buildPatient(incident: Record<string, unknown>): FHIRPatient {
  return {
    resourceType: "Patient",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Patient"],
      tag: [
        { system: FHIR_CODE_SYSTEMS.tichlabs, code: "anonymized", display: "Anonymized" },
        { system: FHIR_CODE_SYSTEMS.tichlabs, code: "survivor", display: "Survivor" },
      ],
    },
    identifier: [{ system: `${FHIR_CODE_SYSTEMS.tichlabs}/incidents`, value: String(incident._id ?? incident.id ?? "") }],
    gender: mapGenderToFHIR(String(incident.survivorGender ?? "")),
    birthDate: AGE_GROUP_BIRTH_DATE[String(incident.survivorAgeGroup ?? "")] ?? "2000-01-01",
  };
}

// --- Build Location from Service ---

export function buildLocation(service: Record<string, unknown>): FHIRLocation {
  const categoryCode = SERVICE_CATEGORY_CODES[String(service.category ?? "")] ?? { code: "OTHER", display: "Other Service" };

  return {
    resourceType: "Location",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Location"],
      tag: [{ system: FHIR_CODE_SYSTEMS.tichlabs, code: "referral-service", display: "Referral Service" }],
    },
    name: String(service.name ?? ""),
    description: String(service.description ?? ""),
    address: service.address
      ? { line: [String(service.address)], city: String(service.county ?? "") }
      : undefined,
    telecom: service.phone ? [{ system: "phone", value: String(service.phone) }] : undefined,
    managingOrganization: { display: categoryCode.display },
  };
}

// --- Build ServiceRequest from Incident + Service ---

export function buildServiceRequest(
  incident: Record<string, unknown>,
  service: Record<string, unknown>,
  intent: "proposal" | "plan" = "proposal"
): FHIRServiceRequest {
  const categoryCode = SERVICE_CATEGORY_CODES[String(service.category ?? "")] ?? { code: "OTHER", display: "Other Service" };
  const incidentId = String(incident._id ?? incident.id ?? "");

  return {
    resourceType: "ServiceRequest",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/ServiceRequest"],
      tag: [{ system: FHIR_CODE_SYSTEMS.tichlabs, code: "ai-recommended", display: "AI Recommended" }],
    },
    status: "draft",
    intent,
    code: {
      coding: [{ system: `${FHIR_CODE_SYSTEMS.tichlabs}/service-category`, code: categoryCode.code, display: categoryCode.display }],
      text: String(service.name ?? ""),
    },
    subject: { reference: `urn:uuid:patient-${incidentId}`, display: "Survivor" },
    requester: { reference: FHIR_CODE_SYSTEMS.tichlabs, display: "Tich Labs" },
    performer: [{ display: String(service.name ?? "") }],
    locationReference: [{ display: String(service.county ?? "") }],
    reasonCode: [
      {
        coding: [getIncidentTypeFHIR(String(incident.incidentType ?? ""))],
      },
    ],
    note: [
      {
        text: `AI-recommended referral to ${service.name} for ${String(incident.incidentType ?? "").replace(/_/g, " ")} incident`,
      },
    ],
  };
}

// --- Build Consent from Incident ---

export function buildConsent(incident: Record<string, unknown>): FHIRConsent {
  const incidentId = String(incident._id ?? incident.id ?? "");

  return {
    resourceType: "Consent",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Consent"],
      tag: [{ system: FHIR_CODE_SYSTEMS.tichlabs, code: "consent", display: "Consent" }],
    },
    status: "active",
    scope: {
      coding: [
        { system: FHIR_CODE_SYSTEMS.consentScope, code: "patient-privacy", display: "Privacy Consent" },
      ],
    },
    category: [
      {
        coding: [{ system: FHIR_CODE_SYSTEMS.consentCategory, code: "npp", display: "Notice of Privacy Practices" }],
      },
    ],
    patient: { reference: `urn:uuid:patient-${incidentId}`, display: "Survivor" },
    dateTime: new Date().toISOString(),
    policyRule: {
      coding: [{ system: FHIR_CODE_SYSTEMS.v3ActCode, code: "ANONY", display: "Anonymous" }],
    },
  };
}

// --- Build full FHIR Bundle ---

export function buildFHIRBundle(
  incident: Record<string, unknown>,
  services: Record<string, unknown>[]
): FHIRBundle {
  const entries: FHIRBundleEntry[] = [];
  const incidentId = String(incident._id ?? incident.id ?? "");

  entries.push({
    fullUrl: `urn:uuid:observation-${incidentId}`,
    resource: buildObservation(incident),
    request: { method: "POST", url: "Observation" },
  });

  entries.push({
    fullUrl: `urn:uuid:patient-${incidentId}`,
    resource: buildPatient(incident),
    request: { method: "POST", url: "Patient" },
  });

  entries.push({
    fullUrl: `urn:uuid:consent-${incidentId}`,
    resource: buildConsent(incident),
    request: { method: "POST", url: "Consent" },
  });

  for (const svc of services) {
    entries.push({
      fullUrl: `urn:uuid:location-${svc._id ?? svc.id}`,
      resource: buildLocation(svc),
      request: { method: "POST", url: "Location" },
    });
    entries.push({
      fullUrl: `urn:uuid:servicerequest-${incidentId}-${svc._id ?? svc.id}`,
      resource: buildServiceRequest(incident, svc),
      request: { method: "POST", url: "ServiceRequest" },
    });
  }

  return {
    resourceType: "Bundle",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Bundle"],
      tag: [{ system: FHIR_CODE_SYSTEMS.tichlabs, code: "sgbv-bundle", display: "SGBV Referral Bundle" }],
    },
    type: "transaction",
    timestamp: new Date().toISOString(),
    entry: entries,
  };
}

// --- Export FHIR Bundle as JSON ---

export function exportFHIRBundle(incident: Record<string, unknown>, services: Record<string, unknown>[]): string {
  const bundle = buildFHIRBundle(incident, services);
  return JSON.stringify(bundle, null, 2);
}
