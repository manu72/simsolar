#!/usr/bin/env python3
"""Route a task string to a context bundle for agenticOS-context."""

from __future__ import annotations

import fnmatch
import json
import os
import re
import sys
from pathlib import Path

MAX_PATHS = 10
STOPWORDS = {
    "a", "an", "the", "and", "or", "for", "to", "in", "on", "at", "of", "with",
    "fix", "add", "update", "change", "implement", "refactor", "debug", "test",
    "how", "what", "when", "where", "why", "is", "are", "be", "do", "does",
}

PATH_CANDIDATE = re.compile(
    r"(?:`)?((?:[\w@.-]+/)+[\w@./-]+\.(?:tsx?|jsx?|py|md|json|mjs|cjs|css|glsl|ts))(?:`)?",
    re.IGNORECASE,
)
SYMBOL_CANDIDATE = re.compile(r"\b([A-Z][A-Za-z0-9_]+)\b")


def repo_root() -> Path:
    root = Path.cwd()
    if not (root / ".agentic").is_dir():
        print(json.dumps({"error": "run from repository root"}), file=sys.stderr)
        sys.exit(1)
    return root


def load_config(root: Path) -> dict:
    with (root / ".agentic/CONFIG/agentic.json").open(encoding="utf-8") as fh:
        return json.load(fh)


def load_graph(root: Path, config: dict) -> tuple[dict | None, bool, str, bool]:
    graph_path = root / config.get("graph", {}).get("path", ".agentic/GRAPH/knowledge-graph.json")
    fallback_active = False
    rel = config.get("graph", {}).get("path", str(graph_path.relative_to(root)))
    if graph_path.is_file():
        try:
            with graph_path.open(encoding="utf-8") as fh:
                return json.load(fh), True, rel, False
        except json.JSONDecodeError:
            pass
    codemap = root / ".agentic/CODEMAP.json"
    if codemap.is_file():
        try:
            with codemap.open(encoding="utf-8") as fh:
                return json.load(fh), False, ".agentic/CODEMAP.json", True
        except json.JSONDecodeError:
            pass
    return None, False, rel, False


def extract_explicit_paths(task: str, root: Path) -> list[str]:
    found: list[str] = []
    for match in PATH_CANDIDATE.finditer(task):
        candidate = match.group(1).lstrip("./")
        if (root / candidate).is_file() and candidate not in found:
            found.append(candidate)
    return found


def task_terms(task: str) -> list[str]:
    tokens = re.findall(r"[a-zA-Z][a-zA-Z0-9_/-]*", task.lower())
    terms: list[str] = []
    for tok in tokens:
        if tok in STOPWORDS or len(tok) < 3:
            continue
        if tok not in terms:
            terms.append(tok)
        for part in tok.replace("-", "/").split("/"):
            if len(part) >= 3 and part not in STOPWORDS and part not in terms:
                terms.append(part)
    return terms


def index_graph(graph: dict) -> tuple[dict[str, dict], dict[str, list[str]], dict[str, str]]:
    by_id: dict[str, dict] = {}
    file_by_path: dict[str, str] = {}
    adjacency: dict[str, list[str]] = {}
    for node in graph.get("nodes", []):
        nid = node.get("id")
        if isinstance(nid, str):
            by_id[nid] = node
            if node.get("type") == "file":
                fp = node.get("filePath")
                if isinstance(fp, str):
                    file_by_path[fp] = nid
    for edge in graph.get("edges", []):
        src = edge.get("source")
        tgt = edge.get("target")
        etype = edge.get("type", "")
        if not isinstance(src, str) or not isinstance(tgt, str):
            continue
        if etype in {"imports", "depends_on", "uses", "calls", "references"}:
            adjacency.setdefault(src, []).append(tgt)
            adjacency.setdefault(tgt, []).append(src)
    return by_id, adjacency, file_by_path


def node_to_path(node: dict) -> str | None:
    fp = node.get("filePath")
    if isinstance(fp, str):
        return fp
    return None


