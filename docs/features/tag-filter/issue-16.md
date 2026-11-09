# TAG-16. 노트 카드에 태그 배지를 보여 준다 (TF-4) — 시그니처와 테스트 시나리오

> 상태: 완료
> 근거: GitHub 이슈 #16, [`prd.md`](./prd.md), [`issues.md`](./issues.md)

## 시그니처

### 타입

신규 타입 없음. `Note.tags?: string[]`(기존)를 그대로 쓴다.

### 함수 · 훅

신규 함수·훅 없음. 배지는 `NoteItem` 안에서 `note.tags ?? []`를 그대로 렌더한다(정렬·중복 제거·대소문자 합치기 없음, 저장된 순서 유지).

### 컴포넌트 Props

```ts
// src/notes/NoteItem.tsx (Props 변경 없음)
interface NoteItemProps {
  note: Note;
  isSelected: boolean;
  onSelect: (id: string) => void;
  onDelete: (id: string) => void;
}
export function NoteItem(props: NoteItemProps): JSX.Element;
```

| 대상            | 변경 전                                    | 변경 후                                                                                            |
| --------------- | ------------------------------------------ | -------------------------------------------------------------------------------------------------- |
| `NoteItem` 렌더 | 제목/삭제, 내용, 날짜                      | 내용과 날짜 사이(위치는 미결)에 `note.tags`가 1개 이상일 때만 읽기 전용 배지 영역(`<span>`들) 추가 |
| `NoteItemProps` | `{ note; isSelected; onSelect; onDelete }` | 동일                                                                                               |

- 배지는 `<button>`이 아니며 별도 `onClick`이 없다. 클릭은 카드 `div`의 `onClick`(`onSelect(note.id)`)으로 버블링된다.
- 배지 컨테이너는 줄바꿈(`flex-wrap`)하며 개수 상한·"+N" 접기가 없다.
- 삭제 버튼의 `stopPropagation` 동작은 변경 없음.
- `selectedTag` props, 하이라이트는 TF-5 범위라 이번에 만들지 않는다. 스타일은 `design-system` 스킬 기준(구현 단계).

### 에러 케이스

| 대상       | 상황                 | 동작                                     |
| ---------- | -------------------- | ---------------------------------------- |
| `NoteItem` | `tags`가 `undefined` | 배지 영역 렌더 안 함, 에러 없음          |
| `NoteItem` | `tags`가 `[]`        | 배지 영역 렌더 안 함                     |
| `NoteItem` | 배지 클릭            | 필터 변경 없음, `onSelect(note.id)` 호출 |

### 미결 사항

> 자율 모드: 아래 기본 제안 3건을 모두 수용한 것으로 확정한다.

1. 배지 위치는 내용과 날짜 사이로 한다.
2. 중복 태그는 저장된 그대로 모두 표시한다(`key`는 `tag-index`).
3. 배지는 `NoteItem` 안에 인라인으로 둔다(`TagBadge` 분리 없음).

## 테스트 시나리오

### NoteItem

1. [정상] NoteItem – should render one badge per tag in stored order when note has tags
2. [정상] NoteItem – should call onSelect with the note id and keep other behavior unchanged when a badge is clicked
3. [경계] NoteItem – should not render the badge area when tags is an empty array
4. [경계] NoteItem – should not render the badge area when the tags field is missing
5. [경계] NoteItem – should render every badge with no "+N" collapse when there are many tags
6. [예외] NoteItem – should not render badges as buttons and keep the delete button stopPropagation behavior when tags are shown
7. [예외] NoteItem – should render duplicated tags as separate badges without error when tags contain the same string twice

## AC 커버리지

| AC                                                     | 시나리오 |
| ------------------------------------------------------ | -------- |
| 태그 `react`, `study` 배지가 저장된 순서대로 보인다    | 1        |
| 태그 없음/`tags` 필드 없음이면 배지 영역 미렌더        | 3, 4     |
| 많은 태그가 줄바꿈되어 모두 보이고 상한·"+N" 없음      | 5        |
| 배지 클릭 시 필터 불변, 카드 클릭처럼 해당 노트 선택   | 2        |
| 배지는 `<button>`이 아니고 삭제 `stopPropagation` 유지 | 6        |
| (미결 2 확정) 중복 태그 표시                           | 7        |
