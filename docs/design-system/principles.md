# 디자인 원칙 (The Digital Atelier)

**Creative North Star: The Curated Archive** — Soft Minimalism. 노트를 "소장품"처럼 다루고, UI는 배움의 순간보다 앞서지 않는다.

1. **Tonal Depth** — 경계는 선이 아니라 배경색 차이로 만든다.
2. **Typography-driven** — 아이콘·장식보다 글자 크기와 굵기로 위계를 만든다.
3. **Sparing accent** — 액센트(`tertiary`) 하나만, 의도가 있는 동작에만 쓴다.

상세 스펙은 [README.md](./README.md)의 인덱스에서 필요한 문서만 읽는다.

## ✅ Do

- 여백을 구조로 쓴다. 애매하면 마진을 늘린다.
- 경계는 배경색 차이(`surface` ↔ `surface_container_*`)로 만든다.
- 들어올린 카드는 `surface_container_lowest` 위 톤 레이어링으로 표현한다.
- 사이드바 "선택됨"은 `surface_container_highest`로 표시한다.
- 액센트(`tertiary`)는 주요 CTA·포커스 같은 의도 있는 동작에만 아껴 쓴다.
- 목록 항목은 구분선 없이 `spacing.4`(1.4rem) 간격으로 나눈다.
- 메타데이터 라벨은 `label-md` + `uppercase` + `+0.05em`.
- 색·폰트·간격은 `@theme` 토큰 클래스로 쓴다.
- 떠 있는 요소(모달, 드롭다운)는 `surface` 80% + `blur(12px)`.

## ❌ Don't

- 텍스트에 순수 검정 `#000000`을 쓰지 않는다. `on_surface`(`#2b3437`)를 쓴다.
- 기본 그림자(`shadow-md` 등, 하드코딩 `shadow-[...]`)를 쓰지 않는다. 필요하면 Ambient Shadow만.
- 기능적 명확성이 없는 아이콘을 쓰지 않는다.
- 사이드바·섹션 구분에 1px 실선 테두리(`border-r`, `border-b`, `border-t`, `<hr>`, `h-px`)를 쓰지 않는다. 접근성상 필요하면 Ghost Border(15%)만.
- 액센트 색을 장식용으로 흩뿌리지 않는다.
- 하드코딩 hex/`rgba`와 인라인 `style={{ ... }}`을 쓰지 않는다.
- Inter 외 폰트를 본문·제목에 섞지 않는다 (한글 폴백 Pretendard 제외).
