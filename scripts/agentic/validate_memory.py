#!/usr/bin/env python3
"""Validate Agentic OS memory structure and freshness."""

from __future__ import annotations

import json
import re
import sys
from datetime import datetime, timezone
from pathlib import Path

REQUIRED_CONFIG_KEYS = {
    "version",
    "graph",
    "paths",
    "ignore_globs",
    "test_discovery",
    "high_risk_patterns",
    "freshness_rules",
    "validation",
    "generated_artifacts",
}

REGION_PAIRS = [
    ("<!-- agentic:managed:start -->", "<!-- agentic:managed:end -->"),
    ("<!-- human:notes:start -->", "<!-- human:notes:end -->"),
]

BACKTICK_PATH = re.compile(r"`([^`\n]+)`")


def repo_root() -> Path:
    root = Path.cwd()
    if not (root / ".agentic").is_dir():
        print("FAIL: .agentic/ missing — run from repository root", file=sys.stderr)
        sys.exit(1)
    return root


def fail(msg: str) -> None:
    print(f"FAIL: {msg}", file=sys.stderr)
    global _failures
    _failures.append(msg)


def warn(msg: str) -> None:
    print(f"WARN: {msg}", file=sys.stderr)
    global _warnings
    _warnings.append(msg)


_failures: list[str] = []
_warnings: list[str] = []


def check_region_markers(path: Path, require_human: bool = True) -> None:
    text = path.read_text(encoding="utf-8")
    for start, end in REGION_PAIRS:
        if start not in text or end not in text:
            label = "managed" if "managed" in start else "human"
            if label == "human" and not require_human:
                continue
            fail(f"{path}: missing or unpaired {label} region markers")
            return
        if text.index(start) >= text.index(end):
            fail(f"{path}: region markers out of order")


def parse_iso_date(text: str) -> datetime | None:
    for line in text.splitlines():
        if "Last refreshed:" in line or "Last checked:" in line:
            match = re.search(r"(\d{4}-\d{2}-\d{2})", line)
            if match:
                try:
                    return datetime.strptime(match.group(1), "%Y-%m-%d").replace(tzinfo=timezone.utc)
                except ValueError:
                    return None
    return None


def glob_match(pattern: str, path: str) -> bool:
    """Minimal glob match for ** segments used in high_risk_patterns."""
    norm = path.replace("\\", "/")
    parts = pattern.replace("\\", "/").split("/")
    return _glob_parts(parts, norm.split("/"))


def _glob_parts(pattern_parts: list[str], path_parts: list[str]) -> bool:
    if not pattern_parts:
        return not path_parts
    head, *tail = pattern_parts
    if head == "**":
        if _glob_parts(tail, path_parts):
            return True
        if path_parts:
            return _glob_parts(pattern_parts, path_parts[1:])
        return False
    if not path_parts:
        return False
    if head == "*":
        if not _glob_parts(tail, path_parts[1:]):
            return False
        return True
    if head != path_parts[0]:
        return False
    return _glob_parts(tail, path_parts[1:])


