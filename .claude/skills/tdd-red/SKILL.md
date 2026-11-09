---
name: tdd-red
description: 승인된 테스트 시나리오(docs/features/tag/issue-{N}.md)를 읽어 실패하는 테스트 코드(Vitest + React Testing Library)로 작성하는 TDD Red 단계 스킬. 입력은 이슈 번호. 사용자가 "/tdd-red 1", "이슈 N 테스트 코드 작성", "TDD Red", "실패하는 테스트 먼저", "시나리오를 테스트로", "테스트 코드 짜줘"처럼 말하거나, /test-scenarios 완료 뒤 구현 전에 테스트를 쓰려 하면 스킬 이름을 부르지 않아도 반드시 이 스킬을 사용한다. 테스트 파일만 만들고 src/의 구현 코드는 절대 수정하지 않는다.
argument-hint: <이슈 번호>
---

# tdd-red

`/test-scenarios`로 승인된 시나리오를 **실패하는 테스트 코드**로 옮긴다. TDD의 Red 단계다.

구현보다 테스트를 먼저 쓰고 "실패하는 것"을 눈으로 확인하는 이유: 구현이 없는데 통과하는 테스트는 아무것도 검증하지 않는 테스트이기 때문이다. 그래서 이 스킬은 테스트 파일만 만들고, 구현 코드는 다음 단계(Green)에서 쓴다.

## 입력

`$ARGUMENTS` = 이슈 번호 `N`. 없으면 사용자에게 번호를 묻는다.

## 제약

- **생성·수정 가능: 테스트 파일(`*.test.ts`, `*.test.tsx`)뿐.**
- `src/`의 구현 코드(컴포넌트, 훅, api, context, types)는 절대 수정하지 않는다. 타입이 없어서 테스트가 컴파일되지 않아도 마찬가지다. 그게 Red의 정상 상태다.
- 구현이 없다고 빈 스텁 파일을 만들어 import를 통과시키지 않는다. 스텁은 구현 코드이고, "모듈 없음"으로 실패하는 것도 유효한 Red다.
- 패키지를 새로 설치하지 않는다. `package.json`에 있는 것만 쓴다(`@testing-library/user-event`가 없으면 `fireEvent`).
- 커밋하지 않는다. 사용자가 요청할 때만 한다.

## 실행 순서

### 1. 시나리오 읽기

`docs/features/tag/issue-{N}.md`를 읽는다.

- 파일이 없으면 중단하고 `/test-scenarios N`을 먼저 실행하라고 안내한다.
- 맨 위 `상태:`가 `완료`가 아니면(승인 전이면) 중단하고 알린다. 승인되지 않은 시나리오로 테스트를 쓰면 나중에 다시 써야 한다.
- 읽을 곳: `## 시그니처`(함수·훅·Props·에러 케이스·변경 전/후)와 `## 테스트 시나리오`(`[분류] 함수명 – should … when …` 목록).
- 시나리오의 `함수명`과 시그니처로 **테스트 대상 파일**을 정한다(예: `useTags` → `src/tags/useTags.ts`).
- 기존 코드(`src/notes/NoteEditor.tsx`, `src/notes/NotesContext.tsx`, `src/notes/notes.ts` 등)와 `package.json`을 훑어 mock 지점과 사용 가능한 라이브러리를 확인한다.

### 2. 테스트 파일 배치

대상 파일과 **같은 디렉토리**에 `{파일명}.test.ts` / `{파일명}.test.tsx`로 둔다.

| 대상                    | 테스트 파일                  |
| ----------------------- | ---------------------------- |
| `src/notes/notes.ts`    | `src/notes/notes.test.ts`    |
| `src/tags/TagInput.tsx` | `src/tags/TagInput.test.tsx` |
| `src/tags/useTags.ts`   | `src/tags/useTags.test.ts`   |

훅은 `renderHook`을 쓰더라도 JSX가 없으면 `.ts`, 있으면 `.tsx`. 이미 테스트 파일이 있으면 덮어쓰지 말고 읽은 뒤 없는 시나리오만 추가한다.

### 3. 시나리오를 하나씩 작성 → 실행 → 실패 확인

문서의 시나리오 **순서대로 하나씩** 진행한다. 한꺼번에 쓰고 마지막에 돌리면 어느 테스트가 왜 실패하는지 흐려진다.

각 시나리오마다:

