#!/usr/bin/env node
/**
 * Seed script — Nairobi City County GBV Service Directory
 *
 * Reads structured data from the NCCG GBV Service Directory (November 2023)
 * and populates the Firestore `referral_services` collection.
 *
 * Usage:
 *   FIREBASE_SERVICE_ACCOUNT_JSON='{...}' npx tsx scripts/seed-nairobi-services.ts
 *
 * Schema reference — ReferralService (mcp-server/src/lib/firestore-admin.ts):
 *   name         string
 *   category     string   ('health','police','shelter','psychosocial','legal',
 *                          'economic_empowerment','hotline')
 *   county       string
 *   description  string?  (optional)
 *   phone        string?  (optional)
 *   address      string?  (optional)
 *   isActive     boolean  (all records seeded as true)
 *   source       string   (data provenance — 'NCCG GBV Service Directory, November 2023')
 */

import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { cert, initializeApp, getApps } from "firebase-admin/app";
import { getFirestore } from "firebase-admin/firestore";

// ── Data ──────────────────────────────────────────────────────────────────────

const COUNTY = "Nairobi";
const SOURCE = "NCCG GBV Service Directory, November 2023";

interface SeedEntry {
  name: string;
  phone?: string;
  description?: string;
  category: string;
  county: string;
  isActive: boolean;
  source: string;
}

/**
 * Map service flags from the directory to our category values.
 *
 * H/C → health       (Health / Clinical)
 * P/S → psychosocial  (Psychosocial Support)
 * E/E → economic_empowerment
 * S/S → shelter       (Safe Shelter)
 * L/S → legal         (Legal Services)
 */
const FLAG_MAP: Record<string, string> = {
  "H/C": "health",
  "P/S": "psychosocial",
  "E/E": "economic_empowerment",
  "S/S": "shelter",
  "L/S": "legal",
};

