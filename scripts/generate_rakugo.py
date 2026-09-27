import json
import os
import urllib.request
from pathlib import Path

snapshot = json.loads(Path("source-snapshot.json").read_text())
endpoint = os.environ.get("LLM_API_URL", "").strip()
api_key = os.environ.get("LLM_API_KEY", "").strip()
model = os.environ.get("LLM_MODEL", "default")

if not endpoint or not api_key:
    raise RuntimeError("LLM configuration is missing")

request_body = {
    "model": model,
    "input": json.dumps({
        "task": "Transform the repository snapshot into a short cyber-Edo rakugo script.",
        "requirements": [
            "Return JSON only.",
            "Use Japanese for creative fields.",
            "Create a strong one-line ochi.",
            "Prefer concrete repository details over generic jokes.",
            "Keep it suitable for solo narration."
        ],
        "schema": {
            "title": "string",
            "maku": "string",
            "honpen": "string",
            "ochi": "string",
            "source_points": ["string"]
        },
        "source": snapshot
    }, ensure_ascii=False)
}

request = urllib.request.Request(
    endpoint,
    data=json.dumps(request_body, ensure_ascii=False).encode(),
    headers={
        "Authorization": "Bearer " + api_key,
        "Content-Type": "application/json"
    },
    method="POST"
)

with urllib.request.urlopen(request, timeout=300) as response:
    data = json.load(response)

text = data.get("output_text", "")
if not text:
    for item in data.get("output", []):
        for content in item.get("content", []):
            if content.get("type") == "output_text":
                text += content.get("text", "")

if not text:
    raise RuntimeError("Model returned no text")

rakugo = json.loads(text)
Path("output").mkdir(exist_ok=True)
Path("output/rakugo.json").write_text(
    json.dumps(rakugo, ensure_ascii=False, indent=2)
)
