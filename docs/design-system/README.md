# 디자인 시스템: The Digital Atelier

Stitch가 제공한 노트 앱 디자인 시스템. 원문은 [source-stitch.md](./source-stitch.md)(수정 금지).

스타일 작업은 `design-system` 스킬(`.claude/skills/design-system/`)로 진행하고, 아래에서 **작업에 필요한 문서만** 읽는다. 핵심 원칙과 Do/Don't는 [principles.md](./principles.md)에 있으며 CLAUDE.md가 상시 로딩한다.

| 문서                                                             | 읽는 때                              |
| ---------------------------------------------------------------- | ------------------------------------ |
| [principles.md](./principles.md)                                 | 항상 (원칙 + Do/Don't)               |
| [colors.md](./colors.md)                                         | 색, 배경, 표면, 그라디언트, `@theme` |
| [typography.md](./typography.md)                                 | 폰트, 글자 크기, 라벨                |
| [elevation.md](./elevation.md)                                   | 그림자, 테두리, 레이어링             |
| [spacing.md](./spacing.md)                                       | 여백, 간격, 리듬                     |
| [components/button.md](./components/button.md)                   | 버튼                                 |
| [components/card-list.md](./components/card-list.md)             | `NoteItem`, `NoteList`               |
| [components/input.md](./components/input.md)                     | `NoteEditor` 입력                    |
| [components/knowledge-token.md](./components/knowledge-token.md) | 태그 칩                              |
| [components/layout.md](./components/layout.md)                   | `Layout`, 사이드바, 모달             |
| [migration.md](./migration.md)                                   | 기존 코드 격차, baseline, 열린 이슈  |
