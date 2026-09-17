// Pushes the local seed JSON (data/seed/*.json) into Supabase.
// Run after applying supabase/schema.sql:
//   node scripts/seed.mjs
//
// Reads NEXT_PUBLIC_SUPABASE_URL + (SUPABASE_SERVICE_ROLE_KEY, falling back
// to NEXT_PUBLIC_SUPABASE_ANON_KEY) from .env.local.

import { createClient } from "@supabase/supabase-js";
import { readFileSync, readdirSync } from "fs";
import { fileURLToPath } from "url";
import path from "path";
import dotenv from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
dotenv.config({ path: path.join(__dirname, "..", ".env.local") });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error(
    "Missing Supabase config. Set NEXT_PUBLIC_SUPABASE_URL and either " +
      "SUPABASE_SERVICE_ROLE_KEY or NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local first."
  );
  process.exit(1);
}

const supabase = createClient(url, key);
const seedDir = path.join(__dirname, "..", "data", "seed");
const index = JSON.parse(readFileSync(path.join(seedDir, "index.json"), "utf-8"));

async function main() {
  for (const entry of index) {
    const unit = JSON.parse(readFileSync(path.join(seedDir, `${entry.slug}.json`), "utf-8"));

    const { data: subject, error: subjectErr } = await supabase
      .from("subjects")
      .upsert(
        { slug: entry.slug, name: entry.name, semester: 1, sort_order: entry.order },
        { onConflict: "slug" }
      )
      .select()
      .single();

    if (subjectErr) {
      console.error(`Failed to upsert subject ${entry.slug}:`, subjectErr.message);
      continue;
    }

    const { data: unitRow, error: unitErr } = await supabase
      .from("units")
      .upsert(
        {
          subject_id: subject.id,
          unit_number: unit.unit_number,
          unit_label: unit.unit_label,
          unit_title: unit.unit_title,
          learning_outcomes: unit.learning_outcomes_raw,
          summary: unit.summary,
          keywords: unit.keywords,
          self_assessment_questions: unit.self_assessment_questions,
          references_text: unit.references,
          raw_text: unit.raw_text,
          sort_order: Number(unit.unit_number) || 1,
        },
        { onConflict: "subject_id,unit_number" }
      )
      .select()
      .single();

    if (unitErr) {
      console.error(`Failed to upsert unit for ${entry.slug}:`, unitErr.message);
      continue;
    }

    for (let i = 0; i < unit.subtopics.length; i++) {
      const st = unit.subtopics[i];
      const { error: stErr } = await supabase.from("subtopics").upsert(
        {
          unit_id: unitRow.id,
          number: st.number,
          title: st.title,
          content: st.content,
          sort_order: i,
        },
        { onConflict: "unit_id,number" }
      );
      if (stErr) {
        console.error(`Failed to upsert subtopic ${st.number} for ${entry.slug}:`, stErr.message);
      }
    }

    console.log(`Seeded ${entry.name}: ${unit.subtopics.length} subtopics`);
  }
  console.log("\nDone.");
}

main();
