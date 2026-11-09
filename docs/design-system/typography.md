# 타이포그래피

폰트는 **Inter**. 크기와 굵기만으로 위계를 만든다.

| 역할                | 토큰          | 크기    | 규칙                                                               |
| ------------------- | ------------- | ------- | ------------------------------------------------------------------ |
| Display (선언)      | `display-lg`  | 3.5rem  | 랜딩 순간에만. `letter-spacing: -0.02em`                           |
| Headline (인사이트) | `headline-md` | 1.75rem | 노트 제목. `line-height: 1.4`                                      |
| Body (지식)         | `body-lg`     | 1rem    | 장문은 `on_surface_variant`, 핵심 강조만 `on_surface`              |
| Label (메타데이터)  | `label-md`    | 0.75rem | 항상 `uppercase`, `letter-spacing: +0.05em`. 입력 필드 라벨도 이것 |

## 한글 폴백

한글 UI 때문에 `Inter, 'Pretendard Variable', system-ui, sans-serif` 순으로 폴백한다. Pretendard는 한글 글리프용이다.

```css
--font-sans: 'Inter', 'Pretendard Variable', system-ui, sans-serif;
```

Boogaloo(`--font-display`)를 유지할지는 [migration.md](./migration.md)의 열린 이슈.
