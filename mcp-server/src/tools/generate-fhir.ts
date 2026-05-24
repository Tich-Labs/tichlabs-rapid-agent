import { z } from "zod";
import { getActiveServices, type Incident, type ReferralService } from "../lib/firestore-admin.js";
import { submitBundleToFHIR, type SHARPContext } from "../lib/fhir-sharp.js";
import type {
  FHIRBundle,
  FHIRBundleEntry,
  FHIRObservation,
  FHIRPatient,
  FHIRLocation,
  FHIRServiceRequest,
  FHIRConsent,
} from "../lib/fhir-types.js";

export const GenerateFHIRBundleInput = z.object({
  incidentId: z.string().optional().describe("Incident ID to generate FHIR for"),
  incident: z.any().optional().describe("Incident object (if already loaded)"),
  includeReferrals: z.boolean().optional().default(true).describe("Include ServiceRequest resources for matched services"),
  matchedServiceIds: z.array(z.string()).optional().describe("List of service IDs to include as ServiceRequests"),
  fhirServerUrl: z.string().optional().describe("FHIR server URL (from SHARP context)"),
  fhirToken: z.string().optional().describe("FHIR server access token (from SHARP context)"),
  patientId: z.string().optional().describe("Patient ID from SHARP context"),
});

export type GenerateFHIRBundleInput = z.infer<typeof GenerateFHIRBundleInput>;

function mapIncidentTypeToFHIR(incidentType: string): { code: string; display: string; system: string } {
  const map: Record<string, { code: string; display: string }> = {
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
  const entry = map[incidentType] ?? { code: "416704001", display: "Abuse" };
  return { ...entry, system: "http://snomed.info/sct" };
}

function mapAgeGroupToBirthDate(ageGroup: string): string {
  switch (ageGroup) {
    case "under_10": return "2016-01-01";
    case "10_14": return "2012-01-01";
    case "15_18": return "2008-01-01";
    case "18_plus":
    case "18_22": return "2004-01-01";
    case "23_27": return "2000-01-01";
    case "28_35": return "1993-01-01";
    case "35_plus": return "1988-01-01";
    default: return "2000-01-01";
  }
}

function mapGenderToFHIR(gender: string): "male" | "female" | "other" | "unknown" {
  switch (gender) {
    case "male": return "male";
    case "female": return "female";
    case "other": return "other";
    case "prefer_not_to_say": return "unknown";
    default: return "unknown";
  }
}

function mapServiceCategoryToFHIR(category: string): { code: string; display: string } {
  const map: Record<string, { code: string; display: string }> = {
    health: { code: "HEALTH", display: "Healthcare Service" },
    police: { code: "POLICE", display: "Police Service" },
    shelter: { code: "SHELTER", display: "Shelter Service" },
    psychosocial: { code: "PSYCHOSOCIAL", display: "Psychosocial Service" },
    legal: { code: "LEGAL", display: "Legal Service" },
  };
  return map[category] ?? { code: "OTHER", display: "Other Service" };
}

function resolveId(incident: Incident): string {
  return ((incident as unknown) as Record<string, unknown>).id as string ?? incident._id;
}

function resolveServiceId(service: ReferralService): string {
  return ((service as unknown) as Record<string, unknown>).id as string ?? service._id;
}

export function buildObservation(incident: Incident): FHIRObservation {
  const typeCode = mapIncidentTypeToFHIR(incident.incidentType);
  return {
    resourceType: "Observation",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Observation"],
      tag: [{ system: "https://tichlabs.com", code: "sgbv", display: "SGBV Incident" }],
    },
    status: "final",
    category: [
      {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/observation-category", code: "social-history", display: "Social History" }],
        text: "SGBV Incident",
      },
    ],
    code: {
      coding: [{ system: typeCode.system, code: typeCode.code, display: typeCode.display }],
      text: incident.incidentType.replace(/_/g, " "),
    },
    effectiveDateTime: incident.incidentDate,
    valueString: incident.description,
    component: [
      {
        code: { coding: [{ system: "http://snomed.info/sct", code: "424144002", display: "Current chronological age" }] },
        valueString: incident.survivorAgeGroup,
      },
      {
        code: { coding: [{ system: "http://snomed.info/sct", code: "263495000", display: "Gender" }] },
        valueCodeableConcept: {
          coding: [{ system: "http://hl7.org/fhir/administrative-gender", code: mapGenderToFHIR(incident.survivorGender), display: incident.survivorGender }],
        },
      },
    ],
    note: incident.notes ? [{ text: incident.notes }] : undefined,
  };
}

export function buildPatient(incident: Incident): FHIRPatient {
  const id = resolveId(incident);
  return {
    resourceType: "Patient",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Patient"],
      tag: [
        { system: "https://tichlabs.com", code: "anonymized", display: "Anonymized" },
        { system: "https://tichlabs.com", code: "survivor", display: "Survivor" },
      ],
    },
    identifier: [{ system: "https://tichlabs.com/incidents", value: id }],
    gender: mapGenderToFHIR(incident.survivorGender),
    birthDate: mapAgeGroupToBirthDate(incident.survivorAgeGroup),
  };
}

export function buildLocation(service: ReferralService): FHIRLocation {
  const categoryCode = mapServiceCategoryToFHIR(service.category);
  return {
    resourceType: "Location",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Location"],
      tag: [{ system: "https://tichlabs.com", code: "referral-service", display: "Referral Service" }],
    },
    name: service.name,
    description: service.description,
    address: service.address ? { line: [service.address], city: service.county } : undefined,
    telecom: service.phone ? [{ system: "phone", value: service.phone }] : undefined,
    managingOrganization: {
      display: categoryCode.display,
    },
  };
}

