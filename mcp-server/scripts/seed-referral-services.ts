#!/usr/bin/env node
// Seed referral_services into Firestore from db_export/referralServices/documents.jsonl
import { readFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, initializeApp } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

const __dirname = dirname(fileURLToPath(import.meta.url));
const JSON_PATH = resolve(__dirname, "..", "..", "db_export", "referralServices", "documents.jsonl");

async function main() {
  const raw = readFileSync(JSON_PATH, "utf-8");
  const lines = raw.trim().split("\n").filter(Boolean);

  if (lines.length === 0) {
    console.error("No lines found in documents.jsonl");
    process.exit(1);
  }

  let json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!json && path && existsSync(path)) {
    json = readFileSync(path, "utf-8");
  }

  if (!json) {
    console.error("FIREBASE_SERVICE_ACCOUNT_JSON env var (or FIREBASE_SERVICE_ACCOUNT_PATH) is required");
    process.exit(1);
  }

  const app = initializeApp({ credential: cert(JSON.parse(json)) });
  const db = getFirestore(app);

  let count = 0;
  for (const line of lines) {
    const doc = JSON.parse(line);
    const data = {
      name: doc.name ?? "",
      category: doc.category ?? "health",
      county: doc.county ?? "kakamega",
      description: doc.description ?? "",
      phone: doc.phone ?? null,
      address: doc.address ?? null,
      is_active: doc.isActive ?? true,
    };
    await db.collection("referral_services").add(data);
    count++;
    console.log(`[${count}/${lines.length}] ${data.name} (${data.category}, ${data.county})`);
  }

  console.log(`\nDone. ${count} services imported.`);
  process.exit(0);
}

main();
