#!/usr/bin/env python3
"""src/ 아래 TS/TSX 파일의 로컬(상대경로) import를 Mermaid flowchart 간선으로 출력한다.

사용법: python3 extract_imports.py [src_dir]
출력 예:  App --> NotesContext
CSS 등 비-TS 파일 import도 포함한다. 외부 패키지(상대경로가 아닌 import)는 제외한다.
"""
import re
import sys
from pathlib import Path

IMPORT_RE = re.compile(r"""(?:import|export)\s+(?:[^'"]*?\sfrom\s+)?['"](\.{1,2}/[^'"]+)['"]""")
EXTS = (".ts", ".tsx", ".js", ".jsx")


def node_id(path: Path, root: Path) -> str:
    return path.relative_to(root).with_suffix("").as_posix() if path.suffix in EXTS else path.relative_to(root).as_posix()


def resolve(base: Path, spec: str) -> Path:
    target = (base.parent / spec).resolve()
    for cand in [target, *(target.with_suffix(e) for e in EXTS), *((target / f"index{e}") for e in EXTS)]:
        if cand.is_file():
            return cand
    return target


def main() -> None:
    root = Path(sys.argv[1] if len(sys.argv) > 1 else "src").resolve()
    edges = []
    for f in sorted(root.rglob("*")):
        if f.suffix not in EXTS or ".test." in f.name:
            continue
        for spec in IMPORT_RE.findall(f.read_text(encoding="utf-8")):
            dst = resolve(f, spec)
            try:
                edges.append((node_id(f, root), node_id(dst, root)))
            except ValueError:
                continue
    print("flowchart LR")
    for a, b in edges:
        q = lambda s: '"' + s + '"'
        print(f"  {q(a)} --> {q(b)}")


if __name__ == "__main__":
    main()
