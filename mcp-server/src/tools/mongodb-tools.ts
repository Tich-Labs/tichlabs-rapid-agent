import { z } from "zod";
import { getMongoClient, getMongoCollection } from "../lib/mongodb.js";

export const StoreCaseDocumentInput = z.object({
  incidentId: z.string().describe("Unique incident identifier"),
  incidentType: z.string().describe("Type of incident"),
  description: z.string().describe("Full case narrative/description"),
  location: z.string().describe("Location of the incident"),
  survivorAgeGroup: z.string().optional().describe("Age group of survivor"),
  survivorGender: z.string().optional().describe("Gender of survivor"),
  status: z.string().optional().describe("Case workflow status"),
  riskScore: z.number().optional().describe("Risk assessment score (0-100)"),
  severity: z.string().optional().describe("Severity level"),
  tags: z.array(z.string()).optional().describe("Tags for categorization"),
});

export const SearchCaseDocumentsInput = z.object({
  query: z.string().describe("Search query (text or semantic)"),
  limit: z.number().optional().default(10).describe("Max results"),
  incidentType: z.string().optional().describe("Filter by incident type"),
  location: z.string().optional().describe("Filter by location"),
  status: z.string().optional().describe("Filter by case status"),
});

export const AggregateCasesInput = z.object({
  groupBy: z.enum(["incidentType", "location", "severity", "status", "month"]).describe("Field to group by"),
  limit: z.number().optional().default(20).describe("Max groups to return"),
});

export interface StoredCaseDocument {
  id: string;
  incidentId: string;
  incidentType: string;
  description: string;
  location: string;
  survivorAgeGroup?: string;
  survivorGender?: string;
  status: string;
  riskScore?: number;
  severity?: string;
  tags: string[];
  createdAt: string;
  updatedAt: string;
}

export interface SearchResult {
  document: StoredCaseDocument;
  score: number;
  highlights: string[];
}

export interface AggregationBucket {
  key: string;
  count: number;
  avgRiskScore: number;
  topTypes: { type: string; count: number }[];
}

async function ensureCollection(): Promise<ReturnType<typeof getMongoCollection>> {
  const db = await getMongoClient();
  const collection = db.collection("case_documents");

  try {
    await collection.createIndex({ incidentId: 1 }, { unique: true });
    await collection.createIndex({ incidentType: 1 });
    await collection.createIndex({ location: 1 });
    await collection.createIndex({ status: 1 });
    await collection.createIndex({ severity: 1 });
    await collection.createIndex({ tags: 1 });
    await collection.createIndex({ createdAt: -1 });
    await collection.createIndex(
      { description: "text", location: "text", tags: "text" },
      { name: "text_search" }
    );
  } catch {
    // indices may already exist
  }

  return collection;
}

export async function storeCaseDocument(
  input: z.infer<typeof StoreCaseDocumentInput>
): Promise<{ success: boolean; document: StoredCaseDocument; action: "created" | "updated" }> {
  const collection = await ensureCollection();
  const now = new Date().toISOString();

  const doc: StoredCaseDocument = {
    id: input.incidentId,
    incidentId: input.incidentId,
    incidentType: input.incidentType,
    description: input.description,
    location: input.location,
    survivorAgeGroup: input.survivorAgeGroup,
    survivorGender: input.survivorGender,
    status: input.status || "reported",
    riskScore: input.riskScore,
    severity: input.severity,
    tags: input.tags || [],
    createdAt: now,
    updatedAt: now,
  };

  const existing = await collection.findOne({ incidentId: input.incidentId });

  if (existing) {
    await collection.updateOne(
      { incidentId: input.incidentId },
      { $set: { ...doc, createdAt: existing.createdAt, updatedAt: now } }
    );
    return { success: true, document: doc, action: "updated" };
  }

  await collection.insertOne(doc as any);
  return { success: true, document: doc, action: "created" };
}

export async function searchCaseDocuments(
  input: z.infer<typeof SearchCaseDocumentsInput>
): Promise<{ results: SearchResult[]; totalCount: number }> {
  const collection = await ensureCollection();

  const filter: Record<string, unknown> = {};
  if (input.incidentType) filter.incidentType = input.incidentType;
  if (input.location) filter.location = input.location;
  if (input.status) filter.status = input.status;

  let results: SearchResult[] = [];
  let totalCount = 0;

  if (input.query && input.query.trim().length > 0) {
    const cursor = collection.find(
      { $text: { $search: input.query }, ...filter },
      {
        projection: { score: { $meta: "textScore" } },
        sort: { score: { $meta: "textScore" } },
        limit: input.limit,
      }
    );

    const docs = await cursor.toArray();
    totalCount = docs.length;

    results = docs.map((doc: any) => {
      const highlights: string[] = [];
      const desc = doc.description || "";
      const queryTerms = input.query.toLowerCase().split(/\s+/);

      for (const term of queryTerms) {
        const idx = desc.toLowerCase().indexOf(term);
        if (idx >= 0) {
          const start = Math.max(0, idx - 30);
          const end = Math.min(desc.length, idx + term.length + 30);
          highlights.push("..." + desc.slice(start, end) + "...");
        }
      }

      return {
        document: doc as unknown as StoredCaseDocument,
        score: doc.score || 0,
        highlights: highlights.slice(0, 3),
      };
    });
  } else {
    const cursor = collection.find(filter, {
      sort: { createdAt: -1 },
      limit: input.limit,
    });

    const docs = await cursor.toArray();
    totalCount = await collection.countDocuments(filter);

    results = docs.map((doc: any) => ({
      document: doc as unknown as StoredCaseDocument,
      score: 0,
      highlights: [],
    }));
  }

  return { results, totalCount };
}

export async function aggregateCases(
  input: z.infer<typeof AggregateCasesInput>
): Promise<{ buckets: AggregationBucket[]; totalCases: number }> {
  const collection = await ensureCollection();
  const totalCases = await collection.countDocuments({});

  const pipeline: any[] = [
    {
      $group: {
        _id: `$${input.groupBy}`,
        count: { $sum: 1 },
        avgRiskScore: { $avg: "$riskScore" },
        types: { $push: "$incidentType" },
      },
    },
    { $sort: { count: -1 } },
    { $limit: input.limit },
  ];

  const aggregated = await collection.aggregate(pipeline).toArray();

  const buckets: AggregationBucket[] = aggregated.map((row: any) => {
    const typeCounts: Record<string, number> = {};
    for (const t of (row.types || [])) {
      typeCounts[t] = (typeCounts[t] || 0) + 1;
    }
    const sorted = Object.entries(typeCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([type, count]) => ({ type, count }));

    return {
      key: row._id || "unknown",
      count: row.count,
      avgRiskScore: Math.round((row.avgRiskScore || 0) * 10) / 10,
      topTypes: sorted,
    };
  });

  return { buckets, totalCases };
}
