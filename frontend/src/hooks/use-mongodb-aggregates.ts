import { useState, useEffect } from "react";
import { aggregateCases, type AggregationBucket } from "@/lib/mcp-client";

export interface MongodbAggregates {
  byType: AggregationBucket[];
  byLocation: AggregationBucket[];
  bySeverity: AggregationBucket[];
  byMonth: AggregationBucket[];
}

export function useMongodbAggregates() {
  const [data, setData] = useState<MongodbAggregates | null>(null);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  useEffect(() => {
    setStatus("loading");
    Promise.all([
      aggregateCases({ groupBy: "incidentType" }),
      aggregateCases({ groupBy: "location" }),
      aggregateCases({ groupBy: "severity" }),
      aggregateCases({ groupBy: "month" }),
    ])
      .then(([byType, byLocation, bySeverity, byMonth]) => {
        setData({ byType, byLocation, bySeverity, byMonth });
        setStatus("success");
      })
      .catch((err) => {
        console.warn("[MongoDB aggregates] unavailable — falling back to Firestore:", err?.message ?? err);
        setStatus("error");
      });
  }, []);

  return { data, status };
}
