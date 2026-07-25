# 아키텍처 백로그 (improve-codebase-architecture 잔여)

`TRPG 작업 관리 도구.html` 단일 파일 기준. 줄 번호는 조사 시점(2026-06-23) 스냅샷이며,
편집하면 밀린다 — 실행 전 클래스/핸들러 이름으로 재검색할 것.

> **검증 주의:** 후보 1·3은 저장/렌더 **런타임 동작**이 핵심이라 과거에 stale 클로저·
> 잘못된 선택자·내용 유실 버그가 **프리뷰 검증으로만** 잡혔다. 프리뷰 MCP 복구 후 착수 권장.
> 후보 5는 CSS 위주지만 빈 상태 표시라 역시 육안 확인 필요.

---

## 후보 1 — 잔여 legacy CSS 패널을 `cssMacroField`로 이전

`cssMacroField`(deep 모듈, mount/toggle/sync/저장 일원화)는 이미 다음을 담당:
블록 자신(13089), roll 결과칸(15172 host, 17141 mount), branch-inner roll(12738 host,
15279 mount), branch-inner roll 결과(12735 host, 15290 mount), 15557/15821 mount.

아직 **인라인 `.btcp-textarea` + 개별 `apply*/toggle*` 핸들러**로 남은 얕은(shallow) 중복 패널:

| 상태 | 대상 | 패널 마크업 | 토글/적용 핸들러 | css 필드 |
|---|---|---|---|---|
| ✅ 완료 (a280c81) | 엔딩 달성조건/보상/후일담 | ~~`.ending-css-panel` ×3~~ → `data-cmf-ending-field` | `toggleEndingCssPanel`(위임) | `ending.{condition,reward,aftermath}Css` |
| ✅ 완료 (349ff31) | 시나리오 제목 | ~~`#info-title-css-panel`~~ → host(lazy mount) | `openInfoTitleCssPanel`(위임) | `info.titleCss` |
| ✅ 완료 (6079532) | branch-inner 블록/판정/결과칸 ×3 | ~~`.branch-ib-css-panel` 등~~ → `data-cmf-branch-ib`·`data-cmf-branch-result` | `toggle*`(위임), `mountBibItemChildren`에서 mount | `ib.css`·`result.css` |
| 💀 죽은 경로 | ib-콜아웃 nested roll/결과칸 | `.ib-roll-css-panel`·`.ib-roll-result-css-panel` (~12772/12782) | `getIbCalloutNestedRollHtml` | `roll.css`·`r.css` |
| 💀 레거시 전용 | 중첩 대사/텍스트 | `.nested-speech-css-panel`·`.nested-text-css-panel` (~19982/20009) | `mkNestedSpeech/TextHtml` | `item.css` |

### 결론: 후보 1의 **live 패널은 전부 이전 완료**

미이전 2건은 **도달 불가/레거시 전용**이라 마이그 가치 없음:

- **ib-콜아웃 nested roll/결과칸** — `getBibItemHtml`(12603)이 콜아웃 항목 렌더 시 먼저
  `migrateLegacyIbCalloutRowsToGenericChildren(item)`를 돌려 레거시 행을 generic children으로
  변환한다. 그 결과 `hasGenericChildren`이면 `rows=[]`(12620) → `getIbCalloutNestedRollHtml`
  (12640)과 그 안의 legacy 패널은 **호출되지 않는다**. 모든 렌더 경로가 migration을 먼저 타므로
  실사용에서 미도달.
- **중첩 대사/텍스트** (`.nested-speech-item`/`.nested-text-item`) — 생성 함수
  `addNestedSpeech`/`addNestedText`(20002/20021)는 **정의만 있고 호출처 0**. 즉 새로 만들 수 없고,
  callout은 이제 generic children으로 입력받는다. 이 패널은 **마이그 안 된 옛 데이터**에서만 렌더.

### 데드코드 정리 진행 상황

**✅ 제거 완료 (cfa9627):** `getIbCalloutNestedRollHtml` + 전용 CSS 핸들러 4개
(`toggle/applyIbCalloutRollCss`, `toggle/applyIbCalloutRollResultCss`) + 미호출 생성자
`addNestedSpeech`/`addNestedText` (~9.2KB). 도달 불가를 하네스로 실증 후 제거, 전체 패널
스위트 회귀 통과.

