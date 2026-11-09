# TAG-3. 잘못 붙인 태그를 삭제한다 — 시그니처와 테스트 시나리오

> 상태: 완료
> 근거: GitHub 이슈 #3, [`prd.md`](./prd.md)

## 시그니처

### 타입

변경 없음. `Note.tags?: string[]`(TAG-1)을 그대로 쓴다.

### 함수 · 훅

```ts
// src/hooks/useTags.ts — removeTag 추가 (기존 addTag, resetTags는 그대로)
export function useTags(initialTags: string[]): {
  tags: string[];
  addTag: (raw: string) => void;
  removeTag: (tag: string) => void; // 추가: tags에서 tag와 같은 값을 제거, 나머지 순서 유지
  resetTags: (tags: string[]) => void;
};
```

기존 시그니처 변경:

| 대상                           | 변경 전                       | 변경 후                                                                  |
| ------------------------------ | ----------------------------- | ------------------------------------------------------------------------ |
| `useTags` 반환값               | `{ tags, addTag, resetTags }` | `{ tags, addTag, removeTag, resetTags }`                                 |
| `NoteEditor`의 `TagInput` 연결 | `onRemove` 미연결(또는 no-op) | `onRemove={removeTag}`                                                   |
| `TagInput` 칩 렌더             | 텍스트만 있는 `<span>`        | 텍스트 + `X` `<button type="button">` (hover/`focus-visible`에서만 표시) |

### 컴포넌트 Props

```ts
// src/components/TagInput.tsx — 변경 없음 (onRemove는 TAG-1에서 이미 선언됨)
interface TagInputProps {
  tags: string[];
  onAdd: (raw: string) => void;
  onRemove: (tag: string) => void; // 이 이슈에서 처음 호출한다: X 버튼 클릭/Enter/Space 시 onRemove(tag)
}
```

`X` 버튼 규격: `type="button"`(폼 submit 방지), `aria-label={`${tag} 태그 삭제`}`, 표시 제어는 Tailwind `group-hover`/`focus-visible` 시맨틱 토큰 클래스만 사용(하드코딩 색·테두리·그림자 없음).

### 에러 케이스

| 대상                    | 상황                           | 동작                                                                 |
| ----------------------- | ------------------------------ | -------------------------------------------------------------------- |
| `useTags.removeTag`     | `tags`에 없는 값을 전달        | 아무 변화 없음, 오류 없음                                            |
| `useTags.removeTag`     | 마지막 남은 태그를 제거        | `tags`가 `[]`가 됨                                                   |
| `TagInput` X 버튼       | 폼 안에서 클릭 / Enter / Space | `onRemove(tag)`만 호출, 폼 submit·저장 호출 없음 (`type="button"`)   |
| `NoteEditor`            | 태그 삭제                      | 로컬 폼 상태만 변경, `updateNote` 미호출(서버 요청 없음)             |
| `NoteEditor.handleSave` | 삭제 후 저장                   | `updateNote(id, { title, content, tags })`에 삭제 반영된 `tags` 전달 |
| `NoteEditor.handleSave` | `updateNote` 실패              | TAG-1 정책 그대로(`console.error`만, 폼 상태 유지)                   |

### 미결 사항

없음. 개발자 확정 사항:

1. `removeTag(tag)`는 값이 같은 항목을 전부 제거한다(`filter`).
2. X 버튼은 DOM 존재와 접근 가능한 이름(`aria-label`)까지만 검증한다. CSS 클래스 문자열(`group-hover:`/`focus-visible:`)은 테스트에서 검사하지 않고, 표시 여부는 수동 확인과 스타일 검사 훅으로 대체한다.

## 테스트 시나리오

### useTags

1. [정상] removeTag – should 지정한 태그만 제거하고 나머지 순서를 유지한다 when tags가 ['React','Vue','Node']이고 'Vue'를 전달한다
2. [경계] removeTag – should tags를 빈 배열로 만든다 when 마지막 남은 태그를 제거한다
3. [경계] removeTag – should 값이 같은 항목을 모두 제거한다 when tags에 같은 값이 둘 이상 있다
4. [경계] removeTag – should 대소문자가 다른 태그는 제거하지 않는다 when 'react'를 전달했는데 tags에는 'React'만 있다
5. [예외] removeTag – should 아무 변화도 오류도 없다 when tags에 없는 값을 전달한다
6. [정상] removeTag – should 이후 addTag로 추가한 태그가 정상 반영된다 when 삭제 후 새 태그를 추가한다

