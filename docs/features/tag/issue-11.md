# TAG-11. 저장한 태그가 노트를 다시 불러올 때 노출되지 않음 (fix) — 시그니처와 테스트 시나리오

> 상태: 완료
> 근거: GitHub 이슈 #11, [`prd.md`](./prd.md)

## 시그니처

### 타입

변경 없음. `Note.tags?: string[]`(TAG-1)와 `api.createNote`의 `Omit<Note, 'id' | 'createdAt' | 'updatedAt'>` 파라미터(이미 `tags?` 포함)를 그대로 쓴다.

### 함수 · 훅

```ts
// src/context/NotesContext.tsx — createNote에 tags 추가
createNote: (title: string, content: string, tags?: string[]) => Promise<void>;
```

| 대상                                         | 변경 전                                             | 변경 후                                                              |
| -------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------- |
| `NotesContextType.createNote`                | `(title: string, content: string) => Promise<void>` | `(title: string, content: string, tags?: string[]) => Promise<void>` |
| `NotesProvider.createNote` 내부 호출         | `api.createNote({ title, content })`                | `api.createNote({ title, content, tags })`                           |
| `NoteEditor.handleSave` 생성 분기            | `createNote(title, content)`                        | `createNote(title, content, tags)`                                   |
| `src/api/notes.ts` `createNote`/`updateNote` | 변경 없음 (`...note` / `...updates` 그대로 직렬화)  | 변경 없음 (회귀 테스트로 본문에 `tags` 포함을 고정)                  |

### 컴포넌트 Props

변경 없음 (`NoteEditorProps` 그대로).

### 에러 케이스

| 대상                       | 상황                           | 동작                                               |
| -------------------------- | ------------------------------ | -------------------------------------------------- |
| `NotesProvider.createNote` | `tags`를 생략하고 호출         | `tags` 키 없이 기존처럼 동작 (하위 호환)           |
| `NoteEditor.handleSave`    | 태그 없이 신규 저장            | `createNote(title, content, [])` — 빈 배열 전달    |
| `api.createNote`           | `!res.ok`                      | 기존 정책 그대로 (`Failed to create note` throw)   |
| `NoteEditor.handleSave`    | `createNote`/`updateNote` 실패 | 기존 정책 그대로 (`console.error`만, 폼 상태 유지) |

### 미결 사항

없음. 개발자 확정 사항:

1. `createNote`의 세 번째 인자는 위치 인자 `tags?: string[]`로 추가한다.
2. 수정 경로(`updateNote`)는 코드 변경 없이 회귀 테스트로만 고정한다. 테스트가 실패하면 원인을 따로 보고한다.
3. 폼 재동기화(`useEffect` 의존성)는 이 이슈 범위 밖이다.

## 테스트 시나리오

1. [정상] api.createNote – should POST 본문에 tags를 포함해 전송한다 when tags가 있는 노트를 전달할 때
2. [경계] api.createNote – should 본문에 tags 키를 넣지 않는다 when tags 없이 호출할 때
3. [경계] api.createNote – should tags를 빈 배열 그대로 전송한다 when tags가 []일 때
4. [예외] api.createNote – should 'Failed to create note' 에러를 throw한다 when 응답이 !res.ok일 때
5. [정상] NotesProvider.createNote – should api.createNote에 { title, content, tags }를 전달한다 when 세 번째 인자로 tags를 넘길 때
6. [정상] NotesProvider.createNote – should 서버 응답(tags 포함) 노트를 notes 상태에 추가한다 when 생성에 성공할 때
7. [경계] NotesProvider.createNote – should 기존처럼 동작한다 when tags 인자를 생략할 때
8. [예외] NotesProvider.createNote – should notes 상태를 바꾸지 않고 에러를 호출자에게 전파한다 when api.createNote가 실패할 때
9. [정상] NoteEditor – should createNote(title, content, tags)를 호출한다 when 생성 모드에서 태그를 추가하고 저장을 누를 때
10. [경계] NoteEditor – should 태그 추가 순서대로 tags를 전달한다 when 태그를 여러 개 추가하고 저장할 때
11. [경계] NoteEditor – should createNote(title, content, [])를 호출한다 when 태그 없이 저장할 때
12. [예외] NoteEditor – should console.error만 남기고 제목·내용·태그 입력을 유지한다 when createNote가 실패할 때
13. [정상] NoteEditor – should updateNote(id, { title, content, tags })에 추가된 태그를 전달한다 when 수정 모드에서 태그를 추가하고 저장할 때
14. [정상] NoteEditor – should updateNote에 삭제가 반영된 tags를 전달한다 when 수정 모드에서 태그를 삭제하고 저장할 때
15. [경계] NoteEditor – should 저장된 태그가 편집기에 표시된다 when 저장 후 같은 노트를 다시 선택할 때
16. [경계] NoteEditor – should 태그 칩 없이 렌더한다 when 기존 노트에 tags 필드가 없을 때
17. [예외] NoteEditor – should console.error만 남기고 태그 상태를 유지한다 when updateNote가 실패할 때

## AC 커버리지

| AC 항목                                                                      | 시나리오 번호                                               |
| ---------------------------------------------------------------------------- | ----------------------------------------------------------- |
| 신규 노트에 태그를 추가해 저장하면 POST 본문과 `db.json`에 `tags`가 포함된다 | 1, 3, 5, 6, 9, 10, 11                                       |
| 기존 노트에 태그를 추가/삭제해 저장하면 재선택 시 변경이 반영되어 있다       | 13, 14, 15, 16                                              |
| 위 두 경우 모두 회귀 테스트가 있다                                           | 1–17 (Vitest 전체)                                          |
| (자동 검사) `db.json` 실제 저장 · 브라우저 재선택 흐름                       | E2E (`e2e/tag.spec.ts`), 단위 테스트는 네트워크 목으로 대체 |

시나리오 2, 4, 7, 8, 12, 17은 하위 호환과 에러 정책 유지를 확인하는 보조 시나리오다.
모든 AC가 최소 1개 시나리오 또는 자동 검사로 덮였음을 확인했다.