**✅ 고아 체인 제거 완료 (03a8be7, ~7.9KB):** `getIbCalloutNestedRollHtml` 제거로 호출처를 잃은
닫힌 죽은 집합 11개 제거 — `openIbCalloutRoll[Result]CtxMenu`·`buildIbCalloutRollCtxMenu`·
`moveIbCalloutRoll`·`moveIbCalloutBodyRow`·`delIbCalloutRoll`·`delIbCalloutRollResult`·
`updIbCalloutRoll`·`updIbCalloutRollResult`·`addIbCalloutRollResult`·`editIbCalloutRollResultLabel`.
각 함수가 집합 내부/이미 삭제된 코드에서만 참조됨을 1건씩 확인 후 제거(헤드리스 회귀 통과).
**보존:** `addIbCalloutRoll`·`addIbNestedCallout`(live — `openIbItemCalloutCtxMenu`에서 generic
children 추가, 동작 검증), `getIbCalloutRoll`·`getIbCalloutRollById`(copy/macro 경로 22531/22791),
`normalizeIbCalloutBodyOrder`·`getIbCalloutRollIndexById`.

**✅ tendril 제거 완료 (3e8b5e0):** `openIbCalloutRollColorPicker`(고아) + 공유 색상피커에 박혀
있던 도달 불가 `'ib-callout-roll'` 분기 전부 제거(`getEmbeddedColorTargetBlock` 절,
`cpPreviewCurrentColor`/`closeColorPanel`/`applyColorPanel`의 disjunct, ib-callout-roll commit
분기 → live ib-roll/branch-inner-roll 본문으로 축약). live ib-roll·branch-inner-roll 색상피커가
여전히 색상 적용/커밋함을 헤드리스로 검증. `'ib-callout-roll'` 참조 0.

→ **ib-콜아웃 nested-roll 레거시 잔재 데드코드 정리 전부 완료.** 중첩 대사/텍스트 레거시 렌더 제거도
**완료**(아래 "데드코드 정리 진행 상황" S1~S4 참조).

**중첩 대사/텍스트 — 재조사: 이미 도달 불가(위험한 마이그 불필요).** 처음엔 레거시 렌더로 판단했으나,
`normalizeBlockTree`가 매 렌더마다 **모든 콜아웃**에 `migrateLegacyCalloutRowsToGenericChildren`를
호출(11885-86)해 `block.nestedCallouts`(speech/text/callout)를 **무손실로 `children`에 옮기고
`nestedCallouts=[]`로 비운다.** 따라서 루트 콜아웃 렌더의 `normalizeCalloutNestedItems`(15729)는
항상 빈 배열을 받아 `mkNestedCalloutItemHtml`/`mkNestedSpeech·TextHtml`이 **실행되지 않는다**.
헤드리스 실증: 옛 nestedCallouts(speech/text/callout) 로드 → `.nested-speech-item`/`.nested-text-item`
0개, children 4개로 이전(내용·화자 보존). **즉 이중 시스템 위험은 이미 해소됨 — 새 마이그 불필요.**

**✅ 제거 완료 (S1 f01331a, S2 dee852a, S3 ef18324, S4 14ff5d4 — main 머지 d5808da):**
4개 vertical slice로 분할 제거.
- **S1** 루트 콜아웃 렌더의 nestedCallouts 루프(15729-15740)를 단일 content slot 렌더로 단순화 +
  죽은 `populateCE`의 `[data-nc-id]` 경로 제거(유일한 live 진입점 차단 = keystone).
- **S2** 고아 렌더러 5개(`mkNestedCalloutItemHtml`·`mkNestedSpeech/TextHtml`·`mkNestedCalloutHtml`·
  `mkSubNestedCalloutHtml`) + 도달 불가 ib-콜아웃 legacy callout-row 분기 제거.
- **S3** 고아 핸들러 **34개**(`add/del/move/copy/updNested*`, `*SubNestedCallout`,
  `toggle/applyNestedSpeech·TextCss`, ctx 메뉴, ncSpeech 토큰 클러스터) + `normalizeCalloutNestedItems`
  와 그 죽은 헬퍼(`moveCalloutBodyLinesToNestedItems`·`expandNestedTextItemLines`·
  `buildNestedTextItemsFromLines`) 제거. 반복 zero-ref prune + 닫힌-cycle 검증으로 죽음 실증.
- **S4** `.nested-speech-*`/`.nested-text-*`/`.nested-callouts-wrap` CSS + live JS 셀렉터 문자열의
  죽은 토큰 제거.
