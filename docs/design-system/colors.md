# 색상

## 토큰

| 토큰                        | 값        | 용도                                                 |
| --------------------------- | --------- | ---------------------------------------------------- |
| `surface` / `background`    | `#f8f9fa` | 기본 캔버스                                          |
| `surface_container_low`     | `#f1f4f6` | 사이드바, 내비게이션 배경, 목록 hover                |
| `surface_container`         | `#eaeff1` | 카드가 올라가는 섹션 배경                            |
| `surface_container_high`    | `#e2e9ec` | Secondary 버튼 배경                                  |
| `surface_container_highest` | `#dbe4e7` | 사이드바 "선택됨" 상태, Knowledge Token(칩) 배경     |
| `surface_container_lowest`  | `#ffffff` | 최우선 카드, 작업 영역, 입력 필드 ("떠 있는 종이")   |
| `on_surface`                | `#2b3437` | 기본·강조 텍스트 (**순수 검정 `#000` 금지**)         |
| `on_surface_variant`        | `#586064` | 장문 본문, 칩 텍스트                                 |
| `outline_variant`           | `#abb3b7` | Ghost Border (불투명도 15%로만 사용)                 |
| `tertiary`                  | `#0053dc` | 유일한 액센트. Ghost 버튼 텍스트, 입력 포커스 테두리 |
| `tertiary_container`        | `#3e76fe` | Primary 버튼 그라디언트 끝색                         |
| `on_tertiary`               | `#faf8ff` | Primary 버튼 위 텍스트                               |

## 규칙

- **No-Line**: 섹션을 나누는 1px 실선 테두리 금지. 사이드바는 `surface_container_low`가 `surface`에 바로 맞닿게 한다.
- **표면 계층**: `surface`(바닥) → `surface_container_low`(보조 영역) → `surface_container_lowest`(들어올린 카드).
- **Glass**: 떠 있는 요소는 `surface` 80% 불투명 + `backdrop-filter: blur(12px)`.
- **Gradient**: Primary CTA는 `tertiary` → `tertiary_container` 선형 그라디언트.

## Tailwind v4 `@theme` 매핑안

> 제안이며 `src/index.css`에는 아직 적용하지 않았다. 적용은 별도 작업.

```css
@theme {
  --color-surface: #f8f9fa;
  --color-surface-container-low: #f1f4f6;
  --color-surface-container: #eaeff1;
  --color-surface-container-high: #e2e9ec;
  --color-surface-container-highest: #dbe4e7;
  --color-surface-container-lowest: #ffffff;
  --color-on-surface: #2b3437;
  --color-on-surface-variant: #586064;
  --color-outline-variant: #abb3b7;
  --color-tertiary: #0053dc;
  --color-tertiary-container: #3e76fe;
  --color-on-tertiary: #faf8ff;
}
```
