---
name: tdd-auto-loop
description: GitHub 이슈 번호 하나를 받아 TDD 7단계(시나리오 → Red → Green → AC 검증 → Refactor → Security → PR)를 사용자 동의 없이 끝까지 자동 주행하는 loop 스킬. 단계마다 subagent를 격리 실행하고 JSON 결과만 받으며, STOP 조건이 나오면 이슈 코멘트를 남기고 종료한다. 사용자가 "/tdd-auto-loop 13", "이슈 13 자동으로 끝까지", "승인 없이 TDD 전체 돌려줘", "자동주행 TDD"처럼 말하면 반드시 이 스킬을 사용한다. 단계마다 승인을 받는 진행은 /tdd-loop, 개별 단계는 해당 단계 스킬을 쓴다.
argument-hint: <이슈 번호>
---

# tdd-auto-loop

이슈 1개를 TDD 7단계로 **무인 완주**하는 오케스트레이터다. 7단계 순서와 단계별 스킬은 `/tdd-loop`을 따른다. 다른 점은 (1) 단계마다 subagent로 격리 실행하고 (2) 승인 게이트를 자체 통과시키며 (3) 문제가 생기면 사람에게 묻지 않고 STOP한다는 것이다.

> ⚠ 프로젝트 CLAUDE.md의 "단계마다 사람 승인" 규칙에 대한 **명시적 예외**다. 사용자가 이 스킬을 호출한 것이 곧 완주에 대한 사전 동의다.

`$ARGUMENTS` = 이슈 번호 `N`. 숫자가 아니면 STOP(`invalid_argument`).

## 격리 원칙

- 메인은 오케스트레이터다. **코드 본문(src, 테스트)을 직접 읽거나 고치지 않는다.** git/gh 조회와 JSON 판정만 한다.
- 단계마다 `Agent` 도구로 subagent를 새로 띄운다. subagent는 끝나면 **결과 JSON 한 블록만** 반환한다.
- AC 검증(4단계)은 `ac-verifier` agent가 맡고, Green(3단계)을 한 subagent와 **반드시 다른 인스턴스**다. 구현자 컨텍스트를 넘기지 않는다.

## 0단계. 사전 점검 (메인이 직접)

하나라도 실패하면 STOP.

1. `gh issue view N` — 이슈가 열려 있고 **AC가 있어야** 한다. (`ac_missing`)
2. `git status --porcelain` — 출력이 없어야 한다. (`dirty_tree`)
3. 현재 브랜치가 `feature/<spec>`이어야 한다. `<spec>`을 기록한다. (`bad_base_branch`)
4. 이슈 브랜치 `feat/<N>-<slug>`(영문 slug 없으면 `feat/issue-<N>`)를 `feature/<spec>`에서 분기한다. 같은 이름이 이미 있으면 덮어쓰지 않고 STOP. (`branch_exists`)

## 자율 모드 문구 (모든 subagent 프롬프트 맨 끝에 그대로 붙인다)

```
[자율 모드]
- 하위 스킬의 사용자 승인 게이트는 스스로 통과한다. 사용자에게 묻지 않는다.
- 요구사항이 모호하면 추측하지 말고 {"status":"stop","reason":"..."} 로 종료한다.
- 출력은 아래 지정된 JSON 한 블록뿐이다. 그 외 텍스트(설명, 인사, 코드 블록 밖 문장)는 금지한다.
```

## 단계와 JSON schema

각 subagent의 프롬프트에는 "호출할 스킬 + 이슈 번호 + 자율 모드 문구 + 아래 schema"를 넣는다. schema는 **예시값 그대로의 키·타입을 지키며, 필드 추가·삭제·이름 변경(변형)을 금지**한다. 모든 단계 공통으로 실패 시 `{"status":"stop","reason":"<사유>"}`를 허용한다.

