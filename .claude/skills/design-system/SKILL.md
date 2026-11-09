---
name: design-system
description: 이 프로젝트의 디자인 시스템(The Digital Atelier)에 맞춰 UI 스타일 작업을 수행하고 검사한다. 컴포넌트 생성·수정, Tailwind 클래스, 색상, 배경, 테두리, 그림자, 폰트, 간격, 버튼, 카드, 입력, 태그 칩, 사이드바, 레이아웃, index.css 등 화면의 모양과 관련된 모든 작업에 사용한다. "스타일", "디자인", "UI", "예쁘게", "색", "여백" 같은 말이 없어도 JSX의 className이나 보이는 화면을 바꾸는 작업이면 반드시 이 스킬을 먼저 사용한다.
---

# design-system

`src/`의 화면 모양을 바꿀 때 따르는 절차다. 규칙의 원본은 `docs/design-system/`에 있고, 이 스킬은 **무엇을 읽을지**와 **어떻게 검사할지**만 정한다. 규칙을 이 파일에 복사하지 않는다(어긋남 방지).

## 절차

1. **원칙 확인**: `docs/design-system/principles.md`(Do / Don't)를 읽는다. CLAUDE.md가 상시 로딩하지만 이 스킬이 호출됐다면 한 번 더 확인한다.
2. **필요한 문서만 읽기** (아래 표). 전부 읽지 않는다.
3. **구현**: 건드리는 컴포넌트에만 적용한다. 요청 없이 다른 컴포넌트를 일괄 변환하지 않는다. 기존 토큰(`bg-card`, `border-border` 등)은 마이그레이션이 끝날 때까지 병행 가능하다.
4. **검사**: `python3 -I .claude/skills/design-system/scripts/check_styles.py src`를 실행해 신규 위반이 0건인지 확인한다. (편집 시 PostToolUse 훅이 같은 검사를 자동 실행한다.)
5. **baseline 정리**: 위반이 있던 컴포넌트를 디자인 시스템에 맞게 전환했다면 `--update-baseline`으로 baseline을 갱신한다. 새 위반을 숨기려고 baseline을 갱신하지 않는다.

## 어떤 작업에 어떤 문서를 읽나

| 작업                                   | 읽을 문서 (`docs/design-system/`) |
| -------------------------------------- | --------------------------------- |
| 색, 배경, 표면, 그라디언트, `@theme`   | `colors.md`                       |
| 폰트, 글자 크기, 라벨                  | `typography.md`                   |
| 그림자, 테두리, 레이어링               | `elevation.md`                    |
| 여백, 간격                             | `spacing.md`                      |
| 버튼                                   | `components/button.md`            |
| 노트 카드·목록 (`NoteItem`/`NoteList`) | `components/card-list.md`         |
| 입력·에디터 (`NoteEditor`)             | `components/input.md`             |
| 태그 칩                                | `components/knowledge-token.md`   |
| 레이아웃, 사이드바, 모달·드롭다운      | `components/layout.md`            |
| 기존 코드와의 격차, 열린 이슈          | `migration.md`                    |

## 검사 스크립트

```bash
python3 -I .claude/skills/design-system/scripts/check_styles.py src            # 신규 위반만 (baseline 제외)
python3 -I .claude/skills/design-system/scripts/check_styles.py --all src      # 기존 위반 포함 전체
python3 -I .claude/skills/design-system/scripts/check_styles.py --update-baseline src
```

탐지 규칙: `no-line`(border/divide/h-px/hr), `no-shadow`, `no-pure-black`, `no-hardcoded-color`, `no-inline-style`. 위반이 나오면 메시지의 안내대로 토큰 클래스·배경색 차이·간격으로 고친다. 정말 예외가 필요하면 임의로 baseline에 넣지 말고 사용자에게 먼저 묻는다.

## 주의

- 디자인 시스템 토큰(`bg-surface`, `text-on-surface`, `bg-tertiary` 등)은 `src/index.css` `@theme`에 아직 없을 수 있다. 쓰려면 `colors.md`의 매핑안을 `@theme`에 추가해야 하며, 이는 사용자가 요청했을 때만 한다. 토큰이 없을 때는 하드코딩하지 말고 사용자에게 알린다.
- 이 프로젝트의 UI 텍스트와 주석은 한국어다.
