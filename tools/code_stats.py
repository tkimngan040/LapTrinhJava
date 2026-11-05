#!/usr/bin/env python3
"""Print the figures for the statistics table of Report section 3.2.5.

Run it from the repository root, after the branches you want counted are
merged, and paste the result over the table:

    python3 -I tools/code_stats.py

It only reads files. Counts cover production code (src/main), not tests, and
generated or dependency folders are skipped.
"""

import re
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
SKIP = {"node_modules", ".next", "target", ".git"}


def files(base, suffixes):
    for path in (ROOT / base).rglob("*"):
        if path.is_file() and path.suffix in suffixes and not (SKIP & set(path.parts)):
            yield path


def lines(paths):
    return sum(len(p.read_text(encoding="utf-8", errors="replace").splitlines()) for p in paths)


java = list(files("backend/src/main/java", {".java"})) + list(files("simulator/src/main/java", {".java"}))
frontend = list(files("frontend/src", {".ts", ".tsx"}))
packages = {p.parent for p in java}
entities = [p for p in java if re.search(r"^@Entity\b", p.read_text(encoding="utf-8"), re.M)]
migrations = list(files("backend/src/main/resources/db/migration", {".sql"}))
mapping = re.compile(r"^\s*@(Get|Post|Put|Patch|Delete)Mapping\b", re.M)
endpoints = sum(len(mapping.findall(p.read_text(encoding="utf-8"))) for p in java)

print("| Measure | Value |")
print("|---|---|")
print(f"| Java source files (backend and simulator) | {len(java)} |")
print(f"| Lines of Java | {lines(java):,} |")
print(f"| Java packages | {len(packages)} |")
print(f"| JPA entities | {len(entities)} |")
print(f"| Database migrations | {len(migrations)} |")
print(f"| REST endpoints | {endpoints} |")
print(f"| Frontend TypeScript files | {len(frontend)} |")
