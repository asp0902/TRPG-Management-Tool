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

→ **ib-콜아웃 nested-roll 레거시 잔재 데드코드 정리 전부 완료.** 남은 후속은 중첩 대사/텍스트
레거시 렌더 제거(옛 nestedCallouts→children 마이그레이션 선행 필요)뿐.

**미제거(레거시 렌더 유지):** 중첩 대사/텍스트(`mkNestedSpeech/TextHtml`,
`toggle/applyNestedSpeech·TextCss`)는 `normalizeCalloutNestedItems`가 speech/text를 보존해
옛 `block.nestedCallouts` 데이터에서 **여전히 렌더**됨 → 데드 아님. 제거하려면 먼저 옛
nestedCallouts speech/text를 generic children으로 옮기는 마이그레이션을 추가해야 함.

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
- **간격 정리(접기 아님)**: `.callout-body:has(...)` 하단 padding(3269), 빈 `.nested-callouts-wrap` padding(3572)

→ **단일 셀렉터로 병합 불가**(엘리먼트 클래스·결합자가 다름). 렌더 시 마커 클래스 부여 방식은
JS가 빈/자식 상태를 추적·동기화해야 해 stale 버그 위험(우리가 계속 고쳐온 류) → 채택 안 함.

**✅ 한 것 (48fee2d):** `.block.block-text:has(...)` 규칙이 긴 `:has()` 셀렉터를 3회 반복하던 것을
**CSS 네이티브 중첩(`& > ...`)으로 1회**로 합쳐 단일 출처화 + 컨텍스트 상호참조 주석 추가.
헤드리스 computed-style로 접기/펼치기 동작 검증(에러 0). 중첩은 Chrome 120+ 필요(`:has()`는 105+,
사용자 Chrome 149).

**남김(병합 안 함):** 위 사유로 4531·5373·3269·3572는 그대로 둠. `:has()` 선언적 접근이 옳음
(자동 갱신). 더 손대면 fragility만 증가.

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

**남은 선택적 후속:** ib-콜아웃 ctx 메뉴 고아 체인 정리(참조 1건씩 추적), 중첩 대사/텍스트
레거시 렌더 제거(옛 nestedCallouts→children 마이그레이션 선행 필요).

> 제약(코덱스 핸드오프 누적): 무관한 untracked `.claude/*` 되돌리지 말 것 ·
> 광범위 포맷팅/리팩터 churn 피할 것 · 검증 끝난 것만 커밋 · 한국어 간결(caveman).
