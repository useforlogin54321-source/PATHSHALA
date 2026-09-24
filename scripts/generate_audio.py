#!/usr/bin/env python3
"""
Generates one MP3 per subtopic using Piper (a good-quality, open-source,
offline neural TTS engine) and uploads them to the 'unit-audio' Supabase
Storage bucket, then records each file's public URL on the matching
subtopics row.

This has to run on YOUR machine, not from the sandbox this was built in -
Piper's voice models are hosted on Hugging Face, which that sandbox's
network couldn't reach, and Supabase Storage uploads need real outbound
internet access too. Both are normal on your machine.

--------------------------------------------------------------------------
SETUP (one-time, a few minutes)
--------------------------------------------------------------------------
1. Install ffmpeg if you don't have it:
   - Windows: winget install ffmpeg   (or download from ffmpeg.org)
   - Mac:     brew install ffmpeg
   - Linux:   sudo apt install ffmpeg

2. Install Piper:
   pip install piper-tts

3. Download a voice (one-time, ~60MB, needs real internet access):
   python -m piper.download_voices en_US-lessac-medium
   This drops en_US-lessac-medium.onnx and .onnx.json into the current
   directory. Move them next to this script, or pass --voice-dir.

   Want a different voice? Run with no arguments to list every option:
   python -m piper.download_voices
   en_GB-alan-medium and en_US-amy-medium are also good picks.

4. Make sure .env.local (in the project root) has NEXT_PUBLIC_SUPABASE_URL
   and NEXT_PUBLIC_SUPABASE_ANON_KEY filled in - same file the app itself
   uses.

--------------------------------------------------------------------------
RUNNING IT
--------------------------------------------------------------------------
    python scripts/generate_audio.py

Only generates audio for subtopics that don't already have it (checks
audio_url), so it's safe to stop and re-run - e.g. after adding a new
unit later, just run it again and it'll only process what's new.

Options:
    --voice PATH          Path to the .onnx voice file (default: looks for
                           en_US-lessac-medium.onnx next to this script)
    --subject SLUG         Only generate for one subject (e.g. c-programming)
    --force                Regenerate even if audio_url is already set
"""

import argparse
import json
import os
import subprocess
import sys
import tempfile
from pathlib import Path
from urllib import request, error as urlerror

SCRIPT_DIR = Path(__file__).resolve().parent
PROJECT_ROOT = SCRIPT_DIR.parent
BUCKET = "unit-audio"


def load_env():
    env_path = PROJECT_ROOT / ".env.local"
    if not env_path.exists():
        sys.exit(f"Missing {env_path} - copy .env.local.example and fill in your Supabase values first.")
    env = {}
    for line in env_path.read_text().splitlines():
        line = line.strip()
        if not line or line.startswith("#") or "=" not in line:
            continue
        key, _, value = line.partition("=")
        env[key.strip()] = value.strip()
    url = env.get("NEXT_PUBLIC_SUPABASE_URL")
    key = env.get("NEXT_PUBLIC_SUPABASE_ANON_KEY")
    if not url or not key:
        sys.exit("NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_ANON_KEY missing from .env.local")
    return url.rstrip("/"), key


def api_request(url, key, path, method="GET", body=None, extra_headers=None, is_json=True):
    headers = {"apikey": key, "Authorization": f"Bearer {key}"}
    if is_json:
        headers["Content-Type"] = "application/json"
    if extra_headers:
        headers.update(extra_headers)
    data = json.dumps(body).encode() if (body is not None and is_json) else body
    req = request.Request(f"{url}{path}", data=data, headers=headers, method=method)
    try:
        with request.urlopen(req) as resp:
            raw = resp.read()
            return json.loads(raw) if raw and is_json else raw
    except urlerror.HTTPError as e:
        detail = e.read().decode(errors="replace")
        raise RuntimeError(f"{method} {path} -> {e.code}: {detail}") from None