def main() -> int:
    root = repo_root()
    memory_root = root / ".agentic"

    required_files = [
        memory_root / "CONFIG/agentic.json",
        memory_root / "PROJECT_BRIEF.md",
        memory_root / "MEMORY_INDEX.md",
        memory_root / "SUBSYSTEMS/README.md",
        memory_root / "LESSONS/decisions.md",
        memory_root / "LESSONS/incidents.md",
        memory_root / "GRAPH_INDEX.md",
    ]
    for fp in required_files:
        if not fp.is_file():
            fail(f"missing required file: {fp.relative_to(root)}")

    config: dict = {}
    config_path = memory_root / "CONFIG/agentic.json"
    if config_path.is_file():
        try:
            with config_path.open(encoding="utf-8") as fh:
                config = json.load(fh)
        except json.JSONDecodeError as exc:
            fail(f"agentic.json invalid JSON: {exc}")
        else:
            missing = REQUIRED_CONFIG_KEYS - set(config.keys())
            if missing:
                fail(f"agentic.json missing keys: {sorted(missing)}")

    graph_cfg = config.get("graph", {})
    graph_path = root / graph_cfg.get("path", ".agentic/GRAPH/knowledge-graph.json")
    graph_required = graph_cfg.get("required", True)
    codemap_path = root / ".agentic/CODEMAP.json"
    if graph_path.is_file():
        try:
            with graph_path.open(encoding="utf-8") as fh:
                json.load(fh)
        except json.JSONDecodeError as exc:
            fail(f"graph file invalid JSON: {exc}")
    elif graph_required:
        if codemap_path.is_file():
            warn("graph missing; CODEMAP.json present but graph.required is true")
        else:
            fail(f"graph required but missing: {graph_path.relative_to(root)}")
    elif not codemap_path.is_file():
        warn("graph not required and no CODEMAP.json fallback present")

    require_markers = config.get("validation", {}).get("require_region_markers", True)
    if require_markers:
        for name in ("PROJECT_BRIEF.md", "MEMORY_INDEX.md", "GRAPH_INDEX.md"):
            fp = memory_root / name
            if fp.is_file():
                check_region_markers(fp)
        for fp in sorted((memory_root / "SUBSYSTEMS").glob("*.md")):
            check_region_markers(fp, require_human=fp.name != "README.md")

    context_cache = config.get("paths", {}).get("context_cache", ".agentic/CONTEXT/last_context.json")
    cache_dir = (root / context_cache).parent
    try:
        cache_dir.mkdir(parents=True, exist_ok=True)
    except OSError as exc:
        fail(f"cannot create context cache directory {cache_dir}: {exc}")

    sample_count = int(config.get("validation", {}).get("sample_path_check_count", 5))
    memory_sources = [
        memory_root / "PROJECT_BRIEF.md",
        memory_root / "MEMORY_INDEX.md",
        memory_root / "GRAPH_INDEX.md",
        *sorted((memory_root / "SUBSYSTEMS").glob("*.md")),
    ]
    seen: set[str] = set()
    checked = 0
    for src in memory_sources:
        if not src.is_file():
            continue
        for match in BACKTICK_PATH.finditer(src.read_text(encoding="utf-8")):
            candidate = match.group(1).strip()
            if not candidate or candidate.startswith(".agentic"):
                continue
            if "/" not in candidate and "." not in candidate:
                continue
            if candidate in seen:
                continue
            seen.add(candidate)
            checked += 1
            if checked > sample_count:
                break
            if not (root / candidate).exists():
                warn(f"memory references missing path: {candidate}")
        if checked > sample_count:
            break

    graph_max_hours = float(config.get("freshness_rules", {}).get("graph_max_age_hours", 168))
    if graph_path.is_file():
        age_h = (datetime.now(timezone.utc).timestamp() - graph_path.stat().st_mtime) / 3600
        if age_h > graph_max_hours:
            warn(f"graph stale ({age_h:.0f}h > {graph_max_hours}h max)")

    memory_max_days = float(config.get("freshness_rules", {}).get("memory_max_age_days", 30))
    mem_index = memory_root / "MEMORY_INDEX.md"
    if mem_index.is_file():
        refreshed = parse_iso_date(mem_index.read_text(encoding="utf-8"))
        if refreshed:
            age_d = (datetime.now(timezone.utc) - refreshed).days
            if age_d > memory_max_days:
                warn(f"memory index stale ({age_d}d > {memory_max_days}d max)")

    if _failures:
        print(f"\nvalidate_memory: FAILED ({len(_failures)} structural errors)", file=sys.stderr)
        return 1

    if _warnings:
        print(f"validate_memory: PASS with {len(_warnings)} warning(s)")
        return 0

    print("validate_memory: PASS")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
