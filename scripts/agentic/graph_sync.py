#!/usr/bin/env python3
"""Sync graph metadata into GRAPH_INDEX.md managed region."""

from __future__ import annotations

import json
import sys
from datetime import datetime, timezone
from pathlib import Path

MANAGED_START = "<!-- agentic:managed:start -->"
MANAGED_END = "<!-- agentic:managed:end -->"


def repo_root() -> Path:
    root = Path.cwd()
    if not (root / ".agentic").is_dir():
        print("error: run from repository root (.agentic/ not found)", file=sys.stderr)
        sys.exit(1)
    return root


def load_config(root: Path) -> dict:
    config_path = root / ".agentic/CONFIG/agentic.json"
    if not config_path.is_file():
        print(f"error: missing {config_path}", file=sys.stderr)
        sys.exit(1)
    with config_path.open(encoding="utf-8") as fh:
        return json.load(fh)


def resolve_graph_path(root: Path, config: dict) -> Path:
    rel = config.get("graph", {}).get("path", ".agentic/GRAPH/knowledge-graph.json")
    return root / rel


def sample_paths_resolve(root: Path, graph: dict, sample_count: int) -> tuple[int, int]:
    candidates: list[str] = []
    for node in graph.get("nodes", []):
        fp = node.get("filePath")
        if isinstance(fp, str) and fp not in candidates:
            candidates.append(fp)
        if len(candidates) >= sample_count * 3:
            break
    checked = 0
    resolved = 0
    for fp in candidates[:sample_count]:
        checked += 1
        if (root / fp).is_file():
            resolved += 1
    return resolved, checked


def iso_now() -> str:
    return datetime.now(timezone.utc).strftime("%Y-%m-%dT%H:%M:%S.%f")[:-3] + "Z"


def graph_is_stale(mtime: float, max_age_hours: float) -> bool:
    age_hours = (datetime.now(timezone.utc).timestamp() - mtime) / 3600
    return age_hours > max_age_hours


def build_managed_block(
    config: dict,
    rel_path_str: str,
    graph_path: Path,
    node_count: int,
    edge_count: int,
    resolved: int,
    checked: int,
    stale: bool,
) -> str:
    provider = config.get("graph", {}).get("provider", "unknown")
    rel_display = f"`{rel_path_str}`"
    fallback = config.get("graph", {}).get("fallback", "none") or "none"
    stale_note = " (stale — consider refreshing graph)" if stale else ""
    return "\n".join(
        [
            MANAGED_START,
            "## Graph status",
            "",
            f"- Provider: {provider}",
            f"- Graph path: {rel_display}",
            "- Graph mode available: yes",
            f"- Fallback mode: {fallback if fallback != 'codemap' else 'codemap (configured, inactive)'}",
            f"- Last checked: {iso_now()}",
            f"- Last generated: {datetime.fromtimestamp(graph_path.stat().st_mtime, tz=timezone.utc).strftime('%Y-%m-%dT%H:%M:%S.%f')[:-3] + 'Z'}",
            "- Parseable: yes",
            "- Non-empty: yes",
            f"- Sample paths resolve: {resolved}/{checked}",
            f"- Coverage notes: {node_count} nodes, {edge_count} edges{stale_note}",
            "- Known gaps: none recorded by graph_sync",
            "- Unknowns: none",
            MANAGED_END,
        ]
    )


def replace_managed_region(content: str, new_block: str) -> str:
    if MANAGED_START not in content or MANAGED_END not in content:
        print("error: GRAPH_INDEX.md missing managed region markers", file=sys.stderr)
        sys.exit(1)
    before, rest = content.split(MANAGED_START, 1)
    _, after = rest.split(MANAGED_END, 1)
    return before + new_block + after


def main() -> int:
    root = repo_root()
    config = load_config(root)
    graph_path = resolve_graph_path(root, config)

    if not graph_path.is_file():
        print(f"error: graph file missing: {graph_path}", file=sys.stderr)
        return 1

    try:
        with graph_path.open(encoding="utf-8") as fh:
            graph = json.load(fh)
    except json.JSONDecodeError as exc:
        print(f"error: graph JSON invalid: {exc}", file=sys.stderr)
        return 1

    nodes = graph.get("nodes", [])
    edges = graph.get("edges", [])
    if not nodes:
        print("error: graph has no nodes", file=sys.stderr)
        return 1

    sample_count = int(config.get("validation", {}).get("sample_path_check_count", 5))
    resolved, checked = sample_paths_resolve(root, graph, sample_count)
    if checked and resolved == 0:
        print("error: sample graph paths do not resolve on disk", file=sys.stderr)
        return 1

    max_age = float(config.get("freshness_rules", {}).get("graph_max_age_hours", 168))
    stale = graph_is_stale(graph_path.stat().st_mtime, max_age)
    if stale:
        print(f"warning: graph older than {max_age}h — consider refreshing", file=sys.stderr)

    index_path = root / ".agentic/GRAPH_INDEX.md"
    if not index_path.is_file():
        print("error: missing .agentic/GRAPH_INDEX.md", file=sys.stderr)
        return 1

    original = index_path.read_text(encoding="utf-8")
    rel_path_str = config.get("graph", {}).get("path", str(graph_path.relative_to(root)))
    new_block = build_managed_block(
        config, rel_path_str, graph_path, len(nodes), len(edges), resolved, checked, stale
    )
    updated = replace_managed_region(original, new_block)
    index_path.write_text(updated, encoding="utf-8")

    print(f"graph_sync: ok — {len(nodes)} nodes, {len(edges)} edges, {resolved}/{checked} sample paths")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
