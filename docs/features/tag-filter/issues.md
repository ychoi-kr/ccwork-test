# 태그 필터링 이슈 목록

> 근거 문서: [`prd.md`](./prd.md), [`spec-fixed.md`](./spec-fixed.md). GitHub에 등록 완료(TF-1~5 = #13~#17).

## 분해 원칙

- **수직 슬라이싱**: 각 이슈는 머지 즉시 사용자가 화면에서 확인할 수 있는 동작 하나를 완성한다. 타입만, 훅만, 스타일만 하는 계층별 이슈는 만들지 않는다.
- 첫 이슈(TF-1)가 `useTagFilter`, `TagFilter`, `Sidebar`의 얇은 end-to-end 뼈대를 세우고, 이후 이슈가 규칙을 하나씩 얹는다.
- 범위는 PRD의 US-1~7과 ADR-001이다. [Out of Scope](./prd.md#5-out-of-scope) 항목은 이슈로 만들지 않는다.
- 스타일 작업은 `design-system` 스킬로 진행하고 디자인 토큰만 쓴다. UI 텍스트와 코드 주석은 한국어.
- 각 이슈는 TDD 사이클(`/test-scenarios` → `/tdd-red` → `/tdd-green` → `@ac-verifier` → `/tdd-refactor` → `/security-review`)을 독립적으로 돌릴 수 있는 크기다.

## 의존 관계와 순서

```
TF-1 ─┬─ TF-2 (선택 태그 자동 해제)
      ├─ TF-3 (대소문자 무시 합치기) ─┐
      │                               ├─ TF-5 (선택 태그 하이라이트)
TF-4 (카드 태그 배지) ────────────────┘
```

TF-4는 필터와 무관하게 `NoteItem`만 고치므로 TF-1과 병렬로 진행할 수 있다.

| ID   | 제목                                              | 스토리           | 의존       |
| ---- | ------------------------------------------------- | ---------------- | ---------- |
| TF-1 | 태그 모음에서 태그를 눌러 노트를 필터링한다       | US-1, 2, 3, 4, 6 | -          |
| TF-2 | 선택한 태그가 사라지면 필터를 자동 해제한다       | US-5             | TF-1       |
| TF-3 | 대소문자만 다른 태그를 하나의 칩으로 합친다       | US-1, 2          | TF-1       |
| TF-4 | 노트 카드에 태그 배지를 보여 준다                 | US-7             | -          |
| TF-5 | 필터로 선택한 태그를 카드 배지에서 하이라이트한다 | US-7             | TF-1, 3, 4 |

---

## TF-1 (#13). 태그 모음에서 태그를 눌러 노트를 필터링한다

### 설명

사이드바 상단에 모든 노트의 태그를 칩으로 모아 보여 주고, 칩을 누르면 리스트에 그 태그가 달린 노트만 남는 가장 얇은 end-to-end 흐름을 만든다. `useTagFilter`, `TagFilter`, `Sidebar`를 세우고 `App`, `NoteList`를 연결한다. 이 단계의 태그 비교는 문자열 완전 일치이며, 자동 해제와 대소문자 합치기는 이후 이슈에서 다룬다.

### 범위

- `src/hooks/useTagFilter.ts`: `tags`(중복 제거, 가나다순), `selectedTag`, `filteredNotes`, `toggleTag`
- `src/components/TagFilter.tsx`: 칩 버튼, `aria-pressed`, 태그가 없으면 `null`
- `src/components/Sidebar.tsx`: 훅 호출, 로딩·에러 중 태그 모음 숨김, `NoteList`에 `notes` 전달
- `NoteList`가 `notes`를 props로 받도록 수정, `App`의 `sidebar` 슬롯을 `Sidebar`로 교체

### Acceptance Criteria

- [ ] Given 노트들이 서로 다른 태그를 가지고 있다, When 앱을 연다, Then 사이드바 상단에 모든 태그가 중복 없이 가나다순 칩으로 보이고 개수는 표시되지 않는다
- [ ] Given 태그 모음이 보인다, When 칩 `react`를 누른다, Then 리스트에 `react` 태그가 달린 노트만 남고 "노트 N개"가 필터된 개수로 바뀌며 해당 칩은 `aria-pressed="true"`가 된다
- [ ] Given 칩 `react`가 선택되어 있다, When 다른 칩 `study`를 누른다, Then 필터가 `study`로 교체되고 `react` 칩은 `aria-pressed="false"`가 된다
- [ ] Given 칩 `react`가 선택되어 있다, When 같은 칩을 다시 누른다, Then 필터가 해제되어 전체 노트가 보인다
- [ ] Given 어떤 노트도 태그가 없거나 `tags` 필드가 없다, When 앱을 연다, Then 태그 모음 영역이 렌더되지 않고 기존 리스트가 그대로 보인다
- [ ] Given 노트를 불러오는 중이거나 불러오기에 실패했다, When 화면을 본다, Then 태그 모음이 보이지 않는다
- [ ] Given 노트 A를 편집 중이고 A는 `react` 태그가 없다, When 칩 `react`를 누른다, Then 리스트에서 A가 사라져도 편집기는 A를 그대로 보여 주고 `selectedNoteId`, `isCreating`은 바뀌지 않는다

---

## TF-2 (#14). 선택한 태그가 사라지면 필터를 자동 해제한다

### 설명

필터가 켜진 상태에서 그 태그가 어떤 노트에도 남지 않게 되면(편집기에서 태그를 지워 저장, 마지막 노트 삭제) 막다른 빈 화면 대신 전체 목록으로 돌아간다. `selectedTag`를 `useEffect`로 지우지 않고 "`tags`에 있을 때만 유효"한 파생 계산으로 구현한다(ADR-001).

### Acceptance Criteria

- [ ] Given 칩 `react`가 선택되어 있고 `react` 태그를 가진 노트가 하나뿐이다, When 편집기에서 그 노트의 `react` 태그를 지우고 저장한다, Then 필터가 자동 해제되어 전체 노트가 보이고 `react` 칩도 사라진다
- [ ] Given 칩 `react`가 선택되어 있고 `react` 태그를 가진 노트가 하나뿐이다, When 그 노트를 삭제한다, Then 필터가 자동 해제되어 전체 노트가 보인다
- [ ] Given 칩 `react`가 선택되어 있고 `react` 태그를 가진 노트가 둘이다, When 그중 한 노트를 삭제한다, Then 필터는 유지되고 남은 노트만 보인다
- [ ] Given 필터가 자동 해제된 상태다, When 화면을 본다, Then 어떤 칩도 `aria-pressed="true"`가 아니고 "노트 N개"는 전체 개수를 보여 준다
- [ ] Given 편집기에서 저장해 다른 노트에 새 태그가 생겼다, When 저장이 끝난다, Then 새 태그 칩이 즉시 태그 모음에 나타난다

> 알려진 동작(받아들인 단점, 이슈로 고치지 않음): 해제된 뒤 같은 태그가 다시 생기면 새로고침 전까지 필터가 다시 켜질 수 있다.

---

## TF-3 (#15). 대소문자만 다른 태그를 하나의 칩으로 합친다

### 설명

노트 A의 `React`와 노트 B의 `react`를 칩 하나로 합치고, 누르면 두 노트가 모두 나오게 한다. `isSameTag(a, b)`(대소문자 무시)를 `useTagFilter.ts`에서 export하고, 집계와 필터링, 선택 유효성 판정이 이 함수를 쓰도록 바꾼다.

### Acceptance Criteria

- [ ] Given 노트 A에 `React`, 노트 B에 `react`가 있다, When 앱을 연다, Then 태그 모음에 칩이 하나만 보이고 표기는 리스트 순서상 먼저 나온 노트의 `React`다
- [ ] Given 위 칩이 있다, When 칩을 누른다, Then 노트 A와 B가 모두 리스트에 남는다
- [ ] Given 칩 `React`가 선택되어 있다, When 편집기에서 먼저 나온 노트의 `React`를 지워 칩 표기가 `react`로 바뀐다, Then 필터는 유지되고 `react` 칩이 선택된 상태로 보인다
- [ ] Given 태그 모음에 `Banana`, `apple`, `가나`, `나다`가 있다, When 화면을 본다, Then 대소문자를 무시한 한국어 로케일 순서로 정렬되어 보인다
- [ ] Given `isSameTag`, When `('React', 'react')`와 `('React', 'vue')`를 비교한다, Then 각각 `true`, `false`다

---

## TF-4 (#16). 노트 카드에 태그 배지를 보여 준다

### 설명

리스트의 각 노트 카드(`NoteItem`)에 그 노트의 태그를 읽기 전용 배지로 보여 준다. 필터와 무관하게 `NoteItem`만 수정하므로 TF-1과 병렬로 진행할 수 있다. 하이라이트는 TF-5에서 다룬다. 스타일은 `design-system` 스킬로 진행한다.

### Acceptance Criteria

- [ ] Given 태그 `react`, `study`를 가진 노트가 있다, When 리스트를 본다, Then 그 카드에 `react`, `study` 배지가 저장된 순서대로 보인다
- [ ] Given 태그가 없거나 `tags` 필드가 없는 노트가 있다, When 리스트를 본다, Then 그 카드에는 배지 영역이 렌더되지 않는다
- [ ] Given 태그가 많아 한 줄을 넘는다, When 카드를 본다, Then 배지가 줄바꿈되어 모두 보이고 개수 상한이나 "+N" 접기는 없다
- [ ] Given 카드의 배지, When 배지를 클릭한다, Then 필터는 바뀌지 않고 카드 클릭과 같이 해당 노트만 선택된다
- [ ] Given 카드의 배지, When 접근성 트리를 확인한다, Then 배지는 `<button>`이 아니고 삭제 버튼의 `stopPropagation` 동작은 그대로다

---

## TF-5 (#17). 필터로 선택한 태그를 카드 배지에서 하이라이트한다

### 설명

필터가 켜진 동안 카드 배지 중 선택된 태그와 같은 것(대소문자 무시)을 하이라이트한다. `Sidebar`가 `selectedTag`를 `NoteList` → `NoteItem`으로 props로 내려보내고, `NoteItem`은 `isSameTag`로 판정한다. 하이라이트는 `surface_container_highest` 등 디자인 시스템 토큰으로 표현하고 액센트 색은 쓰지 않는다.

### Acceptance Criteria

- [ ] Given 노트 카드에 `react`, `study` 배지가 있고 필터가 꺼져 있다, When 리스트를 본다, Then 어떤 배지도 하이라이트되지 않는다
- [ ] Given 칩 `react`를 눌렀다, When 리스트를 본다, Then 남은 카드마다 `react` 배지만 하이라이트되고 `study` 배지는 그대로다
- [ ] Given 칩 `React`가 선택되어 있고 어떤 카드에 `react` 배지가 있다, When 리스트를 본다, Then 그 배지도 하이라이트된다(대소문자 무시)
- [ ] Given 하이라이트가 켜져 있다, When 선택된 칩을 다시 눌러 필터를 해제하거나 TF-2로 자동 해제된다, Then 모든 하이라이트가 사라진다
- [ ] Given 하이라이트된 배지, When 접근성 트리를 확인한다, Then 하이라이트는 색에만 의존하지 않도록 구분 가능한 시각 단서(배경 톤 차이 등)가 있고 배지는 여전히 표시 전용이다
