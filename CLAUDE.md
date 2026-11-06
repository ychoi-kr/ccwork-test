# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 프로젝트 목적

React 19 + TypeScript + Vite 기반의 **노트 앱 실습/강의용 프로젝트**. 노트 CRUD(목록, 생성, 수정, 삭제)를 제공하는 소규모 SPA이며, 백엔드는 `json-server`가 `db.json`을 REST API로 노출한다. 강의에서 기능을 단계적으로 추가하는 용도라서 일부러 비워 둔 부분이 있다(예: `src/types/note.ts`의 `tags` 필드는 "강의에서 추가할 것"으로 표시됨). 요청받지 않은 기능을 미리 채워 넣지 않는다.

## 명령어

```bash
npm run dev          # Vite(5173) + json-server(3001)를 concurrently로 동시 실행
npm run server       # json-server만 실행 (http://localhost:3001/notes)
npm run build        # tsc && vite build (타입 체크 포함)
npm run lint         # eslint . --fix (자동 수정 포함)
npm run format       # prettier --write .
npm test             # vitest run (1회 실행)
npm run test:watch   # vitest watch
npx vitest run src/path/to/file.test.tsx            # 단일 테스트 파일
npx vitest run -t "테스트 이름"                      # 이름으로 단일 테스트
```

- 앱을 실제로 확인하려면 API 서버(3001)가 떠 있어야 한다. `npm run dev` 한 번이면 둘 다 뜬다.
- 현재 테스트 파일은 없다. 환경만 구성되어 있다: vitest + jsdom + Testing Library (`globals: true`, 설정은 `vite.config.ts`의 `test` 블록, setup은 `src/test-setup.ts`에서 `@testing-library/jest-dom` 로드).
- `db.json`은 json-server가 직접 읽고 **쓴다**. 앱을 사용하면 파일이 바뀌므로, 의도하지 않은 데이터 변경은 커밋하지 않도록 주의한다.

## 아키텍처

데이터 흐름은 한 방향으로 흐르는 세 계층이다.

```
components (UI)  →  context/NotesContext (전역 상태)  →  api/notes (fetch)  →  json-server(db.json)
```

- **`src/api/notes.ts`**: `fetch` 래퍼(`fetchNotes`, `createNote`, `updateNote`, `deleteNote`). `API_URL`은 `http://localhost:3001`로 하드코딩되어 있다. `res.ok`가 아니면 `Error`를 throw한다. `createdAt`/`updatedAt` 타임스탬프는 **클라이언트에서** 생성한다(`new Date().toISOString()`). `id`는 json-server가 부여하는 문자열이다. 수정은 `PATCH`.
- **`src/context/NotesContext.tsx`**: `NotesProvider`와 `useNotes()` 훅. `notes`, `loading`, `error` 상태와 `createNote` / `updateNote` / `deleteNote`를 제공한다(API 함수와 같은 이름). 상태 갱신은 **API 호출 성공 후** 서버 응답으로 로컬 상태를 반영하는 방식이며(낙관적 업데이트 아님), 실패 시 throw를 그대로 호출자에게 전파하며, 호출하는 컴포넌트가 `try/catch`로 `console.error`만 남긴다(`alert` 등 사용자 알림은 쓰지 않는다). `useNotes`는 Provider 밖에서 쓰면 에러를 던진다.
- **`src/App.tsx`**: UI 선택 상태(`selectedNoteId`, `isCreating`)만 보유한다. 이 두 값은 서로 배타적으로 유지된다(새 노트 → 선택 해제 + 생성 모드, 노트 선택 → 생성 모드 해제). 이 상태는 Context가 아니라 props로 내려보낸다.
- **`src/components/`**: `Layout`(헤더 + 사이드바/메인 슬롯, `sidebar`/`main`을 ReactNode props로 받음), `NoteList`(로딩/에러/빈 상태 처리 후 목록 렌더), `NoteItem`(카드 하나, 삭제 버튼은 `stopPropagation`), `NoteEditor`(생성/편집 겸용 폼).
- **`src/types/note.ts`**: `Note` 인터페이스. 새 필드를 추가할 때는 타입 → `api/notes.ts`의 `Omit`/`Partial` 시그니처 → Context → 컴포넌트 순으로 따라가면 된다.

