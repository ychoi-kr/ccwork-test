# 태그 기능 이슈 목록

> 근거 문서: [`prd.md`](./prd.md), [`spec-fixed.md`](./spec-fixed.md)

## 분해 원칙

- **수직 슬라이싱**: 각 이슈는 타입 → API → Context → 훅 → 컴포넌트 → 테스트를 필요한 만큼 관통해, 머지 즉시 사용자가 눈으로 확인할 수 있는 동작 하나를 완성한다. 계층별(타입만, UI만) 이슈는 만들지 않는다.
- 첫 이슈(TAG-1)가 얇은 end-to-end 뼈대(`Note.tags`, `useTags`, `useTagInput`, `TagInput`, PATCH 저장)를 세우고, 이후 이슈는 그 위에 동작을 하나씩 얹는다.
- 범위는 PRD의 US-1~7과 ADR-001이다. [Out of Scope](./prd.md#5-out-of-scope) 항목(검색·필터, `NoteItem` 배지, 자동완성 등)은 이슈로 만들지 않는다.
- 스타일 작업은 `design-system` 스킬로 진행하고 디자인 토큰만 쓴다. 코드 주석과 UI 텍스트는 한국어.

## 의존 관계와 순서

```
TAG-1 ─┬─ TAG-2 (새 노트 저장)
       ├─ TAG-3 (삭제)
       ├─ TAG-4 (중복·빈 값 무시)
       ├─ TAG-5 (한글 IME)
       └─ TAG-6 (취소·재초기화)
                                  TAG-7 (CLAUDE.md 훅 규칙) ← TAG-1 이후 아무 때나
```

| ID    | 제목                                         | 스토리  | 의존  |
| ----- | -------------------------------------------- | ------- | ----- |
| TAG-1 | 기존 노트에 태그를 추가하고 저장한다         | US-1, 6 | -     |
| TAG-2 | 새 노트를 만들 때 태그를 함께 저장한다       | US-1, 4 | TAG-1 |
| TAG-3 | 잘못 붙인 태그를 삭제한다                    | US-3, 7 | TAG-1 |
| TAG-4 | 중복·빈 태그는 조용히 무시한다               | US-2    | TAG-1 |
| TAG-5 | 한글 태그를 한 번만 추가한다                 | US-5    | TAG-1 |
| TAG-6 | 취소하거나 노트를 바꾸면 태그 변경을 버린다  | US-4    | TAG-1 |
| TAG-7 | CLAUDE.md에 커스텀훅 규칙을 반영한다 (chore) | ADR-001 | TAG-1 |

---

## TAG-1. 기존 노트에 태그를 추가하고 저장한다

### 설명

노트 편집 화면에서 태그를 입력하고 Enter를 치면 칩이 생기고, 저장하면 서버에 반영되는 가장 얇은 end-to-end 흐름을 만든다. 이후 이슈가 올라탈 뼈대를 함께 세운다.

- `Note.tags: string[]` 추가(`src/types/note.ts`, "강의에서 추가할 것" 주석 제거)
- `useTags(initialTags)`(`src/hooks/useTags.ts`): `tags`, `addTag(raw)`, `resetTags(tags)` 제공. 이 이슈에서는 trim과 추가 순서 보존까지만 다룬다.
- `useTagInput(onAdd)`(`src/hooks/useTagInput.ts`): 입력 텍스트, `onChange`/`onKeyDown`, Enter 시 `preventDefault` + 추가 + 입력창 비우기.
- `TagInput`(`src/components/TagInput.tsx`): `tags`/`onAdd`/`onRemove` props, 칩 목록 + 입력창(`maxLength={15}`). 삭제 버튼은 TAG-3에서 만든다.
- `NoteEditor`에 연결: 선택 노트 변경 시 기존 `useEffect`에서 `resetTags(selectedNote.tags ?? [])`, `handleSave`가 `updateNote(id, { title, content, tags })`로 전송.
- `tags`가 없는 기존 노트(`db.json`)는 `[]`로 간주한다. `db.json`은 수정하지 않는다.

### 완료 조건 (Acceptance Criteria)

- [ ] 편집 화면에 태그 입력창과 칩 목록이 보인다.
- [ ] Enter로 태그가 추가되고 입력창이 비워지며, 추가한 순서대로 표시된다.
- [ ] 앞뒤 공백은 제거되어 칩에 표시·저장된다.
- [ ] 이미 태그가 있는 노트에 태그를 추가해도 기존 태그가 유지되고 새 태그가 맨 뒤에 붙는다.
- [ ] 입력창은 15자를 넘겨 입력할 수 없다.
- [ ] Enter가 폼 submit이나 저장을 일으키지 않는다.
- [ ] 저장 시 PATCH 본문에 `title`, `content`, `tags`가 포함된다.
- [ ] 저장 시 입력창에 남은 미확정 텍스트는 태그로 저장되지 않는다.
- [ ] `tags` 필드가 없는 기존 노트를 열어도 오류 없이 빈 태그로 표시된다.
- [ ] 저장 실패 시 `console.error`만 남기고 폼 상태(태그 포함)는 유지된다.
- [ ] `npm run build`(타입 체크), `npm run lint`, `npm test`가 통과한다.
- [ ] 스타일 검사 훅(`check_styles.py`)에서 신규 위반이 없다.

### 시나리오 (Given / When / Then)

**시나리오 1: Enter로 태그 추가**

- **Given** 태그가 없는 노트의 편집 화면이 열려 있고
- **When** 태그 입력창에 `React`를 입력하고 Enter를 치면
- **Then** `React` 칩이 생기고 입력창이 비워진다.

**시나리오 2: 추가 순서 유지와 공백 제거**

- **Given** 편집 화면이 열려 있고
- **When** `React`, `Vue`를 차례로 입력하고 각각 Enter를 치면
- **Then** 칩이 `React`, `Vue` 순서로 표시된다(앞뒤 공백 없음).

**시나리오 3: 기존 태그가 있는 노트에 태그 추가**

- **Given** 저장된 태그 `React` 하나가 있는 노트의 편집 화면이 열려 있고
- **When** 태그 입력창에 `Vue`를 입력하고 Enter를 치면
- **Then** `React` 칩은 그대로 유지되고 그 뒤에 `Vue` 칩이 추가되며, 저장하면 PATCH 본문의 `tags`는 `["React", "Vue"]`이다.

**시나리오 4: Enter가 저장을 일으키지 않음**

- **Given** 편집 화면의 태그 입력창에 포커스가 있고
- **When** `React`를 입력하고 Enter를 치면
- **Then** 폼이 제출되거나 노트가 저장되지 않고 태그만 추가된다.

**시나리오 5: 저장 시 PATCH에 tags 포함**

- **Given** 편집 화면에서 `React`, `Vue` 태그를 추가했고
- **When** 저장 버튼을 누르면
- **Then** `PATCH /notes/{id}` 본문에 `title`, `content`, `tags: ["React", "Vue"]`가 포함된다.

**시나리오 6: 미확정 입력은 저장하지 않음**

- **Given** 태그 `React`가 추가되어 있고 입력창에 `Vu`가 남아 있을 때
- **When** 저장 버튼을 누르면
- **Then** 저장된 `tags`는 `["React"]`뿐이다.

**시나리오 7: 기존 노트 호환**

- **Given** `db.json`에 `tags` 필드가 없는 노트가 있고
- **When** 그 노트를 선택해 편집 화면을 열면
- **Then** 오류 없이 빈 태그 목록(칩 없음)과 입력창이 표시된다.

**시나리오 8: 저장 실패**

- **Given** 태그를 추가했고 저장 요청이 실패하도록 모킹했을 때
- **When** 저장 버튼을 누르면
- **Then** `console.error`가 호출되고 추가한 태그가 화면에 그대로 남아 있다.

### 테스트 메모

- `useTags`, `useTagInput`은 `renderHook` + `act`로 단위 테스트한다.
- `NoteEditor` 컴포넌트 테스트에서 `fetch`(또는 `updateNote`)를 모킹해 PATCH 본문의 `tags`를 검증한다(훅 단위 테스트는 연결 오류를 잡지 못한다).

---

## TAG-2. 새 노트를 만들 때 태그를 함께 저장한다

### 설명

새 노트 모드에서도 태그를 붙여 저장할 수 있게 한다. 생성 경로(`api` → Context → `NoteEditor`)를 관통한다.

- `api/notes.ts`의 `createNote`가 `tags`를 선택 인자로 받고 기본값 `[]`를 채운다.
- Context `createNote(title, content, tags)`는 위치 인자를 이어 붙인다. `addTag`/`removeTag`는 Context에 만들지 않는다.
- `NoteEditor`의 `handleSave`가 생성 모드에서 `createNote(title, content, tags)`를 호출한다.
- 새 노트 모드 진입 시 `resetTags([])`로 비운다.

> `spec-fixed.md` 14행("호출자는 태그를 따로 넘기지 않는다")과 43행(`createNote(title, content, tags)`)이 어긋난다. ADR-001대로 43행을 따르고, API는 `tags`를 선택 인자로 받아 기본값 `[]`를 채운다.

### 완료 조건 (Acceptance Criteria)

- [ ] 새 노트 모드에서 태그를 추가하고 저장하면 POST 본문에 `tags`가 포함된다.
- [ ] 태그를 붙이지 않고 저장한 새 노트는 `tags: []`로 생성된다.
- [ ] 새 노트 모드로 진입하면 태그 입력창과 칩이 비어 있다(이전 편집 내용이 남지 않는다).
- [ ] 기존 `createNote(title, content)` 호출부가 깨지지 않는다(`tags` 선택 인자).
- [ ] `createdAt`/`updatedAt`은 기존처럼 API 함수에서 채운다.
- [ ] 빌드·린트·테스트가 통과한다.

### 시나리오 (Given / When / Then)

**시나리오 1: 태그와 함께 새 노트 생성**

- **Given** 새 노트 모드이고 제목 `첫 노트`를 입력했고
- **When** 태그 `React`를 추가하고 저장하면
- **Then** `POST /notes` 본문에 `tags: ["React"]`가 포함되고, 응답으로 받은 노트가 목록에 반영된다.

**시나리오 2: 태그 없이 생성**

- **Given** 새 노트 모드이고 제목만 입력했을 때
- **When** 저장하면
- **Then** `POST /notes` 본문의 `tags`는 `[]`이다.

**시나리오 3: 새 노트 모드 진입 시 초기화**

- **Given** 기존 노트 편집 중 태그 `React`가 표시되어 있고
- **When** 새 노트 버튼을 눌러 새 노트 모드로 전환하면
- **Then** 칩이 없고 입력창이 비어 있다.

---

## TAG-3. 잘못 붙인 태그를 삭제한다

### 설명

칩의 `X` 버튼으로 해당 태그만 삭제한다. 마우스와 키보드 모두 쓸 수 있어야 한다.

- `useTags`에 `removeTag(tag)` 추가.
- `TagInput` 칩에 `X` 버튼 추가. hover 또는 `focus-visible`에서만 보이고, `aria-label`은 `"{태그} 태그 삭제"`.
- 삭제는 로컬 폼 상태에만 반영된다(서버 요청 없음).

### 완료 조건 (Acceptance Criteria)

- [ ] 칩에 hover하면 `X`가 나타나고, 누르면 해당 태그만 제거된다.
- [ ] 키보드로 `X`에 focus(`focus-visible`)하면 `X`가 보이고 Enter/Space로 삭제할 수 있다.
- [ ] `X` 버튼의 `aria-label`이 `"{태그} 태그 삭제"` 형식이다.
- [ ] 삭제해도 남은 태그의 순서가 유지된다.
- [ ] 삭제 시 서버 요청이 발생하지 않고, 저장해야 반영된다.
- [ ] hover/focus 표시는 디자인 시스템 토큰만 사용한다(하드코딩 색·테두리·그림자 없음).
- [ ] 빌드·린트·테스트와 스타일 검사가 통과한다.

### 시나리오 (Given / When / Then)

**시나리오 1: 마우스로 삭제**

- **Given** 태그 `React`, `Vue`, `Node`가 표시되어 있고
- **When** `Vue` 칩에 hover해 `X`를 누르면
- **Then** `Vue`만 사라지고 `React`, `Node`가 순서대로 남는다.

**시나리오 2: 키보드로 삭제**

- **Given** 태그 `React`가 표시되어 있고
- **When** Tab으로 `React` 칩의 `X` 버튼에 포커스를 옮기면
- **Then** `X`가 화면에 보이고, `aria-label`은 `React 태그 삭제`이며, Enter를 누르면 `React`가 제거된다.

**시나리오 3: 삭제는 저장해야 반영**

- **Given** 저장된 태그 `React`가 있는 노트의 편집 화면에서 `React`를 삭제했고
- **When** 저장하기 전까지는
- **Then** 서버로 요청이 가지 않고, 저장하면 PATCH 본문의 `tags`에서 `React`가 빠진다.

---

## TAG-4. 중복·빈 태그는 조용히 무시한다

### 설명

정규화 규칙을 `useTags.addTag`에 구현한다. 중복 판정은 trim + 대소문자 무시, 저장 표기는 처음 입력한 값을 유지한다. 알림은 띄우지 않는다.

### 완료 조건 (Acceptance Criteria)

- [ ] 이미 있는 태그와 대소문자·앞뒤 공백만 다른 입력은 추가되지 않는다.
- [ ] 중복 입력 후에도 입력창은 비워진다.
- [ ] 저장되는 표기는 처음 입력한 값(공백만 제거)이다.
- [ ] 빈 문자열이나 공백만 있는 입력은 추가되지 않는다.
- [ ] 중복·빈 값에 `alert`, 토스트, 에러 문구를 표시하지 않는다.
- [ ] 쉼표는 일반 문자로 취급되어 `a,b`가 태그 하나로 추가된다.
- [ ] `useTags` 단위 테스트가 위 규칙을 모두 검증한다.
- [ ] 빌드·린트·테스트가 통과한다.

### 시나리오 (Given / When / Then)

**시나리오 1: 대소문자 중복**

- **Given** 태그 `React`가 추가되어 있고
- **When** `react`를 입력하고 Enter를 치면
- **Then** 칩은 `React` 하나뿐이고 입력창은 비워지며 알림은 뜨지 않는다.

**시나리오 2: 공백이 낀 중복**

- **Given** 태그 `React`가 추가되어 있고
- **When** `React`를 입력하고 Enter를 치면
- **Then** 추가되지 않고 입력창만 비워진다.

**시나리오 3: 표기 유지**

- **Given** `React`를 먼저 추가한 뒤 `REACT`를 입력해 Enter를 쳤고
- **When** 저장하면
- **Then** PATCH 본문의 `tags`는 `["React"]`이다.

**시나리오 4: 빈 값**

- **Given** 태그 입력창이 비어 있거나 공백 `   `만 있을 때
- **When** Enter를 치면
- **Then** 칩이 추가되지 않고 입력창은 비워진다.

**시나리오 5: 쉼표는 구분자가 아님**

- **Given** 편집 화면이 열려 있고
- **When** `a,b`를 입력하고 Enter를 치면
- **Then** `a,b` 칩 하나가 추가된다.

---

## TAG-5. 한글 태그를 한 번만 추가한다

### 설명

한글 IME 조합 중 Enter가 태그를 중복 추가하는 문제를 막는다. `useTagInput`의 `onKeyDown`에서 `e.nativeEvent.isComposing`이면 무시한다.

### 완료 조건 (Acceptance Criteria)

- [ ] IME 조합 중(`isComposing === true`) Enter는 태그 추가·입력창 비우기를 하지 않는다.
- [ ] 조합 확정 후 Enter에서 태그가 정확히 한 번만 추가된다.
- [ ] IME 조합 중 Enter에도 폼 submit이 발생하지 않는다.
- [ ] `useTagInput` 단위 테스트가 `isComposing: true/false` 두 경우를 검증한다.
- [ ] 빌드·린트·테스트가 통과한다.

### 시나리오 (Given / When / Then)

**시나리오 1: 조합 중 Enter 무시**

- **Given** 입력창에 한글 `리액`을 조합 중(`isComposing: true`)이고
- **When** Enter 키 이벤트가 발생하면
- **Then** 태그가 추가되지 않고 입력 텍스트도 유지된다.

**시나리오 2: 확정 후 한 번만 추가**

- **Given** 한글 `리액트` 입력을 마쳐 조합이 확정(`isComposing: false`)됐고
- **When** Enter를 치면
- **Then** `리액트` 칩이 정확히 한 개 생기고 입력창이 비워진다.

---

## TAG-6. 취소하거나 노트를 바꾸면 태그 변경을 버린다

### 설명

태그 추가/삭제는 저장 버튼을 눌러야만 반영되며, 취소하거나 다른 노트로 이동하면 변경이 폐기되는 것을 보장한다. 선택 노트 변경 시 `resetTags`가 올바르게 동작하는지 확인하고 필요한 보완을 한다.

### 완료 조건 (Acceptance Criteria)

- [ ] 태그를 추가·삭제한 뒤 취소하면 서버 요청 없이 변경이 버려진다.
- [ ] 취소 후 같은 노트를 다시 열면 저장된 원래 태그가 표시된다.
- [ ] 다른 노트를 선택하면 그 노트의 `tags`(없으면 `[]`)로 칩이 바뀐다.
- [ ] 이전 노트에서 입력창에 남기고 간 텍스트가 다음 노트에 남지 않는다.
- [ ] `NoteEditor` 컴포넌트 테스트가 취소 시 PATCH/POST가 호출되지 않음을 검증한다.
- [ ] 빌드·린트·테스트가 통과한다.

### 시나리오 (Given / When / Then)

**시나리오 1: 취소하면 추가가 버려짐**

- **Given** 저장된 태그가 `React`인 노트의 편집 화면에서 `Vue`를 추가했고
- **When** 취소 버튼을 누르면
- **Then** 서버 요청이 없고, 그 노트를 다시 열면 `React`만 표시된다.

**시나리오 2: 취소하면 삭제가 버려짐**

- **Given** 저장된 태그 `React`를 편집 화면에서 삭제했고
- **When** 취소 버튼을 누른 뒤 다시 그 노트를 열면
- **Then** `React` 칩이 그대로 있다.

**시나리오 3: 노트 전환 시 재초기화**

- **Given** 노트 A(`tags: ["React"]`) 편집 중이고 노트 B는 `tags` 필드가 없을 때
- **When** 사이드바에서 노트 B를 선택하면
- **Then** 칩 없이 빈 태그 목록이 표시되고 입력창도 비어 있다.

---

## TAG-7. CLAUDE.md에 커스텀훅 규칙을 반영한다 (chore)

### 설명

ADR-001로 프로젝트에 처음 `src/hooks/`와 커스텀훅이 생기므로, 문서가 코드와 어긋나지 않도록 `CLAUDE.md`를 갱신한다. 사용자 가시 동작이 없는 문서 작업이라 수직 슬라이스가 아니며, TAG-1 머지 후 별도로 처리한다.

### 완료 조건 (Acceptance Criteria)

- [ ] 아키텍처 섹션에 `src/hooks/`(`useTags`, `useTagInput`)와 `TagInput` 컴포넌트가 설명된다.
- [ ] 컨벤션에 훅 규칙이 추가된다: 파일명 `useXxx.ts`(camelCase), named export, 순수 폼 상태 훅은 서버·Context를 모른다, `useCallback`/`useMemo`를 쓰지 않는다, `useReducer`는 쓰지 않는다.
- [ ] 상태 관리 섹션이 "`tags`는 훅, `title`/`content`/`saving`은 `NoteEditor`의 `useState`"라는 현재 상태를 반영한다.
- [ ] "컴포넌트는 `useNotes()`로만 데이터에 접근한다" 규칙과 훅 도입이 충돌하지 않게 문구가 정리된다.
- [ ] "`src/types/note.ts`의 `tags`는 강의에서 추가할 것" 설명이 현재 상태에 맞게 수정된다.
- [ ] 커밋 규칙(`docs:` 타입, 본문 2줄 이상)을 지킨다.

### 시나리오 (Given / When / Then)

**시나리오 1: 문서와 코드 일치**

- **Given** TAG-1이 머지되어 `src/hooks/`가 존재하고
- **When** `CLAUDE.md`의 아키텍처·컨벤션 섹션을 읽으면
- **Then** 훅 디렉터리, 훅 네이밍·작성 규칙, `TagInput`의 역할이 실제 코드와 일치한다.
