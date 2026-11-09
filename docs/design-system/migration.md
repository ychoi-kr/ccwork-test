# 마이그레이션 메모

현재 코드와 디자인 시스템의 격차. 스타일 작업 때 **건드리는 컴포넌트만** 점진적으로 전환하고, 기존 토큰은 전환이 끝날 때까지 병행한다.

## 격차

| 영역      | 현재                                                                               | 디자인 시스템                        |
| --------- | ---------------------------------------------------------------------------------- | ------------------------------------ |
| 토큰      | 회색 계열(`background`, `card`, `muted`, `border`)만 있고 액센트·surface 계층 없음 | [colors.md](./colors.md) 토큰 추가   |
| 사이드바  | `border-r border-border`, `bg-muted/50`                                            | 테두리 제거, `surface_container_low` |
| 헤더/카드 | `border-b`, `border border-border`                                                 | 배경색 차이 + 톤 레이어링            |
| 구분선    | `h-px bg-border`, `border-t border-border` (`NoteEditor`)                          | 간격으로 대체                        |
| 그림자    | `shadow-[0_2px_12px_rgba(0,0,0,0.07)]` 등 하드코딩 반복                            | 제거 또는 Ambient Shadow             |
| 버튼      | `bg-foreground text-card rounded-xl`                                               | Primary 그라디언트, `rounded-md`     |
| 라벨      | `text-xs tracking-widest uppercase`                                                | `label-md` (`+0.05em`)               |
| 폰트      | Pretendard + Boogaloo(`Layout` 인라인 style)                                       | Inter 우선, Pretendard 폴백          |

## Baseline (기존 위반)

`check_styles.py`는 `.claude/skills/design-system/baseline.json`에 기록된 기존 위반을 허용하고 **신규 위반만** 보고한다. 컴포넌트를 전환하면 baseline에서 해당 항목을 지운다(`--update-baseline`).

## 열린 이슈

- Boogaloo(`--font-display`) 로고 폰트 유지 여부
- `@theme` 토큰 실제 적용 시점 (별도 작업)
