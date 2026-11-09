#!/usr/bin/env python3
"""디자인 시스템 위반 검사기.

사용법:
  python3 check_styles.py [경로...]       # 기본 src. baseline에 없는 '신규' 위반만 보고 (위반 시 exit 1)
  python3 check_styles.py --all [경로...]  # baseline 무시, 모든 위반 보고
  python3 check_styles.py --update-baseline [경로...]  # 현재 위반을 baseline으로 저장
  python3 check_styles.py --hook          # Claude Code PostToolUse 훅 모드 (stdin JSON, 위반 시 exit 2)

규칙 출처: docs/design-system/principles.md (Do / Don't)
"""

import json
import re
import sys
from collections import Counter
from pathlib import Path

ROOT = Path(__file__).resolve().parents[4]
BASELINE = Path(__file__).resolve().parents[1] / 'baseline.json'
EXTS = {'.tsx', '.ts', '.css'}

# (규칙 id, 정규식, 메시지)
RULES = [
    (
        'no-line',
        re.compile(r'(?<![\w-])(border(-[rltbxy])?|divide-[xy])(?![\w-])|(?<![\w-])h-px(?![\w-])|<hr[\s/>]'),
        '구분선/테두리 금지: 배경색 차이나 간격을 쓴다 (필요하면 Ghost Border 15%)',
    ),
    (
        'no-shadow',
        re.compile(r'(?<![\w-])shadow(-(sm|md|lg|xl|2xl|inner|\[[^\]]*\]))?(?![\w-])'),
        '기본/하드코딩 그림자 금지: Layering 또는 Ambient Shadow만',
    ),
    (
        'no-pure-black',
        re.compile(r'#0{3}(?:0{3})?\b|(?<![\w-])text-black(?![\w-])|rgba?\(\s*0\s*,\s*0\s*,\s*0'),
        '순수 검정 금지: on_surface(#2b3437)를 쓴다',
    ),
    (
        'no-hardcoded-color',
        re.compile(r'#(?:[0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{3,4})\b|(?<![\w-])(?:rgba?|hsla?)\('),
        '하드코딩 색 금지: @theme 토큰 클래스를 쓴다',
    ),
    (
        'no-inline-style',
        re.compile(r'style=\{\{'),
        '인라인 style 금지: 토큰 클래스를 쓴다',
    ),
]


def scan_file(path: Path):
    """파일의 (rule, 정규화된 줄, 줄번호) 위반 목록."""
    try:
        lines = path.read_text(encoding='utf-8').splitlines()
    except (OSError, UnicodeDecodeError):
        return []
    found = []
    in_theme = False
    for no, line in enumerate(lines, 1):
        if path.suffix == '.css':
            # @theme 블록은 토큰을 '정의'하는 곳이므로 색 규칙을 적용하지 않는다
            if re.match(r'\s*@theme\b', line):
                in_theme = True
            elif in_theme and line.strip().startswith('}'):
                in_theme = False
                continue
        for rule, pattern, _ in RULES:
            if in_theme and rule in ('no-hardcoded-color', 'no-pure-black'):
                continue
            if pattern.search(line):
                found.append((rule, ' '.join(line.split()), no))
    return found


def collect(paths):
    files = []
    for p in paths:
        p = Path(p)
        if not p.is_absolute():
            p = ROOT / p
        if p.is_dir():
            files += [f for f in sorted(p.rglob('*')) if f.suffix in EXTS and 'test' not in f.name]
        elif p.suffix in EXTS:
            files.append(p)
    return files


def rel(path: Path) -> str:
    try:
        return str(path.resolve().relative_to(ROOT))
    except ValueError:
        return str(path)


def load_baseline() -> Counter:
    if not BASELINE.exists():
        return Counter()
    data = json.loads(BASELINE.read_text(encoding='utf-8'))
    return Counter({(e['file'], e['rule'], e['line']): e['count'] for e in data})


def find_violations(files, use_baseline=True):
    allowed = load_baseline() if use_baseline else Counter()
    result = []
    for f in files:
        for rule, text, no in scan_file(f):
            key = (rel(f), rule, text)
            if allowed[key] > 0:
                allowed[key] -= 1
                continue
            result.append((rel(f), no, rule, text))
    return result


def message(rule):
    return next(m for r, _, m in RULES if r == rule)


def report(violations):
    for file, no, rule, text in violations:
        print(f'{file}:{no} [{rule}] {message(rule)}\n    {text}', file=sys.stderr)
    print(
        f'\n디자인 시스템 위반 {len(violations)}건. docs/design-system/principles.md 의 Do/Don\'t 참고.',
        file=sys.stderr,
    )


def update_baseline(files):
    counts = Counter()
    for f in files:
        for rule, text, _ in scan_file(f):
            counts[(rel(f), rule, text)] += 1
    data = [
        {'file': k[0], 'rule': k[1], 'line': k[2], 'count': c} for k, c in sorted(counts.items())
    ]
    BASELINE.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(f'baseline 저장: {len(data)}개 항목 ({sum(counts.values())}건) → {rel(BASELINE)}')


def run_hook():
    try:
        payload = json.load(sys.stdin)
        file_path = payload.get('tool_input', {}).get('file_path')
    except (json.JSONDecodeError, AttributeError):
        return 0
    if not file_path:
        return 0
    path = Path(file_path)
    r = rel(path)
    if not r.startswith('src/') or path.suffix not in EXTS or 'test' in path.name:
        return 0
    violations = find_violations([path])
    if violations:
        report(violations)
        return 2
    return 0


def main(argv):
    if '--hook' in argv:
        return run_hook()
    args = [a for a in argv if not a.startswith('--')]
    files = collect(args or ['src'])
    if '--update-baseline' in argv:
        update_baseline(files)
        return 0
    violations = find_violations(files, use_baseline='--all' not in argv)
    if violations:
        report(violations)
        return 1
    print('디자인 시스템 위반 없음 (baseline 제외)')
    return 0


if __name__ == '__main__':
    sys.exit(main(sys.argv[1:]))