function buildEntries(): SeedEntry[] {
  const entries: SeedEntry[] = [];

  // ── Hotlines ──
  const hotlines: [string, string, string?][] = [
    ["Nairobi County", "1508"],
    ["National Police SGBV Hotline", "0800 730 999"],
    ["Police", "999/112"],
    ["National GBV Hotline", "1195"],
    ["Red Cross", "1199"],
    ["MSF France Lavender House", "0800 721100"],
    ["GVRC", "0800 720565"],
    ["Childline Kenya", "116"],
    ["COVAW GBV Toll Free Line", "0800 720 553"],
    ["FIDA SMS Platform", "21661"],
    ["Wangu Kanja Foundation", "1519"],
    ["LVCT Health", "1190"],
    ["Africa Youth Trust/ActionAid Kenya", 'SMS "HELP" to 21094'],
    ["Dan Shieshie Foundation", "1198"],
  ];

  for (const [name, phone, desc] of hotlines) {
    if (!name) continue;
    entries.push({
      name,
      phone,
      description: desc ?? `GBV hotline — ${name}`,
      category: "hotline",
      county: COUNTY,
      isActive: true,
      source: SOURCE,
    });
  }

  // ── Service Providers ──
  // [name, phone, flags[]]
  const providers: [string, string, string[]][] = [
    ["Advocates for Social Change (ADSOCK)", "020-5208323", []],
    ["Africa Youth Trust/ActionAid Kenya", 'SMS "HELP" to 21094', ["P/S"]],
    ["African Family Health (AFH)", "020-3755399", ["H/C", "P/S"]],
    ["ANPPCAN Kenya Chapter", "0202140010", ["P/S", "L/S"]],
    ["African Population and Health Research Center (APHRC)", "020400 1000", []],
    ["Badlisha Kenya Initiative", "0743-707843", []],
    ["Bar Hostess Empowerment and Support Programme (BHESP)", "020 2608944", ["H/C", "P/S"]],
    ["Beacon of Hope", "0723847248", ["P/S"]],
    ["Binti Africa Transformational Organisation", "0721-417547", ["P/S"]],
    ["Buru Buru child protection unit", "0215922601", ["S/S"]],
    ["By grace children's home", "0713-504460", ["S/S"]],
    ["CARE International", "020 2710069", ["P/S"]],
    ["Carolina For Kibera", "0710-472522", ["P/S", "E/E"]],
    ["Centre for Domestic Training and Development (CDTD)", "020-608085", ["P/S", "E/E"]],
    ["Centre for legal information and communication in Kenya (CLICK)", "020 38666073", ["L/S"]],
    ["Centre for Rights Education & Awareness (CREAW)", "020 3861016", ["P/S", "S/S", "L/S"]],
    ["Childrens Legal Action Network (CLAN)", "020-3869610", ["L/S"]],
    ["Churches United Against HIV and AIDS (CUAHA)", "020 238 6625", ["H/C", "P/S"]],
    ["Coalition on Violence Against Women (COVAW)", "0722-594794", ["P/S", "L/S"]],
    ["Community Mobilization for Economic Development", "020 2724004", ["E/E"]],
    ["Co-operation Arena for Sustainable Development in Africa (CASDA)", "0722-314436", ["P/S"]],
    ["Coptic Hospital (Hope Centre)", "0714220936", ["H/C", "P/S"]],
    ["Dandora Child Centered Space - CCF Kenya", "0721 676 663", ["P/S"]],
    ["Daughters of Kenya (DoK)", "0701 545895", ["P/S", "E/E"]],
    ["Daughters of Mumbi", "0726 335435", ["P/S", "L/S"]],
    ["Democracy & Legal Aid Centre", "0703731974", ["L/S"]],
    ["Destiny Rescue Centre", "0720-240330", ["S/S"]],
    ["Donholm SWOP Clinic", "0728-145231", ["H/C", "L/S"]],
    ["Eastleigh Wellness Centre", "0725 635121", ["H/C", "P/S", "E/E"]],
    ["EDAP Donholm", "0731-070863", ["H/C"]],
    ["Education Centre for Advancement of Women (ECAW)", "020 2114665", ["E/E", "L/S"]],
    ["Education Centre for Women in Democracy (ECWD)", "020 575539", ["E/E", "L/S"]],
    ["Engender Health", "020 4444922", ["H/C"]],
    ["Equality Now", "020 2719913", ["L/S"]],
    ["Fahari ya Jamii", "0722 258208", ["P/S"]],
    ["Federation of Women Lawyers (FIDA) Kenya", "0800720501", ["L/S"]],
    ["Fikiri Jamii/EDARP Doonholm", "0716151250", ["H/C"]],
    ["Finish Mission Kenya-Tunajali", "0723-436084", ["P/S"]],
    ["Forum For African Women Educationalist (FAWEK)", "020 3873131", ["E/E"]],
    ["Foundation For Health and Social Economic Development Africa (HESED)", "0722736637", ["H/C", "P/S"]],
    ["Gatina Dispensary", "0717-356708", ["H/C"]],
    ["Gertrude's", "0713-421203", ["H/C"]],
    ["Girl Child Network (GCN)", "020 604510", ["P/S", "E/E"]],
    ["Goal Kenya", "2723128", ["P/S", "S/S"]],
    ["Groots Kenya", "0719-220369", ["P/S", "E/E"]],
    ["Health Care Assistance Kenya", "0722 570308", ["H/C", "P/S", "E/E"]],
    ["HIAS", "0773363227", ["H/C", "S/S", "L/S"]],
    ["HOPE Worldwide Kenya", "0706-140117", ["H/C", "S/S"]],
    ["HOYMAS KENYA", "0721-580868", ["P/S"]],
    ["I'm Worth Defending (IWD)", "0724 973057", ["P/S", "E/E"]],
    ["International Justice Mission", "020 2014682", ["L/S"]],
    ["International Organisation for Migration (IOM)", "0709-889000", ["H/C"]],
    ["ISHTAR", "0717-580245", ["L/S"]],
    ["JINSIANGU", "0746-511756", ["H/C", "P/S"]],
    ["Kangemi Grassroots Human Rights", "0721-609699", ["L/S"]],
    ["Kangemi-Westlands Uhaki Paralegal Network (KWUPANET)", "0776-195759", ["L/S"]],
    ["Kasarani Anti GBV forum", "0700-261808", ["P/S", "E/E"]],
    ["Kasarani Young Mothers", "0727-324886", ["P/S"]],
    ["Kasarani Youth Association", "0717807329", ["P/S"]],
    ["Kayole safe shelter", "0722-344093", ["S/S"]],
    ["Kenya Human Rights Commission (KHRC)", "020 2044545", ["L/S"]],
    ["Kenya Legal and Ethical Issues Network on HIV and AIDS (KELIN)", "020-2515790", ["H/C", "L/S"]],
    ["Kenya Voluntary Women Rehabilitation Centre", "0202389696", ["P/S", "E/E"]],
    ["Kenya Women and Children's Wellness Centre (Jordan Foundation)", "0737-302963", ["P/S", "S/S"]],
    ["Kenya Youths Against Gender Violence", "0728 494495", ["P/S"]],
    ["Kenyan Peasant's League", "0721-609699", ["E/E"]],
    ["Kimbilio Trust", "0719 402 391", ["S/S"]],
    ["Kintsugi", "0715224608", ["P/S"]],
    ["Kituo cha Sheria", "0720-806531", ["L/S"]],
    ["Lea Toto", "0711-983462", ["H/C", "P/S"]],
    ["Maisha Girls Network", "0726-304569", ["P/S", "S/S"]],
    ["Maisha Talita Safe House", "0732-235500", ["S/S"]],
    ["Mama Ngina children's home", "020-60267", ["S/S"]],
    ["Mary Faith Children Centre", "0724-374487", ["S/S"]],
    ["Mary Rice Centre", "0752-158506", ["P/S", "S/S"]],
    ["Mater Hospital", "0735-108402", ["H/C"]],
    ["Médecins Sans Frontières (MSF)", "0800721100", ["H/C", "P/S"]],
    ["Medical Missionaries of Mary Health Centre", "0720-0352812", ["H/C"]],
    ["Mental 360", "0770-360360", ["P/S"]],
    ["Missionaries of Charity", "254702184444", ["S/S"]],
    ["MOYOTE", "0751-603687", ["H/C", "P/S"]],
    ["Mutuini Hospital", "0716-960159", ["H/C"]],
    ["Mwatate clinic", "0721-865802", ["H/C"]],
    ["Nairobi Women's Hospital - GVRC", "0703-081001", ["H/C", "P/S"]],
    ["NALEP", "0716-479921", ["E/E"]],
    ["National Police Service POLICARE", "0120-441292", ["H/C", "S/S"]],
    ["Nawiri Ladies", "0724-950714", ["E/E"]],
    ["NCCK", "0704873342", ["H/C", "P/S"]],
    ["Nest Shelter for Abused Girls", "0725-765978", ["P/S", "S/S"]],
    ["Nimoli Health Centre", "0722-641925", ["H/C", "P/S"]],
    ["Njoo Dada", "0720-149568", ["P/S", "S/S"]],
    ["Okoa Watoto Initiative", "0703818112", ["P/S"]],
    ["Open Door For Change", "0722 219463", ["S/S"]],
    ["Physicians for Human Rights (PHR)", "0735 002 211", ["H/C", "L/S"]],
    ["Redeemed Integrated Development Agency (RIDA)", "0101030324", ["P/S"]],
    ["Refuge Point", "0738-999270", ["H/C", "S/S"]],
    ["RefuSHE", "0731769094", ["P/S", "S/S", "L/S"]],
    ["Rescue Dada Centre", "020-767607", ["P/S", "S/S", "E/E"]],
    ["Reuben Center", "0724-459096", ["H/C"]],
    ["Riruta Health Centre", "0708-864011", ["H/C"]],
    ["Safe Spaces Rabai", "0722-715136", ["P/S", "S/S"]],
    ["Samaritan Medical services", "0725-047501", ["H/C"]],
    ["SAPTA", "0724-511709", ["P/S"]],
    ["Save a Girl Save a Generation", "0742-493776", ["P/S", "E/E"]],
    ["SHOFCO", "0703445737", ["H/C", "P/S", "S/S"]],
    ["Social Justice Center Working Group", "0789885948", ["L/S"]],
    ["SWOP", "0717-550455", ["H/C", "L/S"]],
    ["SWOP Ambassadors", "0726456726", ["H/C"]],
    ["Talia Agler Girls Shelter", "0110-095540", ["S/S"]],
    ["FEMNET", "020 2712971", ["E/E", "L/S"]],
    ["The Cradle", "0722220187", ["P/S", "L/S"]],
    ["Ujamaa Africa", "0725-878455", ["P/S", "E/E"]],
    ["Umoja wa Wamama wakimbizi", "0758-832829", ["P/S"]],
    ["Unity Upendo", "0717-710001", ["P/S"]],
    ["USIKIMYE", "0718-158400", ["H/C", "P/S"]],
    ["Uthiru/Muthua Health Centre", "0711-602591", ["H/C", "E/E"]],
    ["Waithaka Health Centre", "0715-649167", ["H/C", "P/S"]],
    ["Wangu Kanja Foundation", "0730-605200", ["H/C", "P/S", "S/S", "L/S"]],
    ["Wangunyu Safe Spaces/Shelter", "254721585885", ["S/S"]],
    ["Watoto Wenye Nguvu", "0714-344604", ["S/S"]],
    ["Wellness Compassion Kenya", "020-2450813", ["P/S"]],
    ["Wings of Compassion Rescue Homes", "0722-169994", ["S/S"]],
    ["Woman's Hope", "0737-333741", ["H/C", "S/S"]],
    ["Women's Empowerment Link (WEL)", "020 3864482", ["E/E", "L/S"]],
    ["Women's Rights Awareness Programme (WRAP)", "020 2050148", ["P/S", "L/S"]],
    ["Women's Hope Karen", "0737-333741", ["S/S"]],
    ["Zinduka Afrika", "020 605772", ["P/S", "E/E"]],
  ];

  for (const [name, phone, flags] of providers) {
    if (!name) continue;

    const categories = [...new Set(flags.map((f) => FLAG_MAP[f]).filter(Boolean))];

    for (const category of categories) {
      entries.push({
        name,
        phone,
        description: `${name} — ${category.replace(/_/g, " ")} services in Nairobi`,
        category,
        county: COUNTY,
        isActive: true,
        source: SOURCE,
      });
    }
  }

  return entries;
}