**보존(live):** `migrateLegacyCalloutRowsToGenericChildren`·`legacyCalloutItemToGenericChild`·
`splitNestedTextContentLines`·`createIbCalloutNestedChildFromLegacy`·`addIbNestedCallout`·
`.nested-callout`/`.nested-callout-header`/`.nested-callout-content`·`.callout-content-ce`.
각 슬라이스 parse-clean + 제거 이름 grep 0 + 하네스 전수 `ERRORS []`로 검증 후 커밋.
기능적 이득은 없음(무해한 죽은 코드였음), 파일 크기/복잡도 축소가 목적.

**⚠️ 콜아웃 타이핑 스냅샷 증식 버그 수정 (2026-07).** "매 렌더마다 마이그"가 실제로는
**매 블록 조회마다**(`getRootBlockListByCid`→`normalizeBlockTree`, 키 입력당 1회) + **매 persist
플러시마다**(`makeStatePayload`→`normalizeSidebarState`→`normalizeScenarioRecord`, 라이브 객체 변형)
돌고 있었다. 콜아웃 CE는 `updCalloutBody`로 여전히 `content`에 쓰므로, 타이핑 중 매 승격 시점의
content 스냅샷이 새 text child로 쌓여 "키 입력 이력이 줄줄이 남는" 증상 발생.
수정: content→children 승격을 `opts.promoteLegacyContent`로 게이팅(callout·ending·toggle 공통,
`normalizeBlockTree(blocks, opts)`로 스레딩). true인 곳 = 렌더 경계(`renderBlocks`/
`renderBlockListInto`/`loadBody`)와 로드 경계(`applyStatePayload`)뿐. 조회·persist 경로는 기본 false.
`nestedCallouts` 행 마이그는 종전대로 무조건 수행(레거시 전용 데이터라 증식 불가).
불변식: **라이브 편집 중인 필드를 변형하는 정규화는 DOM을 다시 그리는 경계에서만 실행한다.**

