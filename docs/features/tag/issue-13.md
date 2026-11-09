# TF-1. 태그 모음에서 태그를 눌러 노트를 필터링한다 — 시그니처와 테스트 시나리오

> 상태: 완료
> 근거: GitHub 이슈 #13, [`prd.md`](../tag-filter/prd.md), [`issues.md`](../tag-filter/issues.md)

## 시그니처

### 타입

신규 타입 없음. `Note.tags?: string[]`(기존)를 그대로 쓴다.

```ts
// src/tags/useTagFilter.ts
interface UseTagFilterResult {
  tags: string[];
  selectedTag: string | null;
  filteredNotes: Note[];
  toggleTag: (tag: string) => void;
}
```

### 함수 · 훅

```ts
// src/tags/useTagFilter.ts (신규)
export function useTagFilter(notes: Note[]): UseTagFilterResult;
```

- `tags`: 모든 노트의 `tags`(없으면 `[]`)를 문자열 완전 일치로 중복 제거하고 `localeCompare('ko')`로 정렬.
- `selectedTag`: 마지막으로 누른 태그 문자열 상태 그대로(없으면 `null`). 자동 해제는 TF-2 범위.
- `filteredNotes`: `selectedTag`가 `null`이면 `notes` 그대로, 아니면 `tags`에 그 문자열(완전 일치)을 가진 노트만. 원래 순서 유지.
- `toggleTag(tag)`: 현재 `selectedTag`와 같으면 `null`, 다르면 `tag`로 교체.

### 컴포넌트 Props

```ts
// src/tags/TagFilter.tsx (신규)
interface TagFilterProps {
  tags: string[];
  selectedTag: string | null;
  onToggle: (tag: string) => void;
}
export function TagFilter(props: TagFilterProps): JSX.Element | null; // tags가 비면 null

// src/layout/Sidebar.tsx (신규)
interface SidebarProps {
  selectedNoteId: string | null;
  onSelect: (id: string) => void;
}
export function Sidebar(props: SidebarProps): JSX.Element;
```

| 대상               | 변경 전                                              | 변경 후                                                                                                     |
| ------------------ | ---------------------------------------------------- | ----------------------------------------------------------------------------------------------------------- |
| `NoteListProps`    | `{ selectedNoteId; onSelect }` (목록은 `useNotes()`) | `{ notes: Note[]; selectedNoteId; onSelect }` (목록은 props, `loading`/`error`/`deleteNote`는 `useNotes()`) |
| `App` sidebar 슬롯 | `<NoteList selectedNoteId onSelect />`               | `<Sidebar selectedNoteId onSelect />`                                                                       |

- `Sidebar`: `useNotes()`에서 `notes`, `loading`, `error`를 읽고 `useTagFilter(notes)` 호출. `!loading && !error`일 때만 `TagFilter` 렌더. `NoteList`에 `filteredNotes`를 `notes`로 전달.
- `NoteList`의 "노트 N개"와 빈 상태("노트가 없습니다") 판정은 props로 받은 `notes` 길이를 쓴다.
- `NoteItem`, `selectedTag` props 전달, 배지, 대소문자 합치기(`isSameTag`)는 TF-3~5 범위라 이번에 만들지 않는다.

### 에러 케이스

| 대상                 | 상황                              | 동작                                                                     |
| -------------------- | --------------------------------- | ------------------------------------------------------------------------ |
| `useTagFilter`       | `tags` 필드가 없는 노트           | `[]`로 간주, 예외 없음                                                   |
| `useTagFilter`       | `notes`가 빈 배열                 | `tags: []`, `filteredNotes: []`                                          |
| `useTagFilter`       | `notes`에 없는 태그를 `toggleTag` | 그대로 `selectedTag`가 되고 `filteredNotes`는 빈 배열 (자동 해제는 TF-2) |
| `TagFilter`          | `tags`가 빈 배열                  | `null` 반환                                                              |
| `Sidebar`            | `loading` 또는 `error`            | `TagFilter` 미렌더, `NoteList`가 기존 로딩/에러 문구 표시                |
| `Sidebar`/`NoteList` | 필터 선택 변경                    | `selectedNoteId`, `isCreating`은 건드리지 않음 (props 통과만)            |
| `NoteList` 삭제 실패 | 기존과 동일                       | `console.error`만 기록                                                   |

### 미결 사항

> 개발자가 시그니처를 승인했고, 아래 가정 3건은 그 승인에 포함되어 수용된 것으로 처리한다. (`Skill` 호출로 `승인` 인자가 전달되지 않아 상태 전환과 단계 B는 `/tdd-loop`가 개발자 지시에 따라 직접 수행했다.)