## 구현 패턴 / 컨벤션

### 컴포넌트
- 함수형 컴포넌트 + named export(`export function X`). `App`만 default export. 파일 하나에 컴포넌트 하나, 파일명은 PascalCase.
- props는 같은 파일 상단에 `interface XxxProps`로 정의하고 시그니처에서 구조 분해한다. `React.FC`는 쓰지 않는다.
- `children` 대신 이름 있는 슬롯 props(`Layout`의 `sidebar`, `main`: `ReactNode`)로 영역을 주입한다.
- 컴포넌트는 UI 상태와 렌더링만 맡는다. 데이터 접근은 `useNotes()`로만 하고 `api/`를 직접 import하지 않는다.
- 분기 렌더링은 early return(`NoteList`: 로딩 → 에러 → 빈 상태 → 목록, `NoteEditor`: 미선택 상태)으로 처리한다. 훅 호출은 항상 early return보다 위에 둔다.
- 부모가 소유한 상태는 props 콜백(`onSelect`, `onDone`, `onDelete`)으로 올려 보낸다. 하위 컴포넌트(`NoteItem`)는 상태 없이 props만 받는 표현 컴포넌트다.
- 이벤트 핸들러 안에서 클릭 전파를 막아야 하면 `e.stopPropagation()`을 쓴다(`NoteItem` 삭제 버튼).

### 상태 관리
- 서버 데이터(`notes`, `loading`, `error`)는 `NotesContext` 하나에서 `useState`로 관리한다. 외부 상태 라이브러리와 `useReducer`는 쓰지 않는다.
- 변경 후에는 **서버 응답으로 로컬 상태를 갱신**한다. 불변 업데이트(`[...prev, x]`, `prev.map`, `prev.filter`)를 함수형 `setState`로 처리한다.
- 순수 UI 상태(`selectedNoteId`, `isCreating`)는 `App`의 `useState`에 두고 props로 내려보낸다. 폼 입력(`title`, `content`, `saving`)은 `NoteEditor`의 로컬 상태다.
- Context 값 객체는 메모이제이션하지 않는다(`useMemo`/`useCallback` 없음).

### API 호출
- `src/api/notes.ts`에 리소스별로 async 함수를 모은다. 모두 `fetch` + `if (!res.ok) throw new Error('Failed to ...')` + `res.json()` 형태다.
- 쓰기 요청은 `Content-Type: application/json` 헤더와 `JSON.stringify` 본문을 쓴다. 생성은 `POST`, 수정은 `PATCH`(부분 수정), 삭제는 `DELETE`(반환값 없음, `Promise<void>`).
- `createdAt`/`updatedAt`은 API 함수 안에서 채운다. 호출자는 `title`/`content`만 넘긴다.
- 에러 메시지는 영어 고정 문자열이고, UI에서 보여줄 한국어 문구는 컴포넌트(`NoteList`의 에러 표시)에서 붙인다. 변경(생성/수정/삭제) 실패는 호출한 컴포넌트에서 `console.error`로만 기록한다.
- API 모듈은 `import * as api from '../api/notes'` 형태로 `NotesContext.tsx`에서만 import한다.

### 네이밍
- 컴포넌트/컴포넌트 파일: PascalCase (`NoteEditor.tsx`). 비컴포넌트 파일: camelCase 또는 소문자 (`notes.ts`, `note.ts`).
- API와 Context는 동작 이름을 `create/update/delete` + `Note`로 통일한다(`fetchNotes`만 조회용). 새 동작도 두 레이어에서 같은 이름을 쓴다.
- props 콜백은 `on` + 동작(`onSelect`, `onNewNote`, `onDone`), 그 구현은 `handle` + 동작(`handleSelectNote`, `handleSave`).
- 불리언은 `is`/`-ing` 형태(`isSelected`, `isCreating`, `loading`, `saving`). 타입은 `interface`를 쓰고 `I` 접두사는 없다.

