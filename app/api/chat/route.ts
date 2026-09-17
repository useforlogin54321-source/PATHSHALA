import { NextRequest, NextResponse } from "next/server";

// Scoped-context AI assistant (see Phase 1 doc, "AI Architecture"):
// the model only ever sees the currently-open unit's text, plus a system
// prompt that requires it to stay inside that material and say plainly
// when a question falls outside it. No retrieval, no fine-tuning - the
// content is small enough to hand over directly.

const GEMINI_MODEL = "gemini-2.5-flash";

type ChatMessage = { role: "user" | "assistant"; content: string };

function buildSystemPrompt(unitContext: string, subjectName: string, unitTitle: string) {
  return `You are a study assistant for a BCA student, helping with the subject "${subjectName}", specifically "${unitTitle}".

The ONLY source of truth you may use is the syllabus material below. Follow these rules strictly:
1. Answer using only the material provided. Do not pull in outside facts, even if you're confident they're correct.
2. If the material below doesn't cover something the student asked, say so plainly - e.g. "That's not covered in this unit" - instead of guessing or answering from general knowledge. You may then offer to explain it as general (non-syllabus) knowledge if they want that.
3. Never contradict the terminology, definitions, or structure used in the material below, even if you know a different convention.
4. Where useful, mention which numbered sub-section (e.g. "1.3") your answer is drawn from, so the student can find it in their own material.
5. Explain things simply and in a student-friendly way - this is for revision and understanding, not a formal exam answer.
6. Keep answers reasonably concise unless the student asks for more depth.

--- UNIT MATERIAL START ---
${unitContext}
--- UNIT MATERIAL END ---`;
}

export async function POST(req: NextRequest) {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "GEMINI_API_KEY is not set on the server. Add it to .env.local and restart." },
      { status: 500 }
    );
  }

  const body = await req.json();
  const {
    messages,
    unitContext,
    subjectName,
    unitTitle,
  }: { messages: ChatMessage[]; unitContext: string; subjectName: string; unitTitle: string } =
    body;

  if (!messages?.length || !unitContext) {
    return NextResponse.json({ error: "Missing messages or unitContext" }, { status: 400 });
  }

  const systemPrompt = buildSystemPrompt(unitContext, subjectName, unitTitle);

  const contents = messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: m.content }],
  }));

  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { temperature: 0.3 },
      }),
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    console.error("Gemini API error:", errText);
    return NextResponse.json({ error: "The AI assistant is unavailable right now." }, { status: 502 });
  }

  const data = await res.json();
  const text: string =
    data?.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("") ??
    "I couldn't generate a response - try rephrasing the question.";

  return NextResponse.json({ reply: text });
}