1. 필터 결과가 0건일 때(태그가 사라진 경우 등) `NoteList`는 기존 "노트가 없습니다"를 그대로 보여 주는 것으로 가정한다. 별도 문구가 필요하면 알려 주세요.
2. 빈 문자열·공백 태그는 `useTagFilter`가 걸러내지 않고 입력(`TagInput`)의 검증에 맡기는 것으로 가정한다.
3. 시나리오의 `Sidebar` 테스트는 `NotesProvider` + `fetch` mock 통합 형태를 가정한다(`NotesContext.test.tsx` 방식). 괜찮은지 확인 바랍니다.

## 테스트 시나리오

### useTagFilter

1. [정상] useTagFilter – should return deduplicated tags sorted in ko locale order when notes have different tags
2. [정상] useTagFilter – should return selectedTag null and filteredNotes equal to all notes when no tag has been toggled
3. [정상] useTagFilter – should set selectedTag and keep only notes having that tag in original order when toggleTag is called with a tag
4. [정상] useTagFilter – should replace selectedTag and filteredNotes when toggleTag is called with a different tag
5. [정상] useTagFilter – should reset selectedTag to null and return all notes when toggleTag is called with the already selected tag
6. [경계] useTagFilter – should treat notes without a tags field as having no tags when some notes lack tags
7. [경계] useTagFilter – should return empty tags and empty filteredNotes when notes is an empty array
8. [경계] useTagFilter – should list a tag only once when several notes share it
9. [경계] useTagFilter – should sort Hangul and Latin tags in ko locale order when tags mix both
10. [예외] useTagFilter – should set selectedTag and return empty filteredNotes when toggleTag is called with a tag no note has

### TagFilter

11. [정상] TagFilter – should render one button per tag when tags is not empty
12. [정상] TagFilter – should set aria-pressed true only on the selected tag chip when selectedTag matches a tag
13. [정상] TagFilter – should call onToggle with the tag when a chip is clicked
14. [경계] TagFilter – should set aria-pressed false on every chip when selectedTag is null
15. [경계] TagFilter – should not render note counts next to chips when tags are rendered
16. [경계] TagFilter – should render nothing when tags is empty

### NoteList

17. [정상] NoteList – should render the given notes and the "노트 N개" count based on the notes prop when notes are passed
18. [경계] NoteList – should show "노트가 없습니다" when the notes prop is empty
19. [예외] NoteList – should show the loading text instead of the list when loading is true
20. [예외] NoteList – should show the error text instead of the list when error is set
21. [정상] NoteList – should call deleteNote with the note id when a delete button is clicked

### Sidebar (NotesProvider + fetch mock 통합)

22. [정상] Sidebar – should show tag chips above the note list when notes with tags are loaded
23. [정상] Sidebar – should show only notes having the tag and update the "노트 N개" count when a chip is clicked
24. [정상] Sidebar – should switch the filter to the other tag and unpress the previous chip when another chip is clicked
25. [정상] Sidebar – should show all notes again and unpress the chip when the selected chip is clicked again
26. [정상] Sidebar – should call onSelect with the note id and mark selectedNoteId as selected when a note card is clicked
27. [경계] Sidebar – should not render tag chips and keep the full list when no note has tags
28. [예외] Sidebar – should not render tag chips while notes are loading
29. [예외] Sidebar – should not render tag chips and show the error text when fetching notes fails

### App (통합)

30. [정상] App – should keep the editor showing the note being edited and keep isCreating unchanged when a chip hides that note from the list
31. [경계] App – should keep the new-note form with the typed title when a chip is clicked while creating a new note (ac-verifier 갭 보완: AC7의 `isCreating` 불변)

## AC 커버리지

| AC 항목                                                                           | 시나리오 번호       |
| --------------------------------------------------------------------------------- | ------------------- |
| 모든 태그가 중복 없이 가나다순 칩으로 보이고 개수는 표시되지 않는다               | 1, 8, 9, 11, 15, 22 |
| 칩을 누르면 해당 태그 노트만 남고 "노트 N개"가 바뀌며 칩이 `aria-pressed="true"`  | 3, 12, 13, 17, 23   |
| 다른 칩을 누르면 필터가 교체되고 이전 칩은 `aria-pressed="false"`                 | 4, 14, 24           |
| 같은 칩을 다시 누르면 필터가 해제되어 전체 노트가 보인다                          | 5, 25               |
| 태그가 없거나 `tags` 필드가 없으면 태그 모음이 렌더되지 않고 리스트는 그대로      | 6, 7, 16, 27        |
| 불러오는 중이거나 실패하면 태그 모음이 보이지 않는다                              | 19, 20, 28, 29      |
| 편집 중인 노트가 필터에 안 맞아도 편집기 유지, `selectedNoteId`/`isCreating` 불변 | 26, 30, 31          |

AC에 없지만 설계에서 필요해 추가한 시나리오: 10(존재하지 않는 태그 선택, 자동 해제는 TF-2), 18·21(`NoteList` props 전환 회귀), 2(필터 꺼짐 기본값).

시나리오가 없는 AC: 없음.
