#!/usr/bin/env python3
"""
Parses unit PDFs (in the same folder-per-subject layout as the original
STUDY.zip: <subject name>/<something>.pdf, one PDF per subject/unit) into
the JSON shape lib/types.ts expects, and writes them into data/seed/.

Usage:
    python3 scripts/parse_units.py /path/to/STUDY

Re-running is safe - it overwrites the matching JSON file per subject.
Best-effort: always spot-check the output against the source PDF,
especially the subtopic split and the Summary/Keywords/Self-Assessment/
References sections, which rely on the source using a consistent
"N.M Heading" numbering style. If a PDF doesn't follow that pattern, it
will still get a title and full raw_text, just with subtopics: [].

Requires `pdftotext` (poppler-utils) on PATH.
"""
import re, json, sys, os, glob

def norm_label(label):
    # Punctuation-agnostic: 'Self – Assessment', 'Self-Assessment' and
    # 'Self Assessment' all normalize to 'self assessment'.
    return re.sub(r'[^a-z0-9]+', ' ', label.lower()).strip()


def classify_special(label_raw):
    """Substring-based rather than exact-match, so 'Keywords with
    Definitions', 'Self-Assessment Questions (Subjective)' and
    'Subjective Questions' are all recognised."""
    n = norm_label(label_raw)
    if 'self assessment' in n or 'subjective question' in n or 'self check' in n:
        return 'self_assessment_questions'
    if 'keyword' in n:
        return 'keywords'
    if n == 'summary' or n.startswith('summary'):
        return 'summary'
    if 'reference' in n or 'further reading' in n:
        return 'references'
    return None


STANDALONE_HEADING_RE = re.compile(
    r'(?m)^\s*(Summary|Keywords|Key\s*Words|Self[\s-]?Assessment\s*Questions(?:\s*\([^)]*\))?|'
    r'Self\s*Check\s*Questions|Subjective\s*Questions|References|Further\s*Reading)\s*$'
)


def extract_unnumbered_specials(body):
    """Some units (e.g. English) have Summary/Keywords/Self-Assessment/
    References as plain standalone headings with no number. Pulls those
    out and returns (remaining_body, specials)."""
    matches = list(STANDALONE_HEADING_RE.finditer(body))
    if not matches:
        return body, {}
    specials, cut_spans = {}, []
    for i, m in enumerate(matches):
        key = classify_special(m.group(1))
        if not key:
            continue
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        content = body[m.end():end].strip()
        if content:
            specials[key] = content
            cut_spans.append((m.start(), end))
    remaining, last = [], 0
    for a, b in sorted(cut_spans):
        remaining.append(body[last:a])
        last = b
    remaining.append(body[last:])
    return ''.join(remaining), specials


def clean_text(t):
    t = t.replace('\f', '\n')
    t = re.sub(r'[ \t]+\n', '\n', t)
    t = re.sub(r'\n{3,}', '\n\n', t)
    return t.strip()

def parse_file(txt_path, subject_name):
    with open(txt_path, 'r', encoding='utf-8', errors='ignore') as f:
        raw = f.read()
    text = clean_text(raw)
    lines = text.split('\n')

    title_line, title_idx = "", 0
    for i, l in enumerate(lines):
        if l.strip():
            title_line, title_idx = l.strip(), i
            break

    unit_match = re.match(r'^(Unit|Module)\s+(\d+)\s*[:\-]?\s*(.*)$', title_line, re.I)
    if unit_match:
        unit_label = f"{unit_match.group(1)} {unit_match.group(2)}"
        unit_title = unit_match.group(3).strip()
        unit_number = unit_match.group(2)
    else:
        unit_label, unit_title, unit_number = "Unit 1", title_line, "1"

    body = '\n'.join(lines[title_idx + 1:])
    body, unnumbered_specials = extract_unnumbered_specials(body)
    heading_re = re.compile(rf'(?m)^\s*{re.escape(unit_number)}\.(\d+)\s*([A-Za-z][^\n]*)$')
    matches = list(heading_re.finditer(body))

    sections = []
    for i, m in enumerate(matches):
        start = m.end()
        end = matches[i + 1].start() if i + 1 < len(matches) else len(body)
        sections.append({
            "number": f"{unit_number}.{m.group(1)}",
            "label_raw": m.group(2).strip(),
            "content": body[start:end].strip(),
        })

    subtopics, numbered_specials = [], {}
    for sec in sections:
        key = classify_special(sec["label_raw"])
        if key:
            # Ignore table-of-contents style entries (a heading with no
            # content after it) - they'd otherwise overwrite the real one.
            if sec["content"].strip() and len(sec["content"]) > len(numbered_specials.get(key, "")):
                numbered_specials[key] = sec["content"]
        elif len(sec["content"]) > 5:
            subtopics.append({"number": sec["number"], "title": sec["label_raw"], "content": sec["content"]})
    specials = {**unnumbered_specials, **numbered_specials}

    lo_block = ""
    lo_match = re.search(r'(Learning Outcomes|Learning Objectives)\s*:?\s*\n(.*?)(?:\nStructure\s*:|\Z)', body, re.I | re.S)
    if lo_match:
        lo_block = lo_match.group(2)[:4000].strip()

    return {
        "subject": subject_name,
        "unit_label": unit_label,
        "unit_number": unit_number,
        "unit_title": unit_title,
        "learning_outcomes_raw": lo_block,
        "subtopics": subtopics,
        "summary": specials.get("summary", ""),
        "keywords": specials.get("keywords", ""),
        "self_assessment_questions": specials.get("self_assessment_questions", ""),
        "references": specials.get("references", ""),
        "raw_text": text,
    }

def slugify(s):
    return re.sub(r'[^a-z0-9]+', '-', s.lower()).strip('-')

def main():
    if len(sys.argv) < 2:
        print("Usage: python3 scripts/parse_units.py /path/to/STUDY")
        sys.exit(1)

    src_dir = sys.argv[1]
    project_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
    out_dir = os.path.join(project_root, "data", "seed")
    os.makedirs(out_dir, exist_ok=True)
    tmp_dir = os.path.join(project_root, ".tmp_pdftext")
    os.makedirs(tmp_dir, exist_ok=True)

    for folder in sorted(glob.glob(os.path.join(src_dir, '*'))):
        if not os.path.isdir(folder):
            continue
        subject_name = os.path.basename(folder)
        pdfs = glob.glob(os.path.join(folder, '*.pdf'))
        if not pdfs:
            continue
        slug = slugify(subject_name)
        txt_path = os.path.join(tmp_dir, slug + '.txt')
        os.system(f'pdftotext -layout "{pdfs[0]}" "{txt_path}"')
        parsed = parse_file(txt_path, subject_name)
        parsed["slug"] = slug
        out_path = os.path.join(out_dir, slug + '.json')
        with open(out_path, 'w', encoding='utf-8') as f:
            json.dump(parsed, f, indent=2, ensure_ascii=False)
        print(f"{subject_name}: {len(parsed['subtopics'])} subtopics -> {out_path}")

    print("\nDone. Remember to add new subjects to data/seed/index.json too.")

if __name__ == "__main__":
    main()
