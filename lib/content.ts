import { readFile } from "fs/promises";
import path from "path";
import { getSupabase, isSupabaseConfigured } from "./supabase";
import type { Subject, Unit } from "./types";

const SEED_DIR = path.join(process.cwd(), "data", "seed");

async function readSeedIndex(): Promise<Subject[]> {
  const raw = await readFile(path.join(SEED_DIR, "index.json"), "utf-8");
  return JSON.parse(raw);
}

async function readSeedUnit(slug: string): Promise<Unit | null> {
  try {
    const raw = await readFile(path.join(SEED_DIR, `${slug}.json`), "utf-8");
    return JSON.parse(raw);
  } catch {
    return null;
  }
}

/**
 * Subjects, ordered for display. Reads from Supabase when configured,
 * otherwise from the bundled seed data - so the app runs out of the box
 * before you've set up a backend, and keeps working even if Supabase is
 * briefly unreachable (e.g. waking up from the free tier's idle pause).
 */
export async function getSubjects(): Promise<Subject[]> {
  const supabase = getSupabase();
  if (supabase) {
    try {
      const { data, error } = await supabase
        .from("subjects")
        .select("slug, name, sort_order")
        .order("sort_order", { ascending: true });
      if (!error && data && data.length > 0) {
        return data.map((d) => ({ slug: d.slug, name: d.name, order: d.sort_order }));
      }
    } catch {
      // Network hiccup or a cold-starting paused project - fall through
      // to local seed data rather than failing the page.
    }
  }
  const seed = await readSeedIndex();
  return [...seed].sort((a, b) => a.order - b.order);
}

async function getUnitFromSupabase(subjectSlug: string, unitNumber: string): Promise<Unit | null> {
  const supabase = getSupabase();
  if (!supabase) return null;

  try {
    const { data: subject } = await supabase
      .from("subjects")
      .select("id, slug, name")
      .eq("slug", subjectSlug)
      .maybeSingle();
    if (!subject) return null;

    const { data: unitRow } = await supabase
      .from("units")
      .select(
        "id, unit_number, unit_label, unit_title, learning_outcomes, summary, keywords, self_assessment_questions, references_text"
      )
      .eq("subject_id", subject.id)
      .eq("unit_number", unitNumber)
      .maybeSingle();
    if (!unitRow) return null;

    const { data: subtopics } = await supabase
      .from("subtopics")
      .select("number, title, content")
      .eq("unit_id", unitRow.id)
      .order("sort_order", { ascending: true });

    const list = subtopics ?? [];
    // raw_text isn't stored in Supabase - it's fully derivable from the
    // rest of the row, and skipping it keeps seed payloads smaller.
    // Reconstruct it here for the AI context and any other raw-text use.
    const raw_text = [
      `${unitRow.unit_label}: ${unitRow.unit_title}`,
      unitRow.learning_outcomes,
      ...list.map((s) => `${s.number} ${s.title}\n${s.content}`),
      unitRow.summary,
      unitRow.keywords,
      unitRow.self_assessment_questions,
      unitRow.references_text,
    ]
      .filter(Boolean)
      .join("\n\n");

    return {
      slug: subject.slug,
      subject: subject.name,
      unit_label: unitRow.unit_label,
      unit_number: unitRow.unit_number,
      unit_title: unitRow.unit_title,
      learning_outcomes_raw: unitRow.learning_outcomes,
      subtopics: list,
      summary: unitRow.summary,
      keywords: unitRow.keywords,
      self_assessment_questions: unitRow.self_assessment_questions,
      references: unitRow.references_text,
      raw_text,
    };
  } catch {
    // Network hiccup or a cold-starting paused project - fall through to
    // local seed data rather than failing the page.
    return null;
  }
}

/**
 * A single unit's full content (subtopics, summary, keywords, self
 * assessment, references) for a subject. `unitNumber` defaults to "1"
 * since that's all that exists today - later semesters just add more
 * unit numbers per subject.
 */
export async function getUnit(subjectSlug: string, unitNumber = "1"): Promise<Unit | null> {
  const fromSupabase = await getUnitFromSupabase(subjectSlug, unitNumber);
  if (fromSupabase) return fromSupabase;

  // Fallback: local seed data (also used when a subject/unit exists in
  // seed data but hasn't been pushed to Supabase yet, or Supabase is
  // temporarily unreachable).
  return readSeedUnit(subjectSlug);
}

export const usingSupabase = isSupabaseConfigured;