> **검증 하네스 (프리뷰 대용, 동작 확인됨):** `playwright-core`(브라우저 다운로드 없이
> 시스템 Chrome `C:\Program Files\Google\Chrome\Application\chrome.exe` 구동) + `pathToFileURL`
> 로 앱 로드 → 페이지 컨텍스트에서 `applyStatePayload`/`select`/`createBlockData`로 상태 구성 후
> DOM·state 단언. 스크립트는 `%TEMP%\pw-verify\`. (엔딩·info-title 이전이 이걸로 검증됨.)

**이전 레시피 (이미 마친 사이트와 동일):**
1. 마크업의 `.btcp-textarea` 패널 → 빈 host `<div class="css-macro-field" data-cmf-...="${id}"></div>` 로 교체.
2. 렌더 mount 지점에서 `el.querySelector('.css-macro-field[data-cmf-...="${id}"]')` 로 host를 잡아
   `cssMacroField.mount(host, { get: () => <css>, set: v => { <css>=v; recordChange(scope) } })`.
3. badge 클릭 핸들러는 해당 host의 `cssMacroField` toggle로 교체. 개별 `apply*/toggle*` 제거.
4. **선택자 함정(겪었던 버그):** 자식 블록도 자기 `.css-macro-field`를 가지므로 반드시
   `:scope > .css-macro-field` 또는 `[data-cmf-...="${id}"]`로 **자기 것만** 선택.
5. **클로저 함정:** 콜백에서 캡처한 `block`/`item`이 재렌더로 stale → id로 재조회(get*ById).
6. 검증: 패널 열림 → 입력 → 적용 → 재렌더 후 유지 → 새로고침 후 유지(저장) → 자식/형제 패널 오염 없음.

> 참고: `cssMacroField` 모듈 자체는 내부 템플릿에서 `.btcp-macro-ta`/`.btcp-textarea`
> 클래스를 **재사용**한다(14660/14664, 15376). 이건 legacy가 아니라 정상.

---

## 후보 5 — 빈 컨테이너 표시 `:has()` 규칙 통합 (부분 완료)

조사 결과 이 5개는 "한 패턴의 5개 복사본"이 아니라 **목적이 다른 3종**:

- **빈 CE+자식 → 에디터 접기**: `.block.block-text:has(...)` (4212, root+판정결과 자식 모두 커버)
  / `.branch-inner-block .bib-item-text:has(...)` (5373, *다른 엘리먼트 구조* `.bib-item-text-ce`)
- **판정결과 자식 padding 보정**: `.roll-result-blocks > .block.block-text.block-child:has(...)`
  (4531 — 위 root 규칙의 컨텍스트 보충)
- **간격 정리(접기 아님)**: `.callout-body:has(...)` 하단 padding(3269). (빈 `.nested-callouts-wrap`
  padding 규칙은 중첩-콜아웃 데드코드 제거 S4에서 삭제됨.)

→ **단일 셀렉터로 병합 불가**(엘리먼트 클래스·결합자가 다름). 렌더 시 마커 클래스 부여 방식은
JS가 빈/자식 상태를 추적·동기화해야 해 stale 버그 위험(우리가 계속 고쳐온 류) → 채택 안 함.

**✅ 한 것 (48fee2d):** `.block.block-text:has(...)` 규칙이 긴 `:has()` 셀렉터를 3회 반복하던 것을
**CSS 네이티브 중첩(`& > ...`)으로 1회**로 합쳐 단일 출처화 + 컨텍스트 상호참조 주석 추가.
헤드리스 computed-style로 접기/펼치기 동작 검증(에러 0). 중첩은 Chrome 120+ 필요(`:has()`는 105+,
사용자 Chrome 149).

**남김(병합 안 함):** 위 사유로 4531·5373·3269는 그대로 둠(3572 `.nested-callouts-wrap` 규칙은 S4에서
삭제, 3269는 S4에서 죽은 item 셀렉터만 트리밍하고 `.nested-callout` live 부분 유지). `:has()` 선언적
접근이 옳음(자동 갱신). 더 손대면 fragility만 증가.

---

## 후보 3 — 블록 트리 접근자 `locate()` 이음새 정리 (이미 통합됨)

조사 결과 **이음새는 이미 수렴되어 있음**. 트리 순회는 `findGenericBlockArrayInfo` **한 곳**뿐이고,
그 위에 목적이 다른 두 래퍼가 있다:

- `getBlockArrayInfo(blockId, cid)` — **id로** 블록 찾기 → `{array,index,block,parent,relation,rootCid,...}`
- `getBlockListByTargetKey(targetKey, cid)` — **주소(root|children|rollResultBlocks)로** 배열 얻기

둘 다 `getRootBlockListByCid`(scenario vs rulebook 챕터) 기반. 타입별 getter
(`getBranch/Roll/Ending/CalloutBlockById`)는 전부 `getGenericBlockById`(→`getBlockArrayInfo`)에 **위임**,
변형 함수(`moveBlock`·`delBlock`·`duplicateBlock`·`dropBlock`·`dropBlockAtTarget`)는 전부 접근자 사용.
**자체 순회/중복 없음** → 합칠 대상이 없다.

- 백로그가 적었던 `getBlockListByCid`는 **존재하지 않는 함수**(추정 오기).
- "~51곳"은 중복 구현이 아니라 정상적인 API 호출자들.
- 두 래퍼는 입력(id vs 주소)·답(블록 위치 vs 컨테이너 배열)이 달라 단일 `locate()`로 합치면
  서로 다른 질의를 뒤섞어 명료성↓·위험↑. **병합 비권장.**

**✅ 한 것 (312d03d):** 유일한 실제 정리 — `getEndingBlockById`의 죽은 fallback 제거
(`getGenericBlockById` 전체 트리 검색의 부분집합 + rb cid에서 잘못된 컨텍스트 반환 가능). 회귀 검증 통과.

---

## 진행 순서 (권장) — 모두 처리됨

1. ✅ **후보 1** — live 패널 전부 이전(엔딩·info-title·branch-inner). 죽은 패널은 제외/일부 제거.
2. ✅ **후보 5** — 빈-CE 접기 규칙 CSS 중첩 단일화(나머지는 목적이 달라 분리 유지).
3. ✅ **후보 3** — 이미 통합 상태 확인 + 죽은 fallback 제거.

**선택적 후속도 완료:** ib-콜아웃 ctx 메뉴 고아 체인 정리(03a8be7), 중첩 대사/텍스트 레거시 렌더
제거(S1~S4, main 머지 d5808da). → **백로그 전 항목 처리 완료.**

> 제약(코덱스 핸드오프 누적): 무관한 untracked `.claude/*` 되돌리지 말 것 ·
> 광범위 포맷팅/리팩터 churn 피할 것 · 검증 끝난 것만 커밋 · 한국어 간결(caveman).
