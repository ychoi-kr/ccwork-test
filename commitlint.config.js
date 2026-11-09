export default {
  extends: ['@commitlint/config-conventional'],
  plugins: [
    {
      rules: {
        // 본문의 비어 있지 않은 줄이 최소 N줄이어야 한다
        'body-min-lines': ({ body }, when = 'always', min = 2) => {
          const lines = (body ?? '').split('\n').filter((line) => line.trim() !== '');
          const valid = lines.length >= min;
          return [
            when === 'never' ? !valid : valid,
            `본문은 최소 ${min}줄 이상 작성해야 합니다 (현재 ${lines.length}줄)`,
          ];
        },
      },
    },
  ],
  rules: {
    'subject-case': [0],
    'subject-empty': [2, 'never'], // 제목 필수
    'body-leading-blank': [2, 'always'], // 제목과 본문 사이 빈 줄
    'body-min-lines': [2, 'always', 2], // 본문 최소 2줄
  },
};
