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

**⚠️ 남은 고아 (이번엔 미제거 — 체인 추적 필요):** `getIbCalloutNestedRollHtml` 제거로
`openIbCalloutRollCtxMenu`·`openIbCalloutRollResultCtxMenu`가 호출처를 잃었고, 그에 딸린
`moveIbCalloutRoll`·`delIbCalloutRoll`·`updIbCalloutRoll`·`updIbCalloutRollResult`·
`delIbCalloutRollResult`·`editIbCalloutRollResultLabel`도 대부분 고아. **단 주의:**
`addIbCalloutRoll`·`addIbNestedCallout`·`addIbCalloutRollResult`·`getIbCalloutRoll`은
**여전히 live**(ib-콜아웃 항목 우클릭 메뉴 `openIbItemCalloutCtxMenu` ~18819, copy/macro 경로
22531/22791에서 사용)이므로 제거 금지. 고아만 골라내려면 각 함수 참조를 1건씩 재확인할 것.

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

## 후보 5 — 빈 컨테이너 표시 `:has()` 규칙 통합

"CE는 비었지만 자식 블록이 있는" 컨테이너에서 빈 CE 줄을 죽이는 규칙이 컨텍스트별로 흩어짐:

- `.callout-body:has(...)` (3269–3270)
- `.nested-callouts-wrap:not(:has(.nested-callout))` (3572)
- `.block.block-text:has(> .block-text-ce:empty):has(> .block-children-wrap:not([data-empty="1"]))` (4212/4217/4226)
- `.roll-result-blocks > .block.block-text.block-child:has(...)` (4531)
- `.branch-inner-block .bib-item-text:has(> .bib-item-text-ce:empty + ...)` (5373)

공통 패턴: `CE:empty` + `자식-wrap[data-empty!=1]`. 단일 유틸 셀렉터/속성(예: 렌더 시
컨테이너에 `data-ce-empty-collapsed` 부여)로 모으면 중복 5곳 → 1곳. **위험:** 컨텍스트마다
직계 구조가 미묘하게 달라(`>` 결합자, `+` 인접) 한 번에 합치면 특정 컨텍스트만 깨질 수 있다.
컨텍스트별 회귀 육안 확인 필수.

---

## 후보 3 — 블록 트리 접근자 `locate()` 이음새 정리

트리 탐색/배열 획득이 여러 접근자로 분산(약 51곳):
`getBlockArrayInfo` · `findGenericBlockArrayInfo` · `getBlockListByTargetKey` ·
`getBlockListByCid` · `getRootBlockListByCid`. 단일 `locate(target) → { array, index, parent, cid }`
이음새로 수렴시키는 것이 목표. **가장 위험** — drag/drop, 정규화, 히스토리가 모두 의존.
프리뷰 + 광범위 회귀 없이는 착수 비권장.

---

## 진행 순서 (권장)

1. **후보 1** — 패널 단위로 1개씩 이전 → 매번 검증/커밋(작은 단위, 롤백 쉬움).
2. **후보 5** — 컨텍스트별 회귀 확인하며 통합.
3. **후보 3** — 마지막. 프리뷰+회귀 충분할 때만.

> 제약(코덱스 핸드오프 누적): 무관한 untracked `.claude/*` 되돌리지 말 것 ·
> 광범위 포맷팅/리팩터 churn 피할 것 · 검증 끝난 것만 커밋 · 한국어 간결(caveman).