export function buildServiceRequest(
  incident: Incident,
  service: ReferralService,
  intent: "proposal" | "plan" = "proposal"
): FHIRServiceRequest {
  const categoryCode = mapServiceCategoryToFHIR(service.category);
  const id = resolveId(incident);
  return {
    resourceType: "ServiceRequest",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/ServiceRequest"],
      tag: [{ system: "https://tichlabs.com", code: "ai-recommended", display: "AI Recommended" }],
    },
    status: "draft",
    intent,
    code: {
      coding: [{ system: "https://tichlabs.com/service-category", code: categoryCode.code, display: categoryCode.display }],
      text: service.name,
    },
    subject: { reference: `urn:uuid:patient-${id}`, display: "Survivor" },
    requester: { reference: "https://tichlabs.com", display: "Tich Labs" },
    performer: [{ display: service.name }],
    locationReference: [{ display: service.county }],
    reasonCode: [
      { coding: [{ system: "http://snomed.info/sct", code: mapIncidentTypeToFHIR(incident.incidentType).code, display: mapIncidentTypeToFHIR(incident.incidentType).display }] },
    ],
    note: [{ text: `AI-recommended referral to ${service.name} for ${incident.incidentType.replace(/_/g, " ")} incident` }],
  };
}

export function buildConsent(incident: Incident): FHIRConsent {
  const id = resolveId(incident);
  const creationTime = ((incident as unknown) as Record<string, unknown>)._creationTime as number
    ?? Date.now();
  return {
    resourceType: "Consent",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Consent"],
      tag: [{ system: "https://tichlabs.com", code: "consent", display: "Consent" }],
    },
    status: "active",
    scope: {
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/consentscope", code: "patient-privacy", display: "Privacy Consent" }],
    },
    category: [
      {
        coding: [{ system: "http://terminology.hl7.org/CodeSystem/consentcategorycodes", code: "npp", display: "Notice of Privacy Practices" }],
      },
    ],
    patient: { reference: `urn:uuid:patient-${id}`, display: "Survivor" },
    dateTime: new Date(creationTime).toISOString(),
    policyRule: {
      coding: [{ system: "http://terminology.hl7.org/CodeSystem/v3-ActCode", code: "ANONY", display: "Anonymous" }],
    },
  };
}

export function generateBundle(incident: Incident, services: ReferralService[]): FHIRBundle {
  const entries: FHIRBundleEntry[] = [];
  const timestamp = new Date().toISOString();
  const incId = resolveId(incident);

  entries.push({
    fullUrl: `urn:uuid:observation-${incId}`,
    resource: buildObservation(incident),
    request: { method: "POST", url: "Observation" },
  });

  entries.push({
    fullUrl: `urn:uuid:patient-${incId}`,
    resource: buildPatient(incident),
    request: { method: "POST", url: "Patient" },
  });

  entries.push({
    fullUrl: `urn:uuid:consent-${incId}`,
    resource: buildConsent(incident),
    request: { method: "POST", url: "Consent" },
  });

  for (const svc of services) {
    const svcId = resolveServiceId(svc);
    entries.push({
      fullUrl: `urn:uuid:location-${svcId}`,
      resource: buildLocation(svc),
      request: { method: "POST", url: "Location" },
    });

    entries.push({
      fullUrl: `urn:uuid:servicerequest-${incId}-${svcId}`,
      resource: buildServiceRequest(incident, svc),
      request: { method: "POST", url: "ServiceRequest" },
    });
  }

  return {
    resourceType: "Bundle",
    meta: {
      profile: ["http://hl7.org/fhir/StructureDefinition/Bundle"],
      tag: [{ system: "https://tichlabs.com", code: "sgbv-bundle", display: "SGBV Referral Bundle" }],
    },
    type: "transaction",
    timestamp,
    entry: entries,
  };
}

export async function generateFHIRBundle(input: GenerateFHIRBundleInput): Promise<{
  bundle: FHIRBundle;
  summary: string;
  submissionResult?: { success: boolean; entries: { resourceType: string; status: number; location?: string; id?: string }[]; error?: string };
}> {
  const { incident: incidentObj, matchedServiceIds, fhirServerUrl, fhirToken, patientId } = input;

  if (!incidentObj) {
    return {
      bundle: {
        resourceType: "Bundle",
        type: "collection",
        timestamp: new Date().toISOString(),
        entry: [],
      },
      summary: "No incident data provided",
    };
  }

  let matchedServices: ReferralService[] = [];
  if (input.includeReferrals && matchedServiceIds && matchedServiceIds.length > 0) {
    const all = await getActiveServices();
    matchedServices = all.filter((s) => matchedServiceIds.includes(s._id) || matchedServiceIds.includes(resolveServiceId(s)));
  }

  const bundle = generateBundle(incidentObj as Incident, matchedServices);
  const summary = `Generated FHIR Bundle with ${bundle.entry?.length ?? 0} resources (1 Observation, 1 Patient, 1 Consent, ${matchedServices.length * 2} Location/ServiceRequest pairs)`;

  let submissionResult;
  if (fhirServerUrl && fhirToken) {
    submissionResult = await submitBundleToFHIR(bundle as unknown as Record<string, unknown>, {
      fhirUrl: fhirServerUrl,
      fhirToken,
      patientId,
    });
  }

  return { bundle, summary, submissionResult };
}