def fetch_subtopics(url, key, subject_filter, force):
    # Nested select: subjects -> units -> subtopics, same shape the app
    # itself uses (see lib/content.ts).
    select = "slug,name,units(unit_number,subtopics(id,number,title,content,audio_url))"
    q = f"/rest/v1/subjects?select={select}"
    if subject_filter:
        q += f"&slug=eq.{subject_filter}"
    subjects = api_request(url, key, q, method="GET")

    rows = []
    for s in subjects:
        units = s["units"] if isinstance(s["units"], list) else [s["units"]]
        for u in units:
            if not u:
                continue
            for st in u.get("subtopics") or []:
                if not force and st.get("audio_url"):
                    continue
                rows.append(
                    {
                        "subtopic_id": st["id"],
                        "subject_slug": s["slug"],
                        "subject_name": s["name"],
                        "unit_number": u["unit_number"],
                        "number": st["number"],
                        "title": st["title"],
                        "content": st["content"],
                    }
                )
    return rows


def synthesize(piper_bin, voice_onnx, voice_json, text, out_wav):
    subprocess.run(
        [piper_bin, "-m", str(voice_onnx), "-c", str(voice_json), "-f", str(out_wav)],
        input=text.encode(),
        check=True,
        capture_output=True,
    )


def wav_to_mp3(in_wav, out_mp3):
    subprocess.run(
        ["ffmpeg", "-y", "-i", str(in_wav), "-codec:a", "libmp3lame", "-qscale:a", "4", str(out_mp3)],
        check=True,
        capture_output=True,
    )


def upload_and_link(url, key, row, mp3_path):
    storage_path = f"{row['subject_slug']}/{row['unit_number']}/{row['number']}.mp3"
    with open(mp3_path, "rb") as f:
        mp3_bytes = f.read()

    api_request(
        url,
        key,
        f"/storage/v1/object/{BUCKET}/{storage_path}",
        method="POST",
        body=mp3_bytes,
        extra_headers={"Content-Type": "audio/mpeg", "x-upsert": "true"},
        is_json=False,
    )

    public_url = f"{url}/storage/v1/object/public/{BUCKET}/{storage_path}"
    api_request(
        url,
        key,
        f"/rest/v1/subtopics?id=eq.{row['subtopic_id']}",
        method="PATCH",
        body={"audio_url": public_url},
        extra_headers={"Prefer": "return=minimal"},
    )
    return public_url


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--voice", default=None, help="Path to the .onnx voice file")
    parser.add_argument("--subject", default=None, help="Only generate for one subject slug")
    parser.add_argument("--force", action="store_true", help="Regenerate even if audio already exists")
    args = parser.parse_args()

    piper_bin = subprocess.run(["which", "piper"], capture_output=True, text=True).stdout.strip()
    if not piper_bin:
        sys.exit("piper CLI not found on PATH - did `pip install piper-tts` succeed?")

    voice_onnx = Path(args.voice) if args.voice else SCRIPT_DIR / "en_US-lessac-medium.onnx"
    voice_json = voice_onnx.with_suffix(".onnx.json")
    if not voice_onnx.exists() or not voice_json.exists():
        sys.exit(
            f"Voice files not found at {voice_onnx}.\n"
            "Run: python -m piper.download_voices en_US-lessac-medium\n"
            "then move the .onnx and .onnx.json files next to this script (or pass --voice)."
        )

    url, key = load_env()
    rows = fetch_subtopics(url, key, args.subject, args.force)

    if not rows:
        print("Nothing to do - every subtopic already has audio_url set. Use --force to regenerate.")
        return

    print(f"Generating audio for {len(rows)} subtopic(s)...\n")

    with tempfile.TemporaryDirectory() as tmp:
        tmp = Path(tmp)
        for i, row in enumerate(rows, 1):
            label = f"[{i}/{len(rows)}] {row['subject_name']} {row['number']} {row['title']}"
            print(label, end=" ... ", flush=True)
            try:
                wav_path = tmp / "out.wav"
                mp3_path = tmp / "out.mp3"
                synthesize(piper_bin, voice_onnx, voice_json, row["content"], wav_path)
                wav_to_mp3(wav_path, mp3_path)
                upload_and_link(url, key, row, mp3_path)
                print("done")
            except Exception as e:
                print(f"FAILED: {e}")

    print("\nAll done. Reload the app - sections with audio now show the player instead of the 'not generated yet' note.")


if __name__ == "__main__":
    main()
