# TAG-1. 기존 노트에 태그를 추가하고 저장한다 — 시그니처와 테스트 시나리오

> 상태: 완료
> 근거: GitHub 이슈 #1, [`prd.md`](./prd.md)

## 시그니처

### 타입

```ts
// src/types/note.ts — 변경 전/후
// 전: (tags 필드 없음, "강의에서 추가할 것" 주석)
// 후:
export interface Note {
  id: string;
  title: string;
  content: string;
  createdAt: string;
  updatedAt: string;
  tags?: string[]; // 확정(미결 1-a): 선택 필드. 서버 데이터에는 없을 수 있어 읽을 때 `?? []`로 간주한다
}
```

### 함수 · 훅

```ts
// src/hooks/useTags.ts — 순수 폼 상태 훅. 서버·Context를 모른다.
export function useTags(initialTags: string[]): {
  tags: string[];
  addTag: (raw: string) => void; // 앞뒤 공백 제거 후 맨 뒤에 추가
  resetTags: (tags: string[]) => void; // 상태를 전달받은 배열로 교체
};

// src/hooks/useTagInput.ts
export function useTagInput(onAdd: (raw: string) => void): {
  text: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void; // Enter: preventDefault + onAdd(text) + text 비우기
};
```

기존 시그니처 변경 (`NoteEditor.handleSave`의 내부 호출만 바뀜. API·Context 시그니처는 그대로):

| 대상                            | 변경 전                                          | 변경 후                                                                                   |
| ------------------------------- | ------------------------------------------------ | ----------------------------------------------------------------------------------------- |
| `updateNote` 호출(편집 모드)    | `updateNote(selectedNoteId, { title, content })` | `updateNote(selectedNoteId, { title, content, tags })`                                    |
| `NoteEditor` 동기화 `useEffect` | `setTitle`, `setContent`만 호출                  | 선택 노트가 있으면 `resetTags(selectedNote.tags ?? [])`, 생성 모드면 `resetTags([])` 추가 |

### 컴포넌트 Props

```ts
// src/components/TagInput.tsx
interface TagInputProps {
  tags: string[];
  onAdd: (raw: string) => void;
  onRemove: (tag: string) => void; // 삭제 UI는 TAG-3. 이 이슈에서는 받기만 하고 호출하지 않는다
}
// 렌더: 칩 목록 + <input maxLength={15}>. 내부에서 useTagInput(onAdd)을 합성한다.
```

`NoteEditor`의 `NoteEditorProps`는 변경 없음.

### 에러 케이스

| 대상                    | 상황                                  | 동작                                                                                         |
| ----------------------- | ------------------------------------- | -------------------------------------------------------------------------------------------- |
| `useTags.addTag`        | 앞뒤 공백이 있는 입력                 | 공백을 제거한 값을 추가 (빈 값·중복 처리는 TAG-4)                                            |
| `useTagInput.onKeyDown` | Enter가 아닌 키                       | 아무것도 하지 않음 (`onAdd` 미호출, `preventDefault` 미호출)                                 |
| `TagInput` 입력창       | 15자 초과 입력                        | `maxLength={15}`로 브라우저가 입력을 막음                                                    |
| `NoteEditor` 읽기       | 선택 노트에 `tags` 필드 없음          | `[]`로 간주, 오류 없음                                                                       |
| `NoteEditor.handleSave` | 입력창에 미확정 텍스트가 남은 채 저장 | 텍스트는 버리고 `tags` 상태만 저장                                                           |
| `NoteEditor.handleSave` | `updateNote` 실패(throw)              | `console.error('Failed to save note:', e)`만 남김, `tags` 포함 폼 상태 유지, `onDone` 미호출 |
| `api.updateNote`        | `!res.ok`                             | 기존대로 `Error('Failed to update note')` throw                                              |

### 미결 사항

모두 확정됨(승인).

1. `Note.tags`는 (a) `tags?: string[]` 선택 필드로 확정. `api.createNote`의 `Omit` 시그니처와 `NotesContext.createNote` 호출은 변경하지 않는다.
2. `TagInput`의 `onRemove`는 필수 prop으로 선언하고 TAG-1에서는 호출하지 않는다(기본안).
3. `addTag('')`·공백만 입력·중복은 TAG-4 범위로, TAG-1 시나리오에서 제외한다(기본안).
4. `useTagInput.onKeyDown`은 `text` 그대로 `onAdd`에 넘기고 trim은 `useTags.addTag`가 맡는다(기본안).

## 테스트 시나리오