def graph_search(graph: dict, terms: list[str], limit: int) -> list[tuple[str, str, float]]:
    scores: dict[str, float] = {}
    reasons: dict[str, str] = {}
    for node in graph.get("nodes", []):
        fp = node_to_path(node)
        if not fp:
            continue
        hay = " ".join(
            str(node.get(k, "")) for k in ("name", "filePath", "summary", "id")
        ).lower()
        tags = node.get("tags") or []
        if isinstance(tags, list):
            hay += " " + " ".join(str(t) for t in tags).lower()
        score = 0.0
        for term in terms:
            if term in hay:
                score += 2.0 if node.get("type") == "file" else 1.0
            if term in fp.lower():
                score += 3.0
        if score > 0:
            prev = scores.get(fp, 0.0)
            if score > prev:
                scores[fp] = score
                reasons[fp] = "graph search"
    ranked = sorted(scores.items(), key=lambda x: (-x[1], x[0]))
    return [(p, reasons[p], s) for p, s in ranked[:limit]]


def expand_dependencies(
    seeds: list[str],
    by_id: dict[str, dict],
    adjacency: dict[str, list[str]],
    file_by_path: dict[str, str],
    limit: int,
) -> list[tuple[str, str]]:
    results: list[tuple[str, str]] = []
    seen: set[str] = set(seeds)
    queue: list[str] = []
    for seed in seeds:
        nid = file_by_path.get(seed)
        if nid:
            queue.append(nid)
    while queue and len(results) < limit:
        nid = queue.pop(0)
        for neighbor in adjacency.get(nid, []):
            node = by_id.get(neighbor)
            if not node:
                continue
            fp = node_to_path(node)
            if not fp or fp in seen:
                continue
            seen.add(fp)
            results.append((fp, "dependency"))
            if len(results) >= limit:
                break
            if neighbor in adjacency:
                queue.append(neighbor)
    return results


def discover_tests(root: Path, config: dict, paths: list[str]) -> list[str]:
    patterns = config.get("test_discovery", [])
    tests: list[str] = []
    for path in paths:
        stem = Path(path).stem
        parent = Path(path).parent.name
        candidates: list[Path] = []
        for base in (root / "__tests__", root / "tests"):
            if base.is_dir():
                for item in base.rglob("*"):
                    if not item.is_file():
                        continue
                    rel = str(item.relative_to(root))
                    name_lower = item.name.lower()
                    if stem.lower() in name_lower or parent.lower() in name_lower:
                        candidates.append(item)
        for cand in candidates:
            rel = str(cand.relative_to(root))
            matched = any(fnmatch.fnmatch(rel, pat) for pat in patterns)
            if matched and rel not in tests:
                tests.append(rel)
    return tests[:5]


def subsystem_files(root: Path, paths: list[str]) -> list[str]:
    subsystems: list[str] = []
    sub_dir = root / ".agentic/SUBSYSTEMS"
    if not sub_dir.is_dir():
        return subsystems
    top_levels = {Path(p).parts[0] if Path(p).parts else "" for p in paths}
    for fp in sorted(sub_dir.glob("*.md")):
        if fp.name == "README.md":
            continue
        text = fp.read_text(encoding="utf-8").lower()
        for tl in top_levels:
            if tl and tl in text:
                rel = str(fp.relative_to(root))
                if rel not in subsystems:
                    subsystems.append(rel)
                break
    return subsystems


def memory_files(root: Path) -> list[str]:
    files = [
        ".agentic/PROJECT_BRIEF.md",
        ".agentic/MEMORY_INDEX.md",
    ]
    return [f for f in files if (root / f).is_file()]


def risk_tags(config: dict, paths: list[str]) -> list[str]:
    tags: list[str] = []
    for path in paths:
        for rule in config.get("high_risk_patterns", []):
            match = rule.get("match", "")
            rule_tags = rule.get("tags", [])
            if isinstance(match, str) and isinstance(rule_tags, list) and glob_match_simple(match, path):
                for tag in rule_tags:
                    if isinstance(tag, str) and tag not in tags:
                        tags.append(tag)
    return tags


def glob_match_simple(pattern: str, path: str) -> bool:
    norm = path.replace("\\", "/")
    pat = pattern.replace("\\", "/")
    return fnmatch.fnmatch(norm, pat.replace("**", "*"))


def filesystem_fallback(root: Path, terms: list[str], limit: int) -> list[tuple[str, str]]:
    results: list[tuple[str, str]] = []
    ignore_parts = {"node_modules", ".git", ".next", "dist", "build", ".venv", "coverage"}
    for dirpath, dirnames, filenames in os.walk(root):
        dirnames[:] = [d for d in dirnames if d not in ignore_parts]
        for name in filenames:
            if not name.endswith((".ts", ".tsx", ".js", ".jsx", ".py", ".md")):
                continue
            lower = name.lower()
            if any(t in lower for t in terms):
                rel = str(Path(dirpath, name).relative_to(root))
                results.append((rel, "filesystem fallback"))
                if len(results) >= limit:
                    return results
    return results


