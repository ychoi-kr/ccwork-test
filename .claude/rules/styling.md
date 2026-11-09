---
paths:
  - 'src/**/*.tsx'
  - 'src/**/*.css'
---

# 스타일 작업 규칙 (디자인 시스템)

이 규칙은 `src/`의 UI·스타일 파일을 다룰 때 자동 로딩된다. 규칙의 원본은 `docs/design-system/`이며, 스타일 작업은 `design-system` 스킬로 진행한다.

## 작성 전 체크

- 경계는 **배경색 차이**와 **간격**으로 만든다. `border`, `border-r/b/t/l`, `divide-*`, `h-px`, `<hr>` 금지.
- 그림자 금지: `shadow-*`, `shadow-[...]`. 카드는 `surface_container_lowest`를 `surface_container` 위에 올려 표현한다.
- 순수 검정(`#000`, `text-black`, `rgba(0,0,0,…)`) 금지 → `on_surface`.
- 하드코딩 hex/`rgb()`/`hsl()`, 인라인 `style={{ }}` 금지 → `@theme` 토큰 클래스.
- 액센트(`tertiary`)는 주요 CTA·포커스에만. 불필요한 아이콘 금지.
- 메타 라벨은 `text-xs uppercase tracking-[0.05em]` (`label-md`).
- 한 번에 하나의 컴포넌트만 전환하고, 요청 없이 다른 컴포넌트를 일괄 변환하지 않는다.

## 작성 후

- 편집 직후 PostToolUse 훅이 `check_styles.py`로 신규 위반을 검사한다. 위반 메시지가 오면 같은 턴에 고친다.
- 기존 위반은 `.claude/skills/design-system/baseline.json`에 기록되어 있다. 새 위반을 숨기려고 baseline을 갱신하지 않는다.
