#!/usr/bin/env node
/**
 * Seed Nairobi City County GBV referral services into Firestore.
 *
 * Data source: NCCG GBV Service Directory, November 2023
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{"type":"service_account",...}' npx tsx scripts/seed-nairobi-services.ts
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

type Category = "health" | "police" | "shelter" | "psychosocial" | "legal" | "hotline" | "economic_empowerment";

interface Service {
  name: string;
  category: Category;
  county: string;
  description?: string;
  phone?: string;
  address?: string;
  isActive: boolean;
  source: string;
  createdAt: any;
  updatedAt: any;
}

const now = Timestamp.now();
const SOURCE = "NCCG GBV Service Directory, November 2023";

// Flag → category mapping
// H/C → health | P/S → psychosocial | E/E → economic_empowerment | S/S → shelter | L/S → legal
type Flag = "H" | "P" | "E" | "S" | "L";
const FLAG_CATEGORY: Record<Flag, Category> = {
  H: "health",
  P: "psychosocial",
  E: "economic_empowerment",
  S: "shelter",
  L: "legal",
};

const FLAG_LABEL: Record<Flag, string> = {
  H: "Health/Clinical",
  P: "Psychosocial Support",
  E: "Economic Empowerment",
  S: "Shelter/Safe Space",
  L: "Legal Services",
};

function makeService(
  name: string,
  primaryFlag: Flag | null,
  flags: Flag[],
  phone: string,
  description?: string,
): Service {
  const category = primaryFlag ? FLAG_CATEGORY[primaryFlag] : "psychosocial";
  const allFlags = flags.length > 0
    ? `Services offered: ${flags.map((f) => FLAG_LABEL[f]).join(", ")}.`
    : "";
  return {
    name,
    category,
    county: "Nairobi",
    description: [allFlags, description].filter(Boolean).join(" ") || undefined,
    phone,
    address: "Nairobi",
    isActive: true,
    source: SOURCE,
    createdAt: now,
    updatedAt: now,
  };
}

// ─── Hotlines ─────────────────────────────────────────────────────────────────

const hotlines: Service[] = [
  { name: "Nairobi County", category: "hotline", county: "Nairobi", phone: "1508", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "National Police SGBV Hotline", category: "hotline", county: "Nairobi", phone: "0800 730 999", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Police", category: "hotline", county: "Nairobi", phone: "999/112", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "National GBV Hotline", category: "hotline", county: "Nairobi", phone: "1195", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Red Cross", category: "hotline", county: "Nairobi", phone: "1199", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "MSF France Lavender House", category: "hotline", county: "Nairobi", phone: "0800 721100", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "GVRC", category: "hotline", county: "Nairobi", phone: "0800 720565", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Childline Kenya", category: "hotline", county: "Nairobi", phone: "116", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "COVAW GBV Toll Free Line", category: "hotline", county: "Nairobi", phone: "0800 720 553", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "FIDA SMS Platform", category: "hotline", county: "Nairobi", phone: "21661", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Wangu Kanja Foundation", category: "hotline", county: "Nairobi", phone: "1519", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "LVCT Health", category: "hotline", county: "Nairobi", phone: "1190", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Africa Youth Trust/ActionAid Kenya", category: "hotline", county: "Nairobi", phone: 'SMS "HELP" to 21094', address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
  { name: "Dan Shieshie Foundation", category: "hotline", county: "Nairobi", phone: "1198", address: "Nairobi", isActive: true, source: SOURCE, createdAt: now, updatedAt: now },
];

// ─── Service Providers ────────────────────────────────────────────────────────
//
// Format: [name, primaryFlag (or null), flags[], phone]

const providers: Service[] = [
  // No flags ([])
  makeService("Advocates for Social Change (ADSOCK)", null, [], "020-5208323"),
  makeService("African Population and Health Research Center (APHRC)", null, [], "020400 1000"),
  makeService("Badlisha Kenya Initiative", null, [], "0743-707843"),

  // P/S only
  makeService("Africa Youth Trust/ActionAid Kenya", "P", ["P"], 'SMS "HELP" to 21094'),
  makeService("Beacon of Hope", "P", ["P"], "0723847248"),
  makeService("Binti Africa Transformational Organisation", "P", ["P"], "0721-417547"),
  makeService("CARE International", "P", ["P"], "020 2710069"),
  makeService("Fahari ya Jamii", "P", ["P"], "0722 258208"),
  makeService("Finish Mission Kenya-Tunajali", "P", ["P"], "0723-436084"),
  makeService("HOYMAS KENYA", "P", ["P"], "0721-580868"),
  makeService("I'm Worth Defending (IWD)", "P", ["P"], "0724 973057"),
  makeService("Kasarani Young Mothers", "P", ["P"], "0727-324886"),
  makeService("Kasarani Youth Association", "P", ["P"], "0717807329"),
  makeService("Kenya Youths Against Gender Violence", "P", ["P"], "0728 494495"),
  makeService("Kintsugi", "P", ["P"], "0715224608"),
  makeService("Okoa Watoto Initiative", "P", ["P"], "0703818112"),
  makeService("Redeemed Integrated Development Agency (RIDA)", "P", ["P"], "0101030324"),
  makeService("SAPTA", "P", ["P"], "0724-511709"),
  makeService("Umoja wa Wamama wakimbizi", "P", ["P"], "0758-832829"),
  makeService("Unity Upendo", "P", ["P"], "0717-710001"),
  makeService("Wellness Compassion Kenya", "P", ["P"], "020-2450813"),

  // H/C + P/S
  makeService("African Family Health (AFH)", "H", ["H", "P"], "020-3755399"),
  makeService("Bar Hostess Empowerment and Support Programme (BHESP)", "H", ["H", "P"], "020 2608944"),
  makeService("Churches United Against HIV and AIDS (CUAHA)", "H", ["H", "P"], "020 238 6625"),
  makeService("Coptic Hospital (Hope Centre)", "H", ["H", "P"], "0714220936"),
  makeService("Foundation For Health and Social Economic Development Africa (HESED)", "H", ["H", "P"], "0722736637"),
  makeService("JINSIANGU", "H", ["H", "P"], "0746-511756"),
  makeService("Lea Toto", "H", ["H", "P"], "0711-983462"),
  makeService("Médecins Sans Frontières (MSF)", "H", ["H", "P"], "0800721100"),
  makeService("MOYOTE", "H", ["H", "P"], "0751-603687"),
  makeService("Nairobi Women's Hospital - GVRC", "H", ["H", "P"], "0703-081001"),
  makeService("NCCK", "H", ["H", "P"], "0704873342"),
  makeService("Nimoli Health Centre", "H", ["H", "P"], "0722-641925"),
  makeService("USIKIMYE", "H", ["H", "P"], "0718-158400"),
  makeService("Waithaka Health Centre", "H", ["H", "P"], "0715-649167"),

  // P/S + L/S
  makeService("ANPPCAN Kenya Chapter", "P", ["P", "L"], "0202140010"),
  makeService("Coalition on Violence Against Women (COVAW)", "P", ["P", "L"], "0722-594794"),
  makeService("Daughters of Mumbi", "P", ["P", "L"], "0726 335435"),
  makeService("The Cradle", "P", ["P", "L"], "0722220187"),
  makeService("Women's Rights Awareness Programme (WRAP)", "P", ["P", "L"], "020 2050148"),

  // H/C only
  makeService("EDAP Donholm", "H", ["H"], "0731-070863"),
  makeService("Engender Health", "H", ["H"], "020 4444922"),
  makeService("Fikiri Jamii/EDARP Doonholm", "H", ["H"], "0716151250"),
  makeService("Gatina Dispensary", "H", ["H"], "0717-356708"),
  makeService("Gertrude's", "H", ["H"], "0713-421203"),
  makeService("International Organisation for Migration (IOM)", "H", ["H"], "0709-889000"),
  makeService("Mater Hospital", "H", ["H"], "0735-108402"),
  makeService("Medical Missionaries of Mary Health Centre", "H", ["H"], "0720-0352812"),
  makeService("Mutuini Hospital", "H", ["H"], "0716-960159"),
  makeService("Mwatate clinic", "H", ["H"], "0721-865802"),
  makeService("Reuben Center", "H", ["H"], "0724-459096"),
  makeService("Riruta Health Centre", "H", ["H"], "0708-864011"),
  makeService("Samaritan Medical services", "H", ["H"], "0725-047501"),
  makeService("SWOP Ambassadors", "H", ["H"], "0726456726"),

  // P/S + E/E
  makeService("Carolina For Kibera", "P", ["P", "E"], "0710-472522"),
  makeService("Centre for Domestic Training and Development (CDTD)", "P", ["P", "E"], "020-608085"),
  makeService("Girl Child Network (GCN)", "P", ["P", "E"], "020 604510"),
  makeService("Groots Kenya", "P", ["P", "E"], "0719-220369"),
  makeService("I'm Worth Defending (IWD)", "P", ["P", "E"], "0724 973057"),
  makeService("Kasarani Anti GBV forum", "P", ["P", "E"], "0700-261808"),
  makeService("Kenya Voluntary Women Rehabilitation Centre", "P", ["P", "E"], "0202389696"),
  makeService("Save a Girl Save a Generation", "P", ["P", "E"], "0742-493776"),
  makeService("Ujamaa Africa", "P", ["P", "E"], "0725-878455"),
  makeService("Zinduka Afrika", "P", ["P", "E"], "020 605772"),

  // S/S only
  makeService("Buru Buru child protection unit", "S", ["S"], "0215922601"),
  makeService("By grace children's home", "S", ["S"], "0713-504460"),
  makeService("Destiny Rescue Centre", "S", ["S"], "0720-240330"),
  makeService("Kayole safe shelter", "S", ["S"], "0722-344093"),
  makeService("Kimbilio Trust", "S", ["S"], "0719 402 391"),
  makeService("Maisha Talita Safe House", "S", ["S"], "0732-235500"),
  makeService("Mama Ngina children's home", "S", ["S"], "020-60267"),
  makeService("Mary Faith Children Centre", "S", ["S"], "0724-374487"),
  makeService("Missionaries of Charity", "S", ["S"], "254702184444"),
  makeService("Open Door For Change", "S", ["S"], "0722 219463"),
  makeService("Talia Agler Girls Shelter", "S", ["S"], "0110-095540"),
  makeService("Wangunyu Safe Spaces/Shelter", "S", ["S"], "254721585885"),
  makeService("Watoto Wenye Nguvu", "S", ["S"], "0714-344604"),
  makeService("Wings of Compassion Rescue Homes", "S", ["S"], "0722-169994"),
  makeService("Women's Hope Karen", "S", ["S"], "0737-333741"),

  // L/S only
  makeService("Centre for legal information and communication in Kenya (CLICK)", "L", ["L"], "020 38666073"),
  makeService("Childrens Legal Action Network (CLAN)", "L", ["L"], "020-3869610"),
  makeService("Democracy & Legal Aid Centre", "L", ["L"], "0703731974"),
  makeService("Equality Now", "L", ["L"], "020 2719913"),
  makeService("Federation of Women Lawyers (FIDA) Kenya", "L", ["L"], "0800720501"),
  makeService("International Justice Mission", "L", ["L"], "020 2014682"),
  makeService("ISHTAR", "L", ["L"], "0717-580245"),
  makeService("Kangemi Grassroots Human Rights", "L", ["L"], "0721-609699"),
  makeService("Kangemi-Westlands Uhaki Paralegal Network (KWUPANET)", "L", ["L"], "0776-195759"),
  makeService("Kenya Human Rights Commission (KHRC)", "L", ["L"], "020 2044545"),
  makeService("Kituo cha Sheria", "L", ["L"], "0720-806531"),
  makeService("Social Justice Center Working Group", "L", ["L"], "0789885948"),

  // E/E only
  makeService("Community Mobilization for Economic Development", "E", ["E"], "020 2724004"),
  makeService("Forum For African Women Educationalist (FAWEK)", "E", ["E"], "020 3873131"),
  makeService("Kenyan Peasant's League", "E", ["E"], "0721-609699"),
  makeService("NALEP", "E", ["E"], "0716-479921"),
  makeService("Nawiri Ladies", "E", ["E"], "0724-950714"),

  // H/C + E/E
  makeService("Uthiru/Muthua Health Centre", "H", ["H", "E"], "0711-602591"),

  // H/C + S/S
  makeService("HOPE Worldwide Kenya", "H", ["H", "S"], "0706-140117"),
  makeService("National Police Service POLICARE", "H", ["H", "S"], "0120-441292"),
  makeService("Refuge Point", "H", ["H", "S"], "0738-999270"),
  makeService("Woman's Hope", "H", ["H", "S"], "0737-333741"),

  // H/C + L/S
  makeService("Donholm SWOP Clinic", "H", ["H", "L"], "0728-145231"),
  makeService("Kenya Legal and Ethical Issues Network on HIV and AIDS (KELIN)", "H", ["H", "L"], "020-2515790"),
  makeService("Physicians for Human Rights (PHR)", "H", ["H", "L"], "0735 002 211"),
  makeService("SWOP", "H", ["H", "L"], "0717-550455"),

  // H/C + P/S + E/E
  makeService("Eastleigh Wellness Centre", "H", ["H", "P", "E"], "0725 635121"),
  makeService("Health Care Assistance Kenya", "H", ["H", "P", "E"], "0722 570308"),

  // E/E + L/S
  makeService("Education Centre for Advancement of Women (ECAW)", "E", ["E", "L"], "020 2114665"),
  makeService("Education Centre for Women in Democracy (ECWD)", "E", ["E", "L"], "020 575539"),
  makeService("FEMNET", "E", ["E", "L"], "020 2712971"),
  makeService("Women's Empowerment Link (WEL)", "E", ["E", "L"], "020 3864482"),

  // H/C + P/S + S/S
  makeService("SHOFCO", "H", ["H", "P", "S"], "0703445737"),

  // P/S + S/S
  makeService("Goal Kenya", "P", ["P", "S"], "2723128"),
  makeService("Kenya Women and Children's Wellness Centre (Jordan Foundation)", "P", ["P", "S"], "0737-302963"),
  makeService("Maisha Girls Network", "P", ["P", "S"], "0726-304569"),
  makeService("Mary Rice Centre", "P", ["P", "S"], "0752-158506"),
  makeService("Nest Shelter for Abused Girls", "P", ["P", "S"], "0725-765978"),
  makeService("Njoo Dada", "P", ["P", "S"], "0720-149568"),
  makeService("Safe Spaces Rabai", "P", ["P", "S"], "0722-715136"),

  // P/S + S/S + L/S
  makeService("Centre for Rights Education & Awareness (CREAW)", "P", ["P", "S", "L"], "020 3861016"),
  makeService("RefuSHE", "P", ["P", "S", "L"], "0731769094"),

  // P/S + S/S + E/E
  makeService("Rescue Dada Centre", "P", ["P", "S", "E"], "020-767607"),

  // P/S + E/E
  makeService("Daughters of Kenya (DoK)", "P", ["P", "E"], "0701 545895"),

  // H/C + S/S + L/S
  makeService("HIAS", "H", ["H", "S", "L"], "0773363227"),

  // H/C + P/S + S/S + L/S
  makeService("Wangu Kanja Foundation", "H", ["H", "P", "S", "L"], "0730-605200"),

  // P/S only — Mental 360 is psychological/counselling
  makeService("Mental 360", "P", ["P"], "0770-360360"),

  // P/S only — Dandora CCF
  makeService("Dandora Child Centered Space - CCF Kenya", "P", ["P"], "0721 676 663"),

  // P/S only — Co-operation Arena
  makeService("Co-operation Arena for Sustainable Development in Africa (CASDA)", "P", ["P"], "0722-314436"),
];

// ─── Deduplicate by name ──────────────────────────────────────────────────────

const allServices = [...hotlines, ...providers];

const seen = new Set<string>();
const unique: Service[] = [];
for (const svc of allServices) {
  if (!svc.name || svc.name.trim() === "") continue;
  const key = svc.name.toLowerCase().trim();
  if (seen.has(key)) continue;
  seen.add(key);
  unique.push(svc);
}

// ─── Write to Firestore in batches ────────────────────────────────────────────

const BATCH_SIZE = 500;

async function main() {
  console.log(`Seeding ${unique.length} Nairobi referral services into Firestore...`);

  const col = db.collection("referral_services");
  const totalBatches = Math.ceil(unique.length / BATCH_SIZE);

  for (let b = 0; b < totalBatches; b++) {
    const slice = unique.slice(b * BATCH_SIZE, (b + 1) * BATCH_SIZE);
    console.log(`Seeding batch ${b + 1} of ${totalBatches} (${slice.length} services)...`);

    const batch = db.batch();
    for (const service of slice) {
      const clean = Object.fromEntries(
        Object.entries(service).filter(([_, v]) => v !== undefined)
      );
      batch.create(col.doc(), clean);
    }
    await batch.commit();
  }

  console.log(`Done. ${unique.length} services written.`);
}

main().catch((err) => {
  console.error("Seed failed:", err);
  process.exit(1);
});