### TagInput

7. [정상] TagInput – should 태그마다 X 버튼을 렌더링한다 when tags가 여러 개다
8. [정상] TagInput – should X 버튼의 접근 가능한 이름이 '{태그} 태그 삭제'이다 when tags에 'React'가 있다
9. [정상] TagInput – should onRemove를 해당 태그 값으로 한 번 호출한다 when 'Vue' 칩의 X 버튼을 클릭한다
10. [정상] TagInput – should onRemove를 호출한다 when X 버튼에 포커스를 두고 Enter를 누른다
11. [정상] TagInput – should onRemove를 호출한다 when X 버튼에 포커스를 두고 Space를 누른다
12. [정상] TagInput – should Tab 이동으로 X 버튼에 포커스가 닿는다 when 키보드로 칩 영역을 탐색한다
13. [경계] TagInput – should X 버튼을 렌더링하지 않는다 when tags가 빈 배열이다
14. [경계] TagInput – should 한글·공백 포함 태그도 '{태그} 태그 삭제' 이름의 버튼을 제공한다 when 태그가 '리액트 훅'이다
15. [예외] TagInput – should 폼 submit이 발생하지 않는다 when 폼 안에서 X 버튼을 클릭한다
16. [예외] TagInput – should onAdd를 호출하지 않는다 when X 버튼을 클릭한다

### NoteEditor

17. [정상] NoteEditor – should 해당 태그 칩만 사라지고 남은 태그 순서가 유지된다 when 태그 3개가 있는 노트에서 가운데 태그의 X를 클릭한다
18. [정상] NoteEditor – should 삭제된 태그가 빠진 tags로 updateNote(id, { title, content, tags })를 호출한다 when 태그를 삭제한 뒤 저장한다
19. [정상] NoteEditor – should 키보드(Tab, Enter)로 태그를 삭제할 수 있다 when X 버튼에 포커스를 옮겨 Enter를 누른다
20. [경계] NoteEditor – should updateNote와 서버 요청을 호출하지 않는다 when 태그를 삭제하고 아직 저장하지 않았다
21. [경계] NoteEditor – should tags가 빈 배열인 채로 updateNote를 호출한다 when 모든 태그를 삭제한 뒤 저장한다
22. [경계] NoteEditor – should 저장되지 않고 폼 상태만 변한다 when X 버튼을 클릭한다 (title, content 입력값 유지)
23. [예외] NoteEditor – should console.error만 남기고 삭제된 폼 상태를 유지한다 when 태그 삭제 후 저장했는데 updateNote가 실패한다

## AC 커버리지

| AC 항목                                                        | 시나리오 번호                                                                                                  |
| -------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------- |
| 칩에 hover하면 X가 나타나고, 누르면 해당 태그만 제거된다       | 1, 3, 7, 9, 17 (hover 시 표시 자체는 CSS라 jsdom 검증 불가, 미결 2에 따라 수동 확인과 스타일 검사 훅으로 대체) |
| 키보드로 X에 focus하면 X가 보이고 Enter/Space로 삭제할 수 있다 | 10, 11, 12, 19 (focus 시 표시 자체는 수동 확인)                                                                |
| X 버튼의 aria-label이 "{태그} 태그 삭제" 형식이다              | 8, 14                                                                                                          |
| 삭제해도 남은 태그의 순서가 유지된다                           | 1, 17                                                                                                          |
| 삭제 시 서버 요청이 발생하지 않고, 저장해야 반영된다           | 20, 22, 18, 21                                                                                                 |
| hover/focus 표시는 디자인 시스템 토큰만 사용한다               | 자동 검사 (CSS 클래스 문자열은 테스트하지 않기로 확정, check_styles.py 훅이 검증)                              |
| 빌드·린트·테스트와 스타일 검사가 통과한다                      | 자동 검사 (npm run build, npm run lint, npm test, check_styles.py)                                             |

확인 결과: 모든 AC가 최소 1개 시나리오 또는 "자동 검사"로 덮였다. 추가 방어 시나리오(폼 submit 방지 15, onAdd 비호출 16, 저장 실패 23)는 에러 케이스 표에서 도출했다.