// ── Main ──────────────────────────────────────────────────────────────────────

async function main() {
  let json = process.env.FIREBASE_SERVICE_ACCOUNT_JSON;
  const path = process.env.FIREBASE_SERVICE_ACCOUNT_PATH;

  if (!json && path && existsSync(path)) {
    json = readFileSync(path, "utf-8");
  }

  if (!json) {
    console.error("FIREBASE_SERVICE_ACCOUNT_JSON env var (or FIREBASE_SERVICE_ACCOUNT_PATH) is required");
    process.exit(1);
  }

  const entries = buildEntries();
  console.log(`${entries.length} entries to seed (from ~${14 + 127} source rows)\n`);

  if (getApps().length === 0) {
    initializeApp({ credential: cert(JSON.parse(json)) });
  }
  const db = getFirestore();

  const BATCH_SIZE = 500;
  let written = 0;

  for (let i = 0; i < entries.length; i += BATCH_SIZE) {
    const batch = db.batch();
    const chunk = entries.slice(i, i + BATCH_SIZE);

    for (const entry of chunk) {
      const ref = db.collection("referral_services").doc();
      batch.set(ref, entry);
    }

    await batch.commit();
    written += chunk.length;
    console.log(`Seeding batch ${Math.floor(i / BATCH_SIZE) + 1} of ${Math.ceil(entries.length / BATCH_SIZE)}...`);
  }

  console.log(`\nDone. ${written} services written.`);
  process.exit(0);
}

main();
