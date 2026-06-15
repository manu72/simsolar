#!/usr/bin/env python3
"""Refresh managed memory sections after graph sync and git changes."""

from __future__ import annotations

import json
import re
import subprocess
import sys
from datetime import datetime, timezone
from pathlib import Path

MANAGED_START = "<!-- agentic:managed:start -->"
MANAGED_END = "<!-- agentic:managed:end -->"
UPDATE_REF = ".agentic/CONTEXT/last_update_ref"


def repo_root() -> Path:
    root = Path.cwd()
    if not (root / ".agentic").is_dir():
        print("error: run from repository root", file=sys.stderr)
        sys.exit(1)
    return root


def load_config(root: Path) -> dict:
    with (root / ".agentic/CONFIG/agentic.json").open(encoding="utf-8") as fh:
        return json.load(fh)


def run_graph_sync(root: Path) -> tuple[bool, str]:
    script = root / "scripts/agentic/graph_sync.py"
    if not script.is_file():
        return False, "graph_sync.py missing — skipped"
    result = subprocess.run(
        [sys.executable, str(script)],
        cwd=root,
        capture_output=True,
        text=True,
    )
    if result.returncode != 0:
        return False, result.stderr.strip() or "graph_sync failed"
    return True, result.stdout.strip()


def git_head(root: Path) -> str | None:
    try:
        out = subprocess.run(
            ["git", "rev-parse", "HEAD"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True,
        )
        return out.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return None


def git_changed_files(root: Path, since_ref: str | None) -> list[str]:
    if since_ref is None:
        return []
    try:
        out = subprocess.run(
            ["git", "diff", "--name-only", since_ref, "HEAD"],
            cwd=root,
            capture_output=True,
            text=True,
            check=True,
        )
        return [line.strip() for line in out.stdout.splitlines() if line.strip()]
    except (subprocess.CalledProcessError, FileNotFoundError):
        return []


def infer_subsystems(changed: list[str], root: Path) -> list[str]:
    sub_dir = root / ".agentic/SUBSYSTEMS"
    hits: set[str] = set()
    for path in changed:
        parts = Path(path).parts
        top = parts[0] if parts else ""
        mapping = {
            "components": None,
            "lib": "lib",
            "store": "store",
            "public": "pwa-offline",
            "__tests__": None,
        }
        if top == "components" and len(parts) > 1:
            folder = parts[1]
            if folder == "canvas":
                hits.add("canvas")
            elif folder == "hud":
                hits.add("hud")
            elif folder == "ui":
                hits.add("ui")
        elif top in mapping and mapping[top]:
            hits.add(mapping[top])
        elif top == "lib":
            hits.add("lib")
        elif top == "store":
            hits.add("store")
    for fp in sub_dir.glob("*.md"):
        if fp.name == "README.md":
            continue
        text = fp.read_text(encoding="utf-8")
        for path in changed:
            if path in text:
                hits.add(fp.stem)
    return sorted(hits)


def replace_managed_block(content: str, new_inner: str) -> str:
    if MANAGED_START not in content or MANAGED_END not in content:
        return content
    before, rest = content.split(MANAGED_START, 1)
    _, after = rest.split(MANAGED_END, 1)
    return before + MANAGED_START + new_inner + MANAGED_END + after


def refresh_memory_index(root: Path, refreshed_files: list[str]) -> bool:
    path = root / ".agentic/MEMORY_INDEX.md"
    if not path.is_file():
        return False
    content = path.read_text(encoding="utf-8")
    if MANAGED_START not in content:
        return False
    now = datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"
    managed, rest = content.split(MANAGED_START, 1)
    inner, after_managed = rest.split(MANAGED_END, 1)
    inner = re.sub(
        r"- Last refreshed:.*",
        f"- Last refreshed: {now}",
        inner,
        count=1,
    )
    file_list = ", ".join(f"`{f}`" for f in refreshed_files) if refreshed_files else "none"
    if "- Files refreshed this run:" in inner:
        inner = re.sub(
            r"- Files refreshed this run:.*",
            f"- Files refreshed this run: {file_list}",
            inner,
            count=1,
        )
    else:
        inner = inner.rstrip() + f"\n- Files refreshed this run: {file_list}\n"
    path.write_text(managed + MANAGED_START + inner + MANAGED_END + after_managed, encoding="utf-8")
    return True


def scan_stale_human_regions(root: Path, changed: list[str]) -> list[str]:
    proposals: list[str] = []
    for rel in changed:
        for mem in (root / ".agentic").rglob("*.md"):
            text = mem.read_text(encoding="utf-8")
            if "<!-- human:notes:start -->" not in text:
                continue
            if rel in text:
                proposals.append(
                    f"{mem.relative_to(root)}: human region mentions changed file `{rel}` — review for staleness"
                )
    return proposals


def main() -> int:
    root = repo_root()
    load_config(root)

    graph_ok, graph_msg = run_graph_sync(root)
    if graph_ok:
        print(f"graph_sync: {graph_msg}")
    else:
        print(f"note: {graph_msg}")

    ref_path = root / UPDATE_REF
    prev_ref = ref_path.read_text(encoding="utf-8").strip() if ref_path.is_file() else None
    head = git_head(root)
    changed = git_changed_files(root, prev_ref) if prev_ref else []
    subsystems = infer_subsystems(changed, root)

    refreshed: list[str] = []
    if refresh_memory_index(root, [".agentic/MEMORY_INDEX.md"]):
        refreshed.append(".agentic/MEMORY_INDEX.md")

    proposals = scan_stale_human_regions(root, changed)
    for proposal in proposals:
        print(f"proposal (needs confirmation): {proposal}")

    if head:
        ref_path.parent.mkdir(parents=True, exist_ok=True)
        ref_path.write_text(head + "\n", encoding="utf-8")

    print("\nupdate_memory summary")
    print("=====================")
    print(f"graph status: {'ok' if graph_ok else graph_msg}")
    print(f"git HEAD: {head or 'unavailable'}")
    print(f"changed since last run: {len(changed)} file(s)")
    if changed:
        for c in changed[:20]:
            print(f"  - {c}")
        if len(changed) > 20:
            print(f"  ... and {len(changed) - 20} more")
    print(f"affected subsystems (inferred): {', '.join(subsystems) if subsystems else 'none'}")
    print(f"files refreshed: {', '.join(refreshed) if refreshed else 'none'}")
    print(f"human-region proposals awaiting confirmation: {len(proposals)}")
    print("proposed lesson entries: none (no durable evidence without user confirmation)")
    print(f"unknowns: {'git unavailable' if not head else 'none'}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
