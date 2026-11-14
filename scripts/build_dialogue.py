"""Build src/data/dialogue.json from content/dialogue.csv.

Writers edit the CSV (it opens in any spreadsheet app); run
    python scripts/build_dialogue.py
and the app picks the new lines up on the next reload.

Columns: id, speaker, context, mood, energy_min, energy_max, text, anim,
         choices (optional), tag (optional)

choices: "Label=effect|Label=effect". Effects can be chained with "+":
    confirm              accept the cat's current guess
    mood:<m> energy:<n> need:<n>   correct the cat's guess (user = truth)
    go:<place>           cat leads you there (beach, meadow, home)
    talk breathe tasks worry stay rest turtle reassure ok help:<1-3>
{word} in a topic reply (tag tired/sad/lonely/…) becomes the feeling word the person used.
A "Not now" choice is added automatically by the app to every question.
"""
import csv
import json
import pathlib
import re
import sys

ROOT = pathlib.Path(__file__).resolve().parent.parent
SRC = ROOT / "content" / "dialogue.csv"
OUT = ROOT / "src" / "data" / "dialogue.json"

MOODS = {"heavy", "low", "neutral", "light", "bright"}
NEEDS = {"rest", "vent", "distract", "company"}
PLACES = {"beach", "meadow", "home"}
SPEAKERS = {"cat", "turtle", "sheep"}
SIMPLE_EFFECTS = {"confirm", "talk", "breathe", "tasks", "worry", "stay", "rest", "turtle", "reassure", "ok"}
# Minimum content from the dev guide (section 7)
MINIMUM = {"greeting": 15, "confirm": 6, "indirect": 3, "reply": 20, "gentle_check": 4,
           "suggest_place": 6, "turtle": 15, "task": 6, "goodbye": 3}
PER_MOOD = {"greeting": 3, "reply": 4, "turtle": 3}

errors = []


def check_effect(row_id, effect):
    for part in effect.split("+"):
        part = part.strip()
        if part in SIMPLE_EFFECTS:
            continue
        m = re.fullmatch(r"(mood|energy|need|go|help):(\w+)", part)
        if not m:
            errors.append(f"{row_id}: unknown effect '{part}'")
            continue
        key, val = m.groups()
        ok = {"mood": val in MOODS, "need": val in NEEDS, "go": val in PLACES,
              "energy": val.isdigit() and 1 <= int(val) <= 5,
              "help": val.isdigit() and 1 <= int(val) <= 3}[key]
        if not ok:
            errors.append(f"{row_id}: bad value in '{part}'")


rows, seen = [], set()
with open(SRC, newline="", encoding="utf-8") as f:
    for r in csv.DictReader(f):
        rid = r["id"].strip()
        if not rid:
            continue
        if rid in seen:
            errors.append(f"{rid}: duplicate id")
        seen.add(rid)
        if r["speaker"] not in SPEAKERS:
            errors.append(f"{rid}: unknown speaker '{r['speaker']}'")
        if len(r["text"]) > 160:
            errors.append(f"{rid}: line too long ({len(r['text'])} chars) — keep it to 2 short sentences")
        line = {"id": rid, "speaker": r["speaker"], "context": r["context"],
                "text": r["text"], "anim": r.get("anim") or None}
        if r["mood"]:
            line["mood"] = [m.strip() for m in r["mood"].split(",")]
            bad = set(line["mood"]) - MOODS
            if bad:
                errors.append(f"{rid}: unknown mood {sorted(bad)}")
        if r["energy_min"]:
            line["energy"] = [int(r["energy_min"]), int(r["energy_max"] or 5)]
            if not (1 <= line["energy"][0] <= line["energy"][1] <= 5):
                errors.append(f"{rid}: bad energy range {line['energy']}")
        if r.get("choices"):
            line["choices"] = []
            for c in r["choices"].split("|"):
                label, _, effect = c.rpartition("=")
                if not label:
                    errors.append(f"{rid}: choice '{c}' needs 'Label=effect'")
                    continue
                check_effect(rid, effect)
                line["choices"].append({"label": label.strip(), "effect": effect.strip()})
        if r.get("tag"):
            line["tag"] = r["tag"].strip()
        rows.append(line)

for ctx, n in MINIMUM.items():
    have = sum(1 for l in rows if l["context"] == ctx)
    if have < n:
        errors.append(f"context '{ctx}': {have} lines, need at least {n}")
for ctx, n in PER_MOOD.items():
    for mood in MOODS:
        have = sum(1 for l in rows if l["context"] == ctx and mood in l.get("mood", []))
        if have < n:
            errors.append(f"context '{ctx}': {have} lines for mood '{mood}', need {n}")
REPLY_TOPICS = {"tired", "sad", "lonely", "stressed", "angry", "bored", "happy"}
for topic in REPLY_TOPICS:
    if sum(1 for l in rows if l["context"] == "reply" and l.get("tag") == topic) < 4:
        errors.append(f"reply needs at least 4 lines tagged '{topic}'")
for l in rows:
    if "{word}" in l["text"] and l.get("tag") not in REPLY_TOPICS:
        errors.append(f"{l['id']}: {{word}} only works in topic replies")
for place in PLACES:
    if sum(1 for l in rows if l["context"] == "suggest_place" and l.get("tag") == place) < 2:
        errors.append(f"suggest_place needs 2 lines tagged '{place}'")

if errors:
    print("Dialogue has problems:\n  " + "\n  ".join(errors))
    sys.exit(1)

OUT.write_text(json.dumps(rows, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
print(f"Wrote {len(rows)} lines")
