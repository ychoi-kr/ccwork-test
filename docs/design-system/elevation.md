# 엘리베이션

- **Layering Principle**: 일반 카드에는 그림자를 쓰지 않는다. `surface_container`(`#eaeff1`) 섹션 위에 `surface_container_lowest`(`#ffffff`) 카드를 올려 종이가 겹친 듯한 lift를 만든다.
- **Ambient Shadow** (팝오버처럼 정말 떠야 할 때만): blur 24–40px, `on_surface`(`#2b3437`) 6% 불투명도, 액센트 색을 살짝 섞어 틴트.
- **Ghost Border** (접근성상 경계가 꼭 필요할 때만): `outline_variant`(`#abb3b7`) **15% 불투명도**. 경계가 아니라 선의 암시.

기본 그림자(`shadow-sm/md/lg`)와 `shadow-[0_2px_12px_rgba(...)]` 같은 하드코딩은 금지.