1. [정상] useTags – should 초기 태그 배열을 `tags`로 노출한다 when `initialTags`가 `['React']`로 주어진다
2. [정상] useTags.addTag – should 태그를 배열 맨 뒤에 추가한다 when 기존 태그 `React`가 있고 `Vue`를 추가한다
3. [정상] useTags.addTag – should 추가한 순서대로 유지한다 when `React`, `Vue`를 차례로 추가한다
4. [정상] useTags.addTag – should 앞뒤 공백을 제거한 값을 추가한다 when `' React '`를 추가한다
5. [정상] useTags.resetTags – should 상태를 전달받은 배열로 교체한다 when `resetTags(['Vue'])`를 호출한다
6. [경계] useTags – should 빈 배열로 시작한다 when `initialTags`가 `[]`이다
7. [경계] useTags.resetTags – should 태그를 비운다 when `resetTags([])`를 호출한다
8. [정상] useTagInput.onChange – should `text`를 입력값으로 갱신한다 when 입력창에 `React`를 입력한다
9. [정상] useTagInput.onKeyDown – should `onAdd`를 입력 텍스트로 호출하고 `text`를 비운다 when Enter를 누른다
10. [정상] useTagInput.onKeyDown – should `preventDefault`를 호출한다 when Enter를 누른다
11. [예외] useTagInput.onKeyDown – should `onAdd`와 `preventDefault`를 호출하지 않는다 when Enter가 아닌 키를 누른다
12. [경계] useTagInput.onKeyDown – should 앞뒤 공백이 포함된 텍스트 그대로 `onAdd`에 전달한다 when `' React '`를 입력하고 Enter를 누른다
13. [정상] TagInput – should 태그 입력창과 전달받은 `tags`의 칩 목록을 렌더링한다 when `tags`가 `['React', 'Vue']`이다
14. [경계] TagInput – should 칩 없이 입력창만 렌더링한다 when `tags`가 `[]`이다
15. [경계] TagInput – should 칩을 `tags` 배열 순서대로 표시한다 when `tags`가 `['React', 'Vue']`이다
16. [경계] TagInput – should 입력창에 `maxLength` 15를 설정한다 when 렌더링된다
17. [정상] TagInput – should `onAdd`를 입력값으로 호출하고 입력창을 비운다 when 입력창에 `React`를 입력하고 Enter를 누른다
18. [정상] TagInput – should 폼 submit을 일으키지 않는다 when 폼 안에서 Enter를 누른다
19. [정상] NoteEditor – should 선택 노트의 `tags`를 칩으로 표시한다 when `tags: ['React']`인 노트를 선택한다
20. [경계] NoteEditor – should 오류 없이 빈 태그로 표시한다 when `tags` 필드가 없는 기존 노트를 선택한다
21. [정상] NoteEditor – should 기존 칩을 유지하고 새 태그를 맨 뒤에 붙인다 when `tags: ['React']`인 노트에서 `Vue`를 입력하고 Enter를 누른다
22. [정상] NoteEditor – should 태그 칩과 입력창이 보인다 when 편집 화면을 연다
23. [정상] NoteEditor.handleSave – should `updateNote(id, { title, content, tags })`로 호출한다 when `React`, `Vue` 태그를 추가하고 저장한다
24. [정상] NoteEditor.handleSave – should 공백이 제거된 태그를 전달한다 when `' React '`를 추가하고 저장한다
25. [경계] NoteEditor.handleSave – should 미확정 텍스트를 제외하고 `tags` 상태만 전달한다 when 태그 `React`가 있고 입력창에 `Vu`가 남은 채 저장한다
26. [경계] NoteEditor.handleSave – should `tags: []`를 전달한다 when `tags`가 없는 기존 노트를 태그 추가 없이 저장한다
27. [정상] NoteEditor – should Enter로 저장이 호출되지 않는다 when 태그 입력창에서 Enter를 누른다
28. [정상] NoteEditor.handleSave – should `onDone`을 호출한다 when `updateNote`가 성공한다
29. [예외] NoteEditor.handleSave – should `console.error('Failed to save note:', e)`만 남기고 `onDone`을 호출하지 않는다 when `updateNote`가 throw한다
30. [예외] NoteEditor.handleSave – should 태그를 포함한 폼 상태를 유지한다 when `updateNote`가 throw한다
31. [경계] NoteEditor – should 이전 노트의 태그를 지우고 새 노트의 `tags`로 교체한다 when 다른 노트를 선택한다
32. [경계] NoteEditor – should 태그를 비운다 when 생성 모드로 전환한다
33. [예외] api.updateNote – should `Error('Failed to update note')`를 throw한다 when 응답이 `!res.ok`이다
34. [정상] api.updateNote – should PATCH 본문에 `title`, `content`, `tags`를 포함한다 when `tags`를 넘겨 호출한다

## AC 커버리지

| AC 항목                                                                               | 시나리오 번호                                                                 |
| ------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------- |
| 편집 화면에 태그 입력창과 칩 목록이 보인다                                            | 13, 14, 22                                                                    |
| Enter로 태그가 추가되고 입력창이 비워지며, 추가한 순서대로 표시된다                   | 3, 9, 15, 17                                                                  |
| 앞뒤 공백은 제거되어 칩에 표시·저장된다                                               | 4, 12, 24                                                                     |
| 이미 태그가 있는 노트에 태그를 추가해도 기존 태그가 유지되고 새 태그가 맨 뒤에 붙는다 | 2, 21                                                                         |
| 입력창은 15자를 넘겨 입력할 수 없다                                                   | 16                                                                            |
| Enter가 폼 submit이나 저장을 일으키지 않는다                                          | 10, 11, 18, 27                                                                |
| 저장 시 PATCH 본문에 `title`, `content`, `tags`가 포함된다                            | 23, 34                                                                        |
| 저장 시 입력창에 남은 미확정 텍스트는 태그로 저장되지 않는다                          | 25                                                                            |
| `tags` 필드가 없는 기존 노트를 열어도 오류 없이 빈 태그로 표시된다                    | 20, 26                                                                        |
| 저장 실패 시 `console.error`만 남기고 폼 상태(태그 포함)는 유지된다                   | 29, 30, 33                                                                    |
| `npm run build`(타입 체크), `npm run lint`, `npm test`가 통과한다                     | 자동 검사 (빌드·린트·테스트 실행 결과이며 개별 시나리오로 검증할 대상이 아님) |
| 스타일 검사 훅(`check_styles.py`)에서 신규 위반이 없다                                | 자동 검사 (PostToolUse 훅이 검증)                                             |

모든 AC가 최소 1개 시나리오 또는 "자동 검사"로 덮였음을 확인했다. 참고: 15자 초과 입력 차단은 브라우저 동작이라 시나리오 16은 `maxLength` 속성 존재로 검증한다. 시나리오 5·31·32는 동기화 `useEffect`(`resetTags`) 변경을 검증한다.
