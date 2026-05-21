// SHARP FHIR context handler for A2A agent integration
// Receives FHIR context from Prompt Opinion A2A message metadata
// and submits FHIR bundles to the connected FHIR server

export interface SHARPContext {
  fhirUrl: string;
  fhirToken: string;
  patientId?: string;
  fhirRefreshToken?: string;
  fhirRefreshTokenUrl?: string;
}

const SHARP_EXTENSION_URI =
  "https://app.promptopinion.ai/schemas/a2a/v1/fhir-context";

// Extract SHARP FHIR context from A2A message metadata
export function extractSHARPContext(
  metadata: Record<string, unknown> | undefined
): SHARPContext | null {
  if (!metadata) return null;

  const context = metadata[SHARP_EXTENSION_URI] as
    | Record<string, string>
    | undefined;

  if (!context || !context.fhirUrl || !context.fhirToken) return null;

  return {
    fhirUrl: context.fhirUrl,
    fhirToken: context.fhirToken,
    patientId: context.patientId,
    fhirRefreshToken: context.fhirRefreshToken,
    fhirRefreshTokenUrl: context.fhirRefreshTokenUrl,
  };
}

// Build the list of SMART scopes this agent requires
export function getRequiredSHARPScopes() {
  return [
    { name: "patient/Observation.rs", required: false },
    { name: "patient/Observation.write", required: false },
    { name: "patient/Patient.rs", required: false },
    { name: "patient/ServiceRequest.rs", required: false },
    { name: "patient/ServiceRequest.write", required: false },
    { name: "patient/Consent.rs", required: false },
    { name: "patient/Consent.write", required: false },
    { name: "patient/Location.rs", required: false },
  ];
}

// Submit a FHIR Bundle to the FHIR server using SHARP context credentials
export async function submitBundleToFHIR(
  bundle: Record<string, unknown>,
  context: SHARPContext
): Promise<{
  success: boolean;
  entries: { resourceType: string; status: number; location?: string; id?: string }[];
  error?: string;
}> {
  const { fhirUrl, fhirToken } = context;

  try {
    const response = await fetch(fhirUrl, {
      method: "POST",
      headers: {
        "Content-Type": "application/fhir+json",
        Authorization: `Bearer ${fhirToken}`,
      },
      body: JSON.stringify(bundle),
    });

    const result = await response.json();

    if (!response.ok) {
      return {
        success: false,
        entries: [],
        error: `FHIR server error (${response.status}): ${result?.issue?.[0]?.details?.text ?? result?.issue?.[0]?.diagnostics ?? JSON.stringify(result)}`,
      };
    }

    const entries = (result.entry ?? []).map(
      (entry: Record<string, unknown>) => {
        const resource = entry.resource as Record<string, unknown> | undefined;
        const responseEntry = entry.response as
          | Record<string, unknown>
          | undefined;
        return {
          resourceType: (resource?.resourceType as string) ?? "unknown",
          status: (responseEntry?.status as number) ?? 0,
          location: responseEntry?.location as string | undefined,
          id: resource?.id as string | undefined,
        };
      }
    );

    return { success: true, entries };
  } catch (err) {
    return {
      success: false,
      entries: [],
      error: `Network error submitting to FHIR server: ${err instanceof Error ? err.message : String(err)}`,
    };
  }
}

// Generate the SHARP extension declaration for the A2A Agent Card
export function buildSHARPExtensionDeclaration(
  required: boolean = false
) {
  return {
    uri: SHARP_EXTENSION_URI,
    description:
      "FHIR context allowing Tich Labs SGBV agent to query and write to a FHIR server securely",
    required,
    params: {
      scopes: getRequiredSHARPScopes(),
    },
  };
}
