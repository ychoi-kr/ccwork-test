import { test as base, expect, type APIRequestContext } from '@playwright/test';

const API_URL = 'http://localhost:3001';

interface SeedInput {
  title: string;
  content?: string;
  /** undefined면 tags 필드를 아예 보내지 않는다 (태그 도입 전 기존 노트 재현) */
  tags?: string[];
}

export interface SeededNote {
  id: string;
  title: string;
}

async function createNote(request: APIRequestContext, input: SeedInput): Promise<SeededNote> {
  const now = new Date().toISOString();
  const res = await request.post(`${API_URL}/notes`, {
    data: { content: '', ...input, createdAt: now, updatedAt: now },
  });
  expect(res.ok()).toBeTruthy();
  return res.json();
}

interface Fixtures {
  /** 노트를 API로 만들고, 테스트가 끝나면 삭제한다 */
  seedNote: (input: SeedInput) => Promise<SeededNote>;
  /** 서버에 저장된 노트의 최종 상태 조회 */
  fetchNote: (id: string) => Promise<{ title: string; tags?: string[] }>;
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