### 스타일 / 도구
- **Tailwind CSS v4**(`@tailwindcss/vite`, `tailwind.config` 없음). 디자인 토큰은 `src/index.css`의 `@theme`에 정의되어 있고 `bg-card`, `text-muted-foreground`, `border-border`, `text-destructive` 같은 시맨틱 클래스로 쓴다.
- 폰트는 `index.html`에서 Pretendard(CDN)와 Boogaloo(Google Fonts)를 로드한다.
- UI 텍스트와 코드 주석은 한국어. Prettier: 세미콜론, 작은따옴표, 2칸, trailing comma `all`, `printWidth` 100. TypeScript `strict: true`.
- ESLint flat config: typescript-eslint, react-hooks, react-refresh(`only-export-components`는 warn).

## 일관성이 없는 부분 (새 코드 작성 시 주의)

1. **조회와 변경의 에러 처리 차이**: 조회 실패는 Context의 `error` 상태로 흡수해 `NoteList`에 표시하고, 변경 실패는 throw되어 호출한 컴포넌트(`NoteEditor`, `NoteList`)가 `console.error`로만 기록한다. 사용자에게는 실패가 보이지 않는다.
2. **Promise 스타일 혼용**: `NotesContext`의 초기 로딩은 `.then().catch().finally()` 체인이고, 나머지 비동기 함수는 `async/await`다. `.catch((e) => ...)`의 `e`는 타입이 지정되지 않았다.
3. **Context 함수 시그니처 불일치**: `createNote(title, content)`는 위치 인자, `updateNote(id, updates)`는 객체 인자다. `updateNote`의 `Partial<Note>`는 `id`/`createdAt`까지 받을 수 있어 타입이 느슨하다.
4. **`onDone`이 두 가지 의미**: 저장 성공과 취소 버튼 모두 `onDone`을 호출한다. 저장 후 "선택 상태는 유지"한다는 주석이 있지만, 신규 생성 후에는 `selectedNoteId`가 `null`이어서 편집기가 빈 상태 화면으로 돌아간다.
5. **스타일 규칙 위반**: 토큰 대신 `Layout`이 `style={{ fontFamily: 'Boogaloo' }}`와 `calc(100vh - 65px)`를 인라인으로 쓴다(`@theme`에는 `--font-display`가 이미 있다). 그림자 `shadow-[0_2px_12px_rgba(...)]`도 여러 컴포넌트에 하드코딩으로 반복된다.
6. **방어 코드와 검증이 어긋남**: `NoteItem`은 `note.title || '(제목 없음)'`을 처리하지만 `NoteEditor`는 빈 제목 저장을 막는다. 제목이 빈 노트는 생길 수 없다.
7. **`NoteEditor`의 `useEffect`**: 선택 노트가 서버에서 갱신돼도 폼은 다시 동기화되지 않는다(의존성이 `selectedNoteId`, `isCreating`뿐). lint 경고는 `eslint-disable`로 억제했다.
8. **react-refresh 규칙**: `NotesContext.tsx`가 컴포넌트(`NotesProvider`)와 훅(`useNotes`)을 함께 export하므로 `react-refresh/only-export-components` 경고 대상이다.
9. **파일명 단/복수**: `api/notes.ts`는 복수, `types/note.ts`는 단수다.

## 참고

- 삭제 확인 절차가 없고, 목록은 서버가 준 순서(생성 순) 그대로 표시된다. 라우팅 라이브러리는 없다.
- 원격 저장소: `git@github.com:frongt/ccwork.git`. 커밋 메시지는 `docs:`, `init:` 같은 conventional-commit 스타일 접두사를 쓴다.
