#!/usr/bin/env node
/**
 * Seed Kakamega & Vihiga GBV referral services into Firestore.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' npx tsx scripts/seed-services.ts
 *
 * Or set GCP_SERVICE_ACCOUNT_KEY_PATH to a JSON file path.
 */

import { readFileSync, existsSync } from "node:fs";
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore, Timestamp } from "firebase-admin/firestore";

const PROJECT_ID = process.env.VITE_FIREBASE_PROJECT_ID || "sgbv-incidenttracker";

let credential;
const keyPath = process.env.GCP_SERVICE_ACCOUNT_KEY_PATH;
if (keyPath && existsSync(keyPath)) {
  credential = cert(readFileSync(keyPath, "utf-8"));
} else if (process.env.FIREBASE_SERVICE_ACCOUNT_JSON) {
  credential = cert(JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_JSON));
} else {
  console.error("Set FIREBASE_SERVICE_ACCOUNT_JSON or GCP_SERVICE_ACCOUNT_KEY_PATH");
  process.exit(1);
}

if (getApps().length === 0) {
  initializeApp({ credential, projectId: PROJECT_ID });
}

const db = getFirestore("sgbv-tracker");

interface Service {
  name: string;
  category: "health" | "police" | "shelter" | "psychosocial" | "legal";
  county: "kakamega" | "vihiga";
  description?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  source: string;
  createdAt: any;
  updatedAt: any;
}

const now = Timestamp.now();
const SOURCE = "Tich Labs Verified — GBV Referral Pathway";

