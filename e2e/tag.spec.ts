import type { Page } from '@playwright/test';
import { test, expect, uniqueTitle } from './support/fixtures';

// 목록에서 노트를 골라 편집기를 연다
async function openNote(page: Page, title: string) {
  await page.getByText(title, { exact: true }).click();
  await expect(page.getByPlaceholder('제목')).toHaveValue(title);
}

async function addTag(page: Page, tag: string) {
  await page.getByRole('textbox', { name: '태그 입력' }).fill(tag);
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: `${tag} 태그 삭제` })).toBeVisible();
}

const removeButton = (page: Page, tag: string) =>
  page.getByRole('button', { name: `${tag} 태그 삭제` });

test('US-1: 태그를 추가해 저장하면 서버에 순서대로 남고 새로고침 후에도 보인다', async ({
  page,
  seedNote,
  fetchNote,
}) => {
  const note = await seedNote({ title: uniqueTitle('US-1'), tags: [] });
  await page.goto('/');
  await openNote(page, note.title);

  await addTag(page, 'React');
  await addTag(page, 'Vue');
  await page.getByRole('button', { name: '저장', exact: true }).click();

  await expect.poll(async () => (await fetchNote(note.id)).tags).toEqual(['React', 'Vue']);

  await page.reload();
  await openNote(page, note.title);
  await expect(page.getByRole('button', { name: /태그 삭제$/ })).toHaveText(['×', '×']);
  await expect(removeButton(page, 'React')).toBeVisible();
  await expect(removeButton(page, 'Vue')).toBeVisible();
});

test('US-3: 칩에 hover하면 X가 보이고, 삭제 후 저장하면 해당 태그만 서버에서 빠진다', async ({
  page,
  seedNote,
  fetchNote,
}) => {
  const note = await seedNote({ title: uniqueTitle('US-3'), tags: ['React', 'Vue', 'Node'] });
  await page.goto('/');
  await openNote(page, note.title);

  const vueRemove = removeButton(page, 'Vue');
  await expect(vueRemove).toHaveCSS('opacity', '0');
  await vueRemove.hover();
  await expect(vueRemove).toHaveCSS('opacity', '1');

  await vueRemove.click();
  await expect(vueRemove).toHaveCount(0);
  await page.getByRole('button', { name: '저장', exact: true }).click();

  await expect.poll(async () => (await fetchNote(note.id)).tags).toEqual(['React', 'Node']);
});

// TAG-6(취소하면 태그 변경 폐기) 구현 전이라 막아 둔다. 현재는 취소해도 편집기가 닫히지 않고
// 취소한 변경이 화면에 남는다. TAG-6이 머지되면 test.fixme를 test로 되돌린다.
test.fixme('US-4: 태그를 바꾸고 취소하면 서버와 다시 연 화면 모두 원래 태그다', async ({
  page,
  seedNote,
  fetchNote,
}) => {
  const note = await seedNote({ title: uniqueTitle('US-4'), tags: ['React'] });
  await page.goto('/');
  await openNote(page, note.title);

  await addTag(page, 'Vue');
  await removeButton(page, 'React').click();
  await page.getByRole('button', { name: '취소' }).click();

  expect((await fetchNote(note.id)).tags).toEqual(['React']);

  await openNote(page, note.title);
  await expect(removeButton(page, 'React')).toBeVisible();
  await expect(removeButton(page, 'Vue')).toHaveCount(0);
});

test('US-6: tags 필드가 없는 기존 노트도 빈 태그로 열리고, 태그를 저장할 수 있다', async ({
  page,
  seedNote,
  fetchNote,
}) => {
  const note = await seedNote({ title: uniqueTitle('US-6') }); // tags 필드 없음
  expect((await fetchNote(note.id)).tags).toBeUndefined();

  await page.goto('/');
  await openNote(page, note.title);
  await expect(page.getByRole('textbox', { name: '태그 입력' })).toBeVisible();
  await expect(page.getByRole('button', { name: /태그 삭제$/ })).toHaveCount(0);

  await addTag(page, 'React');
  await page.getByRole('button', { name: '저장', exact: true }).click();
  await expect.poll(async () => (await fetchNote(note.id)).tags).toEqual(['React']);
});

test('US-7: 키보드 Tab으로 X에 포커스하면 X가 보이고 Enter로 삭제된다', async ({
  page,
  seedNote,
}) => {
  const note = await seedNote({ title: uniqueTitle('US-7'), tags: ['React'] });
  await page.goto('/');
  await openNote(page, note.title);

  const reactRemove = removeButton(page, 'React');
  await expect(reactRemove).toHaveCSS('opacity', '0');

  // 제목 입력란에서 Tab → 첫 칩의 X (태그 영역은 제목 바로 다음)
  await page.getByPlaceholder('제목').focus();
  await page.keyboard.press('Tab');
  await expect(reactRemove).toBeFocused();
  await expect(reactRemove).toHaveCSS('opacity', '1');

  await page.keyboard.press('Enter');
  await expect(reactRemove).toHaveCount(0);
});
