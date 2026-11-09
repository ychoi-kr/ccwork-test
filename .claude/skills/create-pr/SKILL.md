---
name: create-pr
description: 현재 브랜치의 변경사항을 요약해 PR 초안(제목·본문)을 만들고, 개발자 승인을 받은 뒤 E2E(npm run test:e2e)를 통과해야만 git push + gh pr create로 PR을 생성하는 스킬. 사용자가 "/create-pr", "create-pr", "PR 만들어줘", "PR 올려줘", "PR 보내줘", "이거 머지하자", "머지하자", "풀리퀘 올려줘", "pull request 생성"처럼 말하거나 TDD 사이클 마지막 단계(security-review 이후 commit → PR)에서 PR을 올리려 하면 스킬 이름을 부르지 않아도 반드시 이 스킬을 사용한다. E2E가 실패하면 PR을 만들지 않고 근본 원인 수정 절차를 안내하며, E2E 코드를 고쳐서 통과시키는 일은 하지 않는다.
argument-hint: '[--base <브랜치>]'
---

# create-pr

PR 생성을 자동화하되, **승인 게이트와 E2E 게이트** 두 번을 통과해야만 PR이 만들어진다.

- 승인 게이트: PR은 팀에 보이는 외부 행위라 되돌리기 어렵다. 내용을 개발자가 먼저 봐야 한다.
- E2E 게이트: 단위 테스트가 못 보는 실제 브라우저·네트워크 연결 문제를 PR 전에 잡는다. 실패한 채 올리면 리뷰어가 깨진 코드를 리뷰하게 된다.

모든 출력(초안, 안내, PR 제목·본문)은 한국어로 쓴다.

## 0. 사전 점검

아래를 병렬로 확인한다.

```bash
git branch --show-current
git status --short
git remote -v
gh auth status
```

다음에 해당하면 **멈추고 개발자에게 알린다** (임의로 해결하지 않는다):

- **현재 브랜치가 `main`**: PR을 올릴 수 없다. 브랜치를 먼저 만들자고 제안한다.
- **미커밋 변경이 있음**: PR에는 커밋된 내용만 담긴다. 변경 파일을 보여주고 "커밋할지 / 제외할지" 묻는다. 커밋을 대신 하려면 아래 "커밋 규칙"을 지킨다.
  - `db.json`이 변경 목록에 있으면 앱 사용 중 json-server가 쓴 의도하지 않은 변경일 가능성이 크다. 커밋 대상에 넣지 말고 반드시 따로 확인한다.
  - `package-lock.json` 등 의도가 불분명한 파일도 같은 방식으로 확인한다.
- **`gh` 미인증**: `gh auth login`을 안내한다(사용자가 `! gh auth login`으로 직접 실행).
- **remote가 CLAUDE.md의 기록(`frongt/ccwork`)과 다름**: 실제 `git remote -v`가 기준이다. 다르면 한 줄로 알리고 실제 remote로 진행할지 확인한다.

### 커밋 규칙 (커밋이 필요할 때만)

husky가 자동 검사하므로 처음부터 지킨다. `--no-verify`로 우회하지 않는다.

- 형식 `type: 제목` (type: feat, fix, docs, chore, refactor, test, style, perf, build, ci, revert)
- 제목 다음 빈 줄, **본문은 비어 있지 않은 2줄 이상**
- 끝에 시스템이 지정한 `Co-Authored-By` 꼬리말

## 1. base 브랜치 결정

기본값을 맹목적으로 `main`으로 쓰지 않는다. 이 프로젝트는 이슈 PR을 `feature/<spec>` 브랜치로 보내고(squash merge), feature 브랜치가 끝나면 `main`으로 보낸다.

1. 인자 `--base`가 있으면 그것을 쓴다.
2. 현재 브랜치가 `feature/<spec>-<이슈>` 같은 하위 작업 브랜치라면 부모 `feature/<spec>` 브랜치가 후보다. `git branch -a`로 존재 여부를 확인한다.
3. 현재 브랜치가 `feature/<spec>` 자체이거나 부모를 못 찾으면 `main`.
4. 결정한 base와 근거를 초안에 함께 보여주고, 개발자가 바꿀 수 있게 한다.

## 2. PR 초안 작성

base 대비 변경을 읽는다.

```bash
git fetch origin
git log --oneline <base>..HEAD
git diff --stat <base>...HEAD
git diff <base>...HEAD        # 큰 경우 핵심 파일 위주로
```

커밋 목록만 이어 붙이지 말고 **변경의 의도**를 요약한다. 이슈 작업이면 `docs/features/<feature>/issue-N.md`(시나리오·AC)와 브랜치/커밋 메시지의 이슈 번호를 참고한다.

### 형식

제목: 70자 이내, 커밋 규칙과 같은 `type: 제목` 스타일(한국어).

본문 템플릿:

```markdown
## 변경 사항

- (무엇을 바꿨는지 2~5개 불릿)

## 배경 / 목적

(왜 필요한지 1~3문장. 관련 이슈가 있으면 `Closes #N`)

## 테스트

- 단위 테스트: (추가·변경한 것, 또는 해당 없음)
- E2E: 승인 후 실행 결과로 채운다(아직 미실행이면 "실행 예정")