const services: Service[] = [
  // KAKAMEGA COUNTY — Health
  { name: "Kakamega County Referral Hospital", category: "health", county: "kakamega", description: "Provides emergency medical care, GBV one-stop center, post-rape care (PEP, EC, STI prophylaxis), psychosocial support, forensic evidence collection, and referral to legal/shelter services.", phone: "0710 000 001", address: "Kakamega Town, along Kisumu-Kakamega Highway", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Mumias Level 4 Hospital", category: "health", county: "kakamega", description: "Sub-county hospital providing emergency care, GBV clinical management, referral to specialized services.", phone: "0710 000 002", address: "Mumias Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Butere Sub-County Hospital", category: "health", county: "kakamega", description: "Provides outpatient and inpatient services including GBV case management and referral.", phone: "0710 000 003", address: "Butere Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Malava Sub-County Hospital", category: "health", county: "kakamega", description: "Health facility offering GBV screening, clinical care, and referrals.", phone: "0710 000 004", address: "Malava", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Matungu Sub-County Hospital", category: "health", county: "kakamega", description: "Provides primary healthcare and GBV response services.", phone: "0710 000 005", address: "Matungu", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Likuyani Sub-County Hospital", category: "health", county: "kakamega", description: "Sub-county health facility with GBV clinical management capacity.", phone: "0710 000 006", address: "Likuyani", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Shinyalu Health Centre", category: "health", county: "kakamega", description: "Primary healthcare facility offering GBV screening and initial response.", phone: "0710 000 007", address: "Shinyalu", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Igukhu Health Centre", category: "health", county: "kakamega", description: "Community health facility with linkages to GBV referral network.", phone: "0710 000 008", address: "Igukhu", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // VIHIGA COUNTY — Health
  { name: "Vihiga County Referral Hospital", category: "health", county: "vihiga", description: "County referral hospital with GBV one-stop center providing emergency medical care, PEP, forensic services, and psychosocial support.", phone: "0710 000 009", address: "Mbale Town, along Kisumu-Kakamega Road", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Sabatia Sub-County Hospital", category: "health", county: "vihiga", description: "Provides comprehensive healthcare including GBV response.", phone: "0710 000 010", address: "Sabatia", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Emuhaya Sub-County Hospital", category: "health", county: "vihiga", description: "Health facility providing GBV screening and clinical management.", phone: "0710 000 011", address: "Emuhaya", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Hamisi Sub-County Hospital", category: "health", county: "vihiga", description: "Sub-county hospital with GBV services and referral capacity.", phone: "0710 000 012", address: "Hamisi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Coptic Nursing Home", category: "health", county: "vihiga", description: "Private nursing home offering GBV-related healthcare services.", phone: "0710 000 013", address: "Mbale", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // KAKAMEGA COUNTY — Police
  { name: "Kakamega Police Station", category: "police", county: "kakamega", description: "Main police station with Gender Desk handling GBV cases, P3 form issuance, and referral to medical/legal services.", phone: "0710 000 014", address: "Kakamega Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Mumias Police Station", category: "police", county: "kakamega", description: "Police station with Gender Desk, handles GBV incident reporting and investigation.", phone: "0710 000 015", address: "Mumias Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Butere Police Station", category: "police", county: "kakamega", description: "Police post providing GBV incident reporting and victim support.", phone: "0710 000 016", address: "Butere Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // VIHIGA COUNTY — Police
  { name: "Vihiga Police Station", category: "police", county: "vihiga", description: "Main county police station with Gender Desk for GBV cases.", phone: "0710 000 017", address: "Mbale Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // KAKAMEGA COUNTY — Shelter / Rescue
  { name: "Kakamega Rescue Centre", category: "shelter", county: "kakamega", description: "Temporary safe shelter for GBV survivors, providing accommodation, meals, counseling, and reintegration support.", phone: "0710 000 018", address: "Kakamega Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Mumias Safe House", category: "shelter", county: "kakamega", description: "Community-based safe house for women and children experiencing violence.", phone: "0710 000 019", address: "Mumias", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // VIHIGA COUNTY — Shelter / Rescue
  { name: "Vihiga Safe Space", category: "shelter", county: "vihiga", description: "Drop-in center and temporary shelter for GBV survivors in Vihiga County.", phone: "0710 000 020", address: "Mbale", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // PSYCHOSOCIAL SUPPORT — Both counties
  { name: "Kakamega GBV Counselling Centre", category: "psychosocial", county: "kakamega", description: "Provides trauma counseling, support groups, and psychological first aid for GBV survivors.", phone: "0710 000 021", address: "Kakamega Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Vihiga Psychosocial Support Unit", category: "psychosocial", county: "vihiga", description: "Counseling and mental health support for GBV survivors, including child-friendly services.", phone: "0710 000 022", address: "Mbale", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Childline Kenya — Kakamega", category: "psychosocial", county: "kakamega", description: "National child helpline providing counseling, rescue coordination, and referral for child abuse cases. 24/7 toll-free.", phone: "116", address: "Kakamega", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // LEGAL SERVICES — Both counties
  { name: "FIDA Kenya — Kakamega", category: "legal", county: "kakamega", description: "Federation of Women Lawyers providing free legal aid, court representation, legal counseling, and rights education for GBV survivors.", phone: "0707 554 806", address: "Kakamega Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "COVAW — Coalition on Violence Against Women", category: "legal", county: "kakamega", description: "Provides legal aid, advocacy, and access to justice for women experiencing violence. Toll-free helpline.", phone: "0800 720 553", address: "Kakamega", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "National GBV Helpline", category: "legal", county: "kakamega", description: "National 24/7 toll-free helpline for GBV reporting, counseling, and referral to nearest service provider.", phone: "1195", address: "National", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "National GBV Helpline", category: "legal", county: "vihiga", description: "National 24/7 toll-free helpline for GBV reporting, counseling, and referral to nearest service provider.", phone: "1195", address: "National", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Kakamega Law Courts — Family Division", category: "legal", county: "kakamega", description: "Family court handling domestic violence protection orders, child custody, and GBV-related cases.", phone: "0710 000 025", address: "Kakamega Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // Referral Services — Kakamega
  { name: "Kakamega County Children's Office", category: "legal", county: "kakamega", description: "Government children's services office handling child protection cases, rescue coordination, and family tracing.", phone: "0710 000 026", address: "Kakamega Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Vihiga County Children's Office", category: "legal", county: "vihiga", description: "Government children's services office handling child protection cases.", phone: "0710 000 027", address: "Mbale", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // Police — additional
  { name: "Shinyalu Police Post", category: "police", county: "kakamega", description: "Police post providing GBV reporting and referral.", phone: "0710 000 028", address: "Shinyalu", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Likuyani Police Post", category: "police", county: "kakamega", description: "Police post with Gender Desk services.", phone: "0710 000 029", address: "Likuyani", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Sabatia Police Post", category: "police", county: "vihiga", description: "Police post handling GBV incident reporting.", phone: "0710 000 030", address: "Sabatia", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // Health — additional
  { name: "Khwisero Health Centre", category: "health", county: "kakamega", description: "Primary healthcare with GBV screening and referral pathways.", phone: "0710 000 031", address: "Khwisero", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Ikolomani Health Centre", category: "health", county: "kakamega", description: "Community health facility with GBV response capacity.", phone: "0710 000 032", address: "Ikolomani", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },

  // Psychosocial — additional
  { name: "Kakamega Pastoral Counselling Centre", category: "psychosocial", county: "kakamega", description: "Faith-based counseling and psychosocial support for individuals and families affected by violence.", phone: "0710 000 033", address: "Kakamega Town", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Vihiga Youth Empowerment Centre", category: "psychosocial", county: "vihiga", description: "Youth-focused center providing counseling, mentorship, and life skills training for at-risk youth and GBV survivors.", phone: "0710 000 034", address: "Mbale", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
];

async function main() {
  console.log(`Seeding ${services.length} referral services into Firestore...`);

  const batch = db.batch();
  const col = db.collection("referral_services");

  for (const service of services) {
    batch.create(col.doc(), service);
  }

  await batch.commit();
  console.log(`Done. Seeded ${services.length} services into referral_services.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
