---
name: mermaid-diagram
description: src/ 코드를 분석해 Mermaid로 프로젝트 구조(모듈·컴포넌트 의존성, props 흐름, 상태 흐름, 호출 시퀀스)를 시각화한 단일 HTML을 docs/architecture/index.html에 생성한다. 사용자가 "아키텍처 시각화", "구조도", "의존성 다이어그램", "컴포넌트 관계도", "상태 흐름도", "mermaid" 등을 언급하거나 코드 구조를 그림으로 보고 싶어 하면, 명시적으로 요청하지 않아도 이 스킬을 사용한다. 코드 구조가 바뀐 뒤 기존 다이어그램을 갱신할 때도 사용한다.
---

# mermaid-diagram

`src/`를 읽고 Mermaid 다이어그램이 든 HTML 한 장을 `docs/architecture/index.html`에 만든다. 우선순위는 **컴포넌트·모듈 간 의존성**이 1순위, **상태 흐름**이 2순위다. 사람이 브라우저로 열어 보는 문서이므로, 코드에 실제로 있는 관계만 정확히 그리는 것이 가장 중요하다(없는 관계를 추측해서 넣으면 문서 전체를 믿을 수 없게 된다).

## 절차

1. **의존성 추출**: `python3 .claude/skills/mermaid-diagram/scripts/extract_imports.py src`를 실행한다. 로컬 모듈 간 import 간선을 Mermaid `flowchart` 문법으로 출력한다(외부 패키지는 제외). 이 결과를 1번 다이어그램의 뼈대로 쓴다.
2. **코드 읽기**: 스크립트가 알려 주지 못하는 것은 직접 읽어서 확인한다.
   - 컴포넌트 JSX와 props → 렌더링 계층, 슬롯, 콜백 방향
   - `useState`/`createContext` → 상태 소유 위치와 전달 경로
   - 상태를 바꾸는 함수 호출 체인(컴포넌트 → Context → API → 서버)
3. **HTML 작성**: 아래 구성과 규칙대로 `docs/architecture/index.html`을 쓴다. 기존 파일이 있으면 코드와 달라진 부분만 고치지 말고, 절차 1~2의 결과로 다이어그램을 다시 확인해 갱신한다.
4. **마무리**: 렌더링은 이 환경에서 검증하기 어렵다. 검증하지 못했다고 사용자에게 알리고, 열람 방법을 안내한다(아래 참고).

## 다이어그램 구성 (순서 고정)

| # | 종류 | 내용 |
|---|------|------|
| 1 | `flowchart LR` | 모듈 import 의존성. 계층별 `subgraph` + 색 구분. 외부 서버는 점선(`-.->`)으로 표시 |
| 2 | `flowchart TD` | 컴포넌트 렌더링 트리. 점선으로 props·콜백 방향 표시 |
| 3 | `flowchart LR` | 상태 위치(전역/부모/로컬)와 흐름 |
| 4~ | `sequenceDiagram` | 쓰기·삭제 같은 주요 동작의 호출 순서 |

1번과 2번은 항상 유지한다. 3번 이후는 코드에 해당 개념이 있을 때만 넣고, 새 동작이 생기면 시퀀스를 추가한다. 각 섹션에는 `h2` 제목과 "무엇을 보는 그림인지" 한 줄 설명을 붙인다.

## HTML 규칙

- 단일 파일. Mermaid는 `https://cdn.jsdelivr.net/npm/mermaid@11.4.0/dist/mermaid.min.js`로 불러오고, 다이어그램은 `<pre class="mermaid">`에 넣는다.
- `prefers-color-scheme`에 맞춰 CSS 변수와 Mermaid 테마(`dark`/`default`)를 전환한다.
- 라벨 줄바꿈은 `<br/>`, 특수문자·한글 설명이 든 라벨은 큰따옴표로 감싼다(파싱 오류 방지).
- 색은 `classDef`로 통일한다: 컴포넌트 파랑, Context/상태 노랑, api·types 초록, 외부 서버 보라.
- 프로젝트 규칙(`CLAUDE.md`)에 따라 화면 텍스트는 한국어로 쓴다.

참고용 완성 예시는 저장소의 `docs/architecture/index.html`이다. 구조를 맞출 때 참조하되 내용은 현재 코드에서 새로 뽑는다.

## 열람 방법 안내

- macOS: `open docs/architecture/index.html`
- Linux(GUI): `xdg-open docs/architecture/index.html`
- DISPLAY가 없거나 열 수 없는 환경이면 억지로 시도하지 말고 명령만 안내한다: `python3 -m http.server 8000 --directory docs/architecture` 후 `http://localhost:8000`.

커밋은 사용자가 요청할 때만 한다.