## 리뷰 포인트

(리뷰어가 특히 볼 곳. 없으면 생략)

🤖 Generated with [Claude Code](https://claude.com/claude-code)
```

마지막 줄의 `🤖 Generated with ...` 는 항상 본문 끝에 둔다.

## 3. 승인 요청 (게이트 1)

초안을 아래 항목과 함께 보여주고 **응답을 기다린다**. 승인 전에는 E2E도 push도 하지 않는다. CLAUDE.md의 "자동으로 다음 단계로 넘어가지 말 것" 원칙이며, 개발자가 본 적 없는 내용을 올리지 않기 위함이다.

- 제목, 본문, base ← head, 변경 파일 수
- "승인 / 수정 요청 / 중단" 중 선택하도록 안내

수정 요청이 오면 반영해 다시 보여주고 재승인을 받는다. 승인은 이번 초안에 대한 것이다. 내용이 바뀌면 다시 묻는다.

## 4. E2E 실행 (게이트 2)

승인 후:

```bash
npm run test:e2e
```

`playwright.config.ts`의 `webServer`가 `npm run dev`(Vite 5173 + json-server 3001)를 띄우거나 이미 떠 있는 서버를 재사용한다. 이미 떠 있는 서버가 있으면 다른 데이터를 쓰고 있을 수 있으니, 이상한 실패가 나면 그 점을 먼저 의심한다.

E2E는 앱을 실제로 쓰는 셈이라 `db.json`이 바뀔 수 있다. 실행 후 `git status`로 `db.json`을 확인하고, 변경됐으면 커밋·푸시 대상에 넣지 않으며 개발자에게 알린다(되돌리기는 개발자 확인 후).

### 실패 시: PR 생성 중단

`git push`와 `gh pr create`를 **하지 않는다.** 실패한 테스트 이름과 에러 요약을 보여준 뒤 아래 안내를 그대로 출력한다.

```
❌ E2E 실패 — PR 생성을 중단했습니다.

다음 순서로 근본 원인을 고치세요:

① Trace Viewer로 실패 지점 확인
   npx playwright show-report
② 어느 레이어에서 깨졌는지 판별
   - API: 요청/응답 불일치 (src/api/notes.ts, json-server 데이터)
   - 렌더링: 화면에 보여야 할 것이 안 보임 (컴포넌트, 로케이터 대상 UI)
   - 로직: 상태 갱신·분기 오류 (NotesContext, App 상태, 폼 처리)
③ 해당 단위 테스트에 재현 케이스 추가 (Red)
④ 프로덕션 코드 수정 (Green) → 다시 /create-pr

⚠️ E2E 코드를 고쳐서 통과시키는 것은 금지입니다.
   테스트를 바꾸면 근본 원인을 회피할 뿐, 같은 버그가 사용자에게 남습니다.
```

안내 뒤에는 가능하면 실패 로그를 근거로 어느 레이어가 유력한지 한두 줄 의견을 덧붙이되, 코드는 고치지 않는다. 개발자가 요청하면 ③·④는 `/tdd-red`, `/tdd-green` 흐름으로 진행하자고 제안만 한다.

**하지 않는 것:** `e2e/` 수정, `test.skip`/`test.fixme` 추가, 타임아웃·재시도 상향, `playwright.config.ts` 변경, 기대값 완화. 이런 변경을 요청받아도 이 스킬 안에서는 거절하고 위 절차를 안내한다. flaky로 의심되는 경우에는 근거(재실행 결과 등)를 보고하고 판단은 개발자에게 맡긴다.

### 통과 시

통과한 테스트 수를 요약하고 5단계로 간다. 초안의 E2E 항목을 결과로 갱신하되, 그 밖의 내용이 바뀌지 않았음을 확인한다.

## 5. push 및 PR 생성

```bash
git push -u origin <현재 브랜치>
gh pr create --base <base> --head <현재 브랜치> --title "<제목>" --body "$(cat <<'EOF'
<승인된 본문>
EOF
)"
```

- 승인된 초안과 다른 내용을 몰래 바꾸지 않는다.
- force push, `--no-verify`는 쓰지 않는다. push가 거부되면(non-fast-forward 등) 원인을 보고하고 개발자에게 묻는다.
- 같은 브랜치의 PR이 이미 있으면(`gh pr list --head <브랜치>`) 새로 만들지 않고 URL을 알려준 뒤 갱신할지 묻는다.
- 끝나면 PR URL을 알려주고, TDD 사이클 다음 단계(리뷰 → squash merge → 이슈 클로즈)를 **제안만** 한다. 머지는 개발자 승인 없이 하지 않는다. "이거 머지하자"는 PR 생성 요청으로 해석해 이 스킬을 시작하는 것이며, 머지 자체는 별도로 확인한다.

## 요약 체크리스트

1. 사전 점검(브랜치, 미커밋, db.json, remote, gh 인증)
2. base 결정
3. 초안 작성 → **승인 대기**
4. `npm run test:e2e` → 실패면 안내 출력 후 **중단**
5. 통과면 push → `gh pr create` → URL 보고