def build_bundle(
    task: str,
    root: Path,
    config: dict,
    graph: dict | None,
    graph_available: bool,
    graph_source: str,
    fallback_active: bool,
    explain: bool,
) -> dict:
    selected: list[str] = []
    reasons: dict[str, str] = {}
    graph_nodes: list[str] = []
    unknowns: list[str] = []
    stop_conditions: list[str] = []

    def add_path(path: str, reason: str) -> None:
        if path not in selected and len(selected) < MAX_PATHS:
            selected.append(path)
            reasons[path] = reason

    explicit = extract_explicit_paths(task, root)
    for p in explicit:
        add_path(p, "user-named")

    terms = task_terms(task)
    if graph and graph_available:
        by_id, adjacency, file_by_path = index_graph(graph)
        if explicit:
            for p in explicit:
                nid = file_by_path.get(p)
                if nid:
                    graph_nodes.append(nid)
            for p, reason in expand_dependencies(explicit, by_id, adjacency, file_by_path, MAX_PATHS):
                add_path(p, reason)
        for p, reason, _score in graph_search(graph, terms, MAX_PATHS):
            add_path(p, reason)
            nid = file_by_path.get(p)
            if nid and nid not in graph_nodes:
                graph_nodes.append(nid)
        for sym in SYMBOL_CANDIDATE.findall(task):
            for node in graph.get("nodes", []):
                if node.get("name") == sym or sym in str(node.get("id", "")):
                    fp = node_to_path(node)
                    if fp:
                        add_path(fp, "graph anchor")
                        nid = node.get("id")
                        if isinstance(nid, str) and nid not in graph_nodes:
                            graph_nodes.append(nid)
    elif not graph_available and not fallback_active:
        unknowns.append("graph unavailable and no CODEMAP fallback")

    if not selected and terms:
        for p, reason in filesystem_fallback(root, terms, MAX_PATHS):
            add_path(p, reason)

    related_tests = discover_tests(root, config, selected)
    for t in related_tests:
        add_path(t, f"test for {selected[0]}" if selected else "test discovery")

    subsystem_files_list = subsystem_files(root, selected)
    memory_files_list = memory_files(root)
    dependency_paths = [p for p, r in reasons.items() if r == "dependency"]
    risk = risk_tags(config, selected)

    has_anchors = bool(explicit)
    has_tests = bool(related_tests)
    if has_anchors and graph_available and has_tests:
        confidence = "high"
    elif selected and (graph_available or explicit):
        confidence = "medium"
    else:
        confidence = "low"
        stop_conditions.append("weak routing match — confirm target files with user")

    if fallback_active:
        if confidence == "high":
            confidence = "medium"
        elif confidence == "medium":
            confidence = "low"

    bundle = {
        "task": task,
        "confidence": confidence,
        "graph_available": graph_available,
        "graph_source": graph_source,
        "fallback_active": fallback_active,
        "selected_paths": selected,
        "selection_reasons": reasons,
        "graph_nodes": graph_nodes[:15],
        "dependency_paths": dependency_paths,
        "related_tests": related_tests,
        "subsystem_files": subsystem_files_list,
        "memory_files": memory_files_list,
        "risk_tags": risk,
        "unknowns": unknowns,
        "stop_conditions": stop_conditions,
    }

    if explain:
        print("Routing trace:", file=sys.stderr)
        for p in selected:
            print(f"  {p}: {reasons.get(p, '?')}", file=sys.stderr)
        print(f"confidence={confidence}", file=sys.stderr)

    return bundle


def main() -> int:
    args = [a for a in sys.argv[1:] if a != "--explain"]
    explain = "--explain" in sys.argv[1:]
    if not args:
        print(json.dumps({"error": "usage: route_task.py <task> [--explain]"}), file=sys.stderr)
        return 1

    task = " ".join(args)
    root = repo_root()
    config = load_config(root)
    graph, graph_available, graph_source, fallback_active = load_graph(root, config)

    bundle = build_bundle(
        task, root, config, graph, graph_available, graph_source, fallback_active, explain
    )

    cache_rel = config.get("paths", {}).get("context_cache", ".agentic/CONTEXT/last_context.json")
    cache_path = root / cache_rel
    cache_path.parent.mkdir(parents=True, exist_ok=True)
    cache_path.write_text(json.dumps(bundle, indent=2) + "\n", encoding="utf-8")

    print(json.dumps(bundle, indent=2))
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
