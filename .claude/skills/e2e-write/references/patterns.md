# e2e-write 코드 패턴

3단계(지원 코드)와 4단계(작성)에서 필요한 부분만 읽는다. 아래는 이 프로젝트(Playwright 설정: baseURL `http://localhost:5173`, API `http://localhost:3001`)에 맞춘 출발점이다. 로케이터 문구는 반드시 실제 `src/` 코드와 대조해 바꾼다.

## 목차

1. 시드/정리 fixture
2. 기본 시나리오 뼈대
3. 새로고침 후 영속성 확인
4. hover / focus-visible / 키보드
5. 한글 IME 조합
6. 흔한 실수

## 1. 시드/정리 fixture — `e2e/support/fixtures.ts`

```ts
import { test as base, expect, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';

interface SeedInput {
  title: string;
  content?: string;
  tags?: string[];
}

export interface SeededNote extends Required<SeedInput> {
  id: string;
}

async function createNote(request: APIRequestContext, input: SeedInput): Promise<SeededNote> {
  const now = new Date().toISOString();
  const res = await request.post(`${API_URL}/notes`, {
    data: { content: '', tags: [], ...input, createdAt: now, updatedAt: now },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

interface Fixtures {
  /** 노트를 API로 만들고, 테스트가 끝나면 (테스트가 만든 노트 포함) 정리한다 */
  seedNote: (input: SeedInput) => Promise<SeededNote>;
  /** 서버에 저장된 최종 상태 조회 */
  fetchNote: (id: string) => Promise<Record<string, unknown>>;
}

export const test = base.extend<Fixtures>({
  seedNote: async ({ request }, provide) => {
    const ids: string[] = [];
    await provide(async (input) => {
      const note = await createNote(request, input);
      ids.push(note.id);
      return note;
    });
    for (const id of ids) await request.delete(`${API_URL}/notes/${id}`);
  },
  fetchNote: async ({ request }, provide) => {
    await provide(async (id) => (await request.get(`${API_URL}/notes/${id}`)).json());
  },
});

export { expect };

/** 다른 테스트·개발 데이터와 겹치지 않는 제목 */
export const uniqueTitle = (storyId: string) => `e2e-${storyId}-${Date.now()}`;
```

UI로 **새 노트를 만드는 것이 검증 대상**이면 그 테스트가 만든 노트는 `seedNote`가 모른다. 제목으로 찾아 정리하는 헬퍼(`GET /notes?title=...` 후 DELETE)를 `afterEach`에 둔다.

fixture의 `use` 콜백은 이름을 `provide`로 바꿔 쓴다. 프로젝트 ESLint(react-hooks)가 `use(...)`를 React 훅으로 오인해 `rules-of-hooks` 에러를 낸다.

## 2. 기본 시나리오 뼈대

```ts
import { test, expect, uniqueTitle } from './support/fixtures';

test('US-1: 태그를 입력하고 Enter를 치면 칩이 생기고 저장하면 서버에 남는다', async ({
  page,
  seedNote,
  fetchNote,
}) => {
  const note = await seedNote({ title: uniqueTitle('US-1') });
  await page.goto('/');
  await page.getByText(note.title).click();

  await page.getByRole('textbox', { name: '태그' }).fill('React'); // 이름은 코드에서 확인
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'React 태그 삭제' })).toBeVisible();

  await page.getByRole('button', { name: '저장' }).click();
  await expect.poll(async () => (await fetchNote(note.id)).tags).toEqual(['React']);
});
```

- 비동기 서버 상태는 `expect.poll`로 기다린다(고정 대기 금지).
- 버튼 이름 `저장`은 저장 중에 `저장 중...`으로 바뀐다. 클릭 후 완료 판단은 편집기가 닫히는 등 결과로 한다.

## 3. 새로고침 후 영속성

```ts
await page.reload();
await page.getByText(note.title).click();
await expect(page.getByRole('button', { name: 'React 태그 삭제' })).toBeVisible();
```

"저장 → 새로고침 → 다시 열어도 남아 있음"이 E2E의 대표 가치다. 서버 조회(`fetchNote`)와 화면 재진입 중 하나는 반드시 포함한다.

## 4. hover / focus-visible / 키보드

```ts
const chip = page.getByRole('button', { name: 'React 태그 삭제' });
await chip.hover(); // hover로 보이는 X
await expect(chip).toBeVisible(); // opacity 0이면 toBeVisible은 통과할 수 있으니 아래도 확인
await expect(chip).not.toHaveCSS('opacity', '0');

await page.keyboard.press('Tab'); // 키보드 포커스로 보이는 X (focus-visible)
await expect(chip).toBeFocused();
await expect(chip).not.toHaveCSS('opacity', '0');
await page.keyboard.press('Enter');
```

CSS 가시성이 검증 대상일 때만 `toHaveCSS`를 쓴다(jsdom이 못 보는 영역이라 E2E가 맡는 몫이다). Tailwind 클래스명을 단언하지 않는다.

## 5. 한글 IME 조합

jsdom에서는 `isComposing`을 흉내만 낼 수 있어서 실제 조합 흐름은 Chromium에서만 검증된다. `keyboard.type('한글')`은 IME를 거치지 않으므로 이 목적으로 부적합하다. CDP로 조합을 직접 만든다.

```ts
const input = page.getByRole('textbox', { name: '태그' });
await input.focus();
const cdp = await page.context().newCDPSession(page);

await cdp.send('Input.imeSetComposition', { text: '노', selectionStart: 1, selectionEnd: 1 });
await page.keyboard.press('Enter'); // 조합 중 Enter → 태그가 추가되면 안 된다
await expect(page.getByRole('button', { name: /태그 삭제/ })).toHaveCount(0);

await cdp.send('Input.insertText', { text: '노트' }); // 조합 확정
await page.keyboard.press('Enter');
await expect(page.getByRole('button', { name: '노트 태그 삭제' })).toHaveCount(1);
```

CDP 이벤트가 `keydown`의 `isComposing`까지 재현하는지는 Chromium 버전에 따라 다르다. 실행해서 "조합 중 Enter가 무시된다"가 **실제로 앱 로직을 통과하는지** 확인하고, 재현이 안 되면 억지로 통과시키지 말고 그 사실을 보고한다(US는 단위 테스트에 맡기고 수동 확인 항목으로 남긴다).

## 6. 흔한 실수

| 실수                                       | 대신                                                                        |
| ------------------------------------------ | --------------------------------------------------------------------------- |
| `await page.waitForTimeout(500)`           | 결과 요소를 `expect(...).toBeVisible()`로 기다림                            |
| `page.locator('.flex.gap-3 button')`       | `getByRole('button', { name: '저장' })`                                     |
| 기존 `첫 번째 노트`로 시나리오 진행        | `seedNote`로 전용 노트 생성                                                 |
| 테스트 A가 만든 노트를 테스트 B가 사용     | 각 테스트가 직접 시드                                                       |
| 내용 입력란에서 Tab으로 칩 X에 도달 기대   | 이 앱은 DOM 순서가 제목 → 태그 → 내용이다. 포커스 순서는 화면 코드에서 확인 |
| 대소문자 조합 5가지를 E2E로 반복           | 대표 1개만, 나머지는 `useTags` 단위 테스트                                  |
| 저장 PATCH 본문 모양을 route로 가로채 단언 | 서버에 실제 저장된 결과를 `fetchNote`로 확인                                |