| #   | 단계     | subagent 호출        | 결과 schema                                                                                                                                      |
| --- | -------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | 시나리오 | `/test-scenarios N`  | `{"status":"ok","doc":"docs/features/tag/issue-13.md","scenarios":7}`                                                                            |
| 2   | Red      | `/tdd-red N`         | `{"status":"ok","test_files":["src/tags/useX.test.ts"],"failing":7,"failed_for_right_reason":true}`                                              |
| 3   | Green    | `/tdd-green N`       | `{"status":"ok","tests_total":42,"tests_passed":42,"files_changed":["src/tags/useX.ts"]}`                                                        |
| 4   | AC 검증  | `ac-verifier` agent  | `{"status":"ok","ac_passed":true,"results":[{"ac":"AC 문장","verdict":"met","evidence":"근거"}],"gaps":[]}` (`verdict`: `met`/`partial`/`unmet`) |
| 5   | Refactor | `/tdd-refactor N`    | `{"status":"ok","tests_passed":42,"changes":["중복 제거"],"rolled_back":false}`                                                                  |
| 6   | Security | `/security-review N` | `{"status":"ok","tsc_errors":0,"findings":[{"severity":"low","item":"설명"}]}` (`severity`: `high`/`medium`/`low`)                               |
| 7   | PR       | `/create-pr`         | `{"status":"ok","commit":"abc1234","pr_url":"https://github.com/...","base":"feature/tag","closes":13,"commitlint":"pass"}`                      |

4단계 agent는 JSON 출력 지시를 프롬프트로 덧붙인다(agent 정의 자체는 수정하지 않는다).

## 재시도

- **Green(3단계)만 최대 3회.** 실패(`tests_passed < tests_total` 또는 stop)마다 직전 실패 요약만 새 subagent에 전달해 재시도한다. 3회 모두 실패하면 STOP(`green_failed_3x`).
- **그 외 단계**는 schema 위반(JSON 파싱 실패, 키 누락/변형)이면 **1회만** 재시도하고, 또 위반이면 STOP(`schema_violation`). 내용상 실패(`status:"stop"`)는 재시도 없이 바로 STOP.

## STOP 조건

| 단계 | STOP                                                                                   |
| ---- | -------------------------------------------------------------------------------------- |
| 0    | `ac_missing` / `dirty_tree` / `bad_base_branch` / `branch_exists`                      |
| 1    | `status:"stop"`, `scenarios == 0`                                                      |
| 2    | `failing == 0`(Red가 아님), `failed_for_right_reason == false`                         |
| 3    | 3회 실패                                                                               |
| 4    | `ac_passed == false` (partial/unmet 하나라도)                                          |
| 5    | `tests_passed`가 3단계보다 감소, `rolled_back` 후에도 실패                             |
| 6    | `tsc_errors > 0` 또는 `severity: high` 이상 발견 (medium/low는 리포트에 기록하고 진행) |
| 7    | `commitlint != "pass"`, `base != feature/<spec>`, E2E 실패(PR 미생성), `closes != N`   |
| 공통 | schema 위반 재시도 소진, `status:"stop"`                                               |

**STOP 처리 (사람에게 묻지 않는다):**

1. 메인 로그: `[단계명] STOP({사유})`
2. `gh issue comment N --body "<단계, 사유, 마지막 JSON 요약, 재개 방법>"`
3. 루프 종료. 변경은 되돌리지 않고 그대로 둔다(재개 단서).

## 7단계 PR 규칙

- base는 반드시 `feature/<spec>`(0단계 기록값).
- PR body에 `Closes #N` 포함.
- 커밋 메시지는 commitlint 규칙(`type: 제목`, 빈 줄, 본문 2줄 이상, attribution 줄)을 따르고 `npx commitlint`로 검증. 실패하면 STOP. `--no-verify` 금지.
- `/create-pr`의 승인 게이트는 자율 모드로 통과하되 **E2E 게이트는 우회하지 않는다.** 실패 시 STOP.

## 진행 표시와 최종 리포트

단계마다 한 줄만 출력한다: `[Red] OK` / `[Green] STOP(green_failed_3x)`.

완주하면 단계별 JSON 요약(이슈 번호, 브랜치, 각 단계 결과, security의 medium/low 목록, PR URL)을 한 번에 보여 준다. 머지는 제안만 하고 실행하지 않는다.
