const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
const a = html.indexOf("const APP_STATE_META_KEY"), b = html.indexOf('function showAppStateBlockBanner');
const ctx = { snapshotTimer: 1, clearInterval: () => {}, document: undefined };
vm.createContext(ctx); vm.runInContext(html.slice(a, b) + ';this.f={makeStateMeta,appStateUnknownKeys,appStateZeroedCollections,appStateBlock,KNOWN:APP_STATE_KNOWN_KEYS,get blocked(){return appStateBlocked}}', ctx);
const fn = ctx.f;
// 알려진 키 목록이 실제 payload 키를 모두 포함해야 한다(새 키를 추가하고 목록을 잊으면 자기 키를 「모르는 키」로 취급하게 되므로)
const mp = html.slice(html.indexOf('function makeStatePayload'), html.indexOf('function applyStatePayload'));
const payloadKeys = [...mp.matchAll(/^\s{4}(\w+):/gm)].map(m => m[1]);
ok(payloadKeys.length > 20 && payloadKeys.every(k => fn.KNOWN.includes(k)), 'APP_STATE_KNOWN_KEYS 가 makeStatePayload 의 모든 키를 포함(' + payloadKeys.length + '개)');
ok(fn.KNOWN.every(k => payloadKeys.includes(k)), '목록에 payload 에 없는 키가 없음');
// 메타
const meta = fn.makeStateMeta({ version: 3, savedAt: 'T', scenarios: [1, 2], bookmarks: [], x: 'str' });
ok(meta.keys.join() === 'version,savedAt,scenarios,bookmarks,x' && meta.counts.scenarios === 2 && meta.counts.bookmarks === 0 && !('x' in meta.counts) && meta.savedAt === 'T', '메타: 키 목록·배열 컬렉션 항목 수·저장 시각');
// 가드: 메타의 키가 내 payload 에 없으면 구 버전
ok(fn.appStateUnknownKeys(['a', 'b', 'newKey'], { a: 1, b: 2 }).join() === 'newKey', '메타에 있고 내 payload 에 없는 키 → 구 버전 판단');
ok(fn.appStateUnknownKeys(['a'], { a: 1, extra: 2 }).length === 0 && fn.appStateUnknownKeys(null, { a: 1 }).length === 0, '내 payload 가 더 많거나 메타가 없으면 통과(첫 저장·옛 데이터)');
// 컬렉션 0개
ok(fn.appStateZeroedCollections({ counts: { musicTracks: 3, bookmarks: 0, scenarios: 2 } }, { musicTracks: [], bookmarks: [], scenarios: [1] }).join() === 'musicTracks', '항목이 있던 컬렉션이 0개가 되면 감지(원래 0개·그대로인 것은 제외)');
ok(fn.appStateZeroedCollections(null, { a: [] }).length === 0 && fn.appStateZeroedCollections({ counts: { a: 2 } }, { a: null }).length === 0, '메타 없음·배열이 아닌 값은 감지 안 함');
// 차단 상태
fn.appStateBlock('newer-record', ['k']);
ok(fn.blocked && fn.blocked.reason === 'newer-record' && fn.blocked.unknown[0] === 'k', 'appStateBlock: 차단 상태 기록');
// 코드 구조
ok(/store\.put\(payload, APP_STATE_KEY\);\s*store\.put\(makeStateMeta\(payload\), APP_STATE_META_KEY\);/.test(html), '같은 트랜잭션에서 payload·메타 함께 저장');
ok(/if \(appStateBlocked\) throw new Error/.test(html) && /async function saveAppSnapshot\(reason = ''\) \{\s*if \(appStateBlocked\) return false;/.test(html) && /async function runGitHubSync\(options = \{\}\) \{\s*if \(appStateBlocked\) return false;/.test(html) && /async function writeAutoBackup\(options = \{\}\) \{\s*if \(appStateBlocked\) return false;/.test(html), '차단 시 저장·스냅샷·GitHub 동기화·자동 백업 중단');
ok(/Object\.assign\(\{\}, unknownStateKeys, \{\s*version: APP_STATE_SCHEMA_VERSION/.test(html) && /unknownStateKeys\[key\] = raw\[key\]/.test(html), '모르는 키 보관·되돌려 쓰기');
ok(/kind: 'hello', needFull, detachedPage: multiWin\.detachedPage, keys: /.test(html) && /multiPeerIsNewer\(msg\.keys\)/.test(html) && /multiPeerIsNewer\(Object\.keys\(msg\.payload/.test(html) && /multiWin\.releaseLock/.test(html), '여러 창: hello/hi 에 키 목록, full 에도 가드, 구 버전 창은 주 창 락을 놓음');
ok(html.includes('새 버전에서 저장된 데이터입니다. 덮어쓰지 않도록 저장을 멈췄습니다. 새로고침해 주세요.') && html.includes('지금 편집 내용 내보내기'), '배너 문구·내보내기 버튼');
ok(/컬렉션 비워짐: /.test(html) && /protect: true/.test(html), '보호 스냅샷 사유·protect 표시');
process.exit(f ? 1 : 0);