1. `it` 하나를 추가한다.
2. 해당 파일만 실행한다: `npx vitest run src/path/to/file.test.tsx -t "테스트 이름"`
3. **실패하는지 확인한다.** 이유까지 본다.
   - 유효한 Red: 대상 모듈이 없음(import 실패), 함수·prop이 없음, expect 불일치.
   - 무효: 테스트 코드 자체의 오타·문법 오류·잘못된 mock. 이 경우 테스트를 고친다.
   - **통과해버리면**: 구현이 이미 있거나 테스트가 아무것도 검증하지 않는 것이다. 원인을 확인하고, 이미 구현된 동작이면 사용자에게 알린다(구현을 건드리지 않는다).
4. 다음 시나리오로 넘어간다.

### 4. 전체 확인

모든 시나리오를 쓴 뒤 `npm test`를 실행해 **새 테스트가 모두 실패**하는지 확인한다. 기존에 통과하던 테스트가 있다면 그것이 깨지지 않았는지도 함께 본다(이 스킬은 구현을 건드리지 않으므로 깨지면 안 된다).

### 5. 보고

- 만든 테스트 파일 목록과 시나리오 수 (시나리오 번호 ↔ 테스트 매핑이 한눈에 보이게)
- `npm test` 결과 요약(실패 N / 통과 0, 대표 실패 이유)
- 통과해버린 테스트나 시나리오로 옮기기 애매했던 항목
- 다음 단계: 구현(Green)

## 테스트 작성 규칙

### 이름

`it('should [기대 동작] when [조건]', ...)` — 시나리오의 `should … when …`을 그대로 쓴다. 분류 태그(`[정상]` 등)와 번호는 이름에 넣지 않는다. 필요하면 번호는 주석으로 남긴다.

### describe

함수/컴포넌트 단위로 묶는다. 시나리오의 `useTags.addTag`처럼 `대상.메서드`면 바깥 `describe('useTags')` 안에 `describe('addTag')`를 중첩한다.

```ts
describe('useTags', () => {
  describe('addTag', () => {
    it('should 앞뒤 공백을 제거한 값을 추가한다 when " React "를 추가한다', () => {
      // ...
    });
  });
});
```

한 `it`은 한 시나리오만 다룬다. 한 `it`에 여러 시나리오를 합치면 실패 원인을 추적할 수 없다.

### 도구

- Vitest + React Testing Library. `globals: true`라서 `describe/it/expect/vi`는 import하지 않는다. `render`, `screen`, `renderHook`, `act` 등은 `@testing-library/react`에서 import한다. `jest-dom` 매처는 setup에서 이미 로드된다.
- 훅은 `renderHook`, 컴포넌트는 `render` + `screen`의 접근성 쿼리(`getByRole`, `getByPlaceholderText` 등)로 검증한다. 구현 세부(클래스명, 내부 상태)가 아니라 사용자에게 보이는 동작을 검증해야 구현이 바뀌어도 테스트가 깨지지 않는다.
- API 함수는 `vi.stubGlobal('fetch', vi.fn())`로 `fetch`를 mock하고, 테스트 뒤에 `vi.unstubAllGlobals()`로 복원한다.
- 컴포넌트가 `useNotes()`를 쓰면 `vi.mock(...)`으로 `NotesContext`를 mock한다(같은 `src/notes/` 안이면 `'./NotesContext'`, 다른 도메인이면 `'../notes/NotesContext'`)(컴포넌트는 `api/`를 직접 import하지 않는 구조이므로 api가 아니라 Context 경계에서 끊는다). `console.error` 검증은 `vi.spyOn(console, 'error').mockImplementation(() => {})`.
- 시나리오 사이에 상태가 새지 않게 `beforeEach`에서 mock을 초기화한다.

### 구현에 아직 없는 것을 import할 때

시그니처 문서가 정한 경로·이름·타입 그대로 import한다. 문서와 다르게 쓰면 Green 단계에서 구현이 테스트에 맞춰 왜곡된다. 문서에 모호한 부분이 있으면 임의로 정하지 말고 사용자에게 묻는다.

### 코드 스타일

프로젝트 Prettier 규칙(세미콜론, 작은따옴표, 2칸, trailing comma `all`, printWidth 100)을 따르고, 주석과 테스트 이름은 한국어로 쓴다. 작성 후 `npx prettier --write <테스트 파일>`로 정리해도 된다.

## 하지 말 것

- `src/`의 비테스트 파일 수정, 스텁/구현 추가
- 시나리오에 없는 테스트 추가 (Out of Scope 포함)
- 실패를 숨기려는 `it.skip`, `it.todo`, 약한 단언(`expect(true)`)
- 실패한 테스트를 통과시키려고 테스트 기대값을 구현에 맞춰 바꾸기
- `--no-verify`나 훅 우회
