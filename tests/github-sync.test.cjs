const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(index, /location\.replace\('\.\/TRPG%20/, 'GitHub Pages 루트에서 앱 파일로 이동해야 합니다.');
assert.match(html, /id="github-sync-btn"[^>]*onclick="openGitHubSyncModal\(\)"/, 'GitHub 동기화 버튼이 필요합니다.');
assert.match(html, /GITHUB_SYNC_INTERVAL_MS = 5 \* 60 \* 1000/, '원격 업로드는 5분 제한을 사용해야 합니다.');
assert.match(html, /headers: \{ Accept: 'application\/vnd\.github\.raw\+json' \}/, '1MB가 넘는 최신본은 raw 응답으로 읽어야 합니다.');
assert.match(html, /if \(input\.remoteChanged && input\.localChanged\) return 'conflict'/, '양쪽 변경 시 자동 덮어쓰기를 막아야 합니다.');
assert.match(html, /await initGitHubSync\(\);[\s\S]*?loadCustomFonts\(\);/, '화면 렌더 전에 GitHub 최신본을 확인해야 합니다.');

const decisionFunction = html.match(/function getGitHubSyncDecision\(input\) \{[\s\S]*?\n\}/)?.[0];
assert.ok(decisionFunction, '동기화 결정 함수를 찾을 수 없습니다.');
const context = {};
vm.runInNewContext(`${decisionFunction}; decide = getGitHubSyncDecision;`, context);

assert.equal(context.decide({ remoteExists: false, localHasData: true }), 'push');
assert.equal(context.decide({ remoteExists: true, paired: false, localHasData: false }), 'pull');
assert.equal(context.decide({ remoteExists: true, paired: true, remoteChanged: true, localChanged: false }), 'pull');
assert.equal(context.decide({ remoteExists: true, paired: true, remoteChanged: false, localChanged: true }), 'push');
assert.equal(context.decide({ remoteExists: true, paired: true, remoteChanged: true, localChanged: true }), 'conflict');

// #147: 메타데이터 JSON·빈 데이터·크기 불일치는 적용하지 않는다
assert.match(html, /cache: 'no-store',\s*\.\.\.options/, '모든 GitHub 요청은 HTTP 캐시를 쓰지 않아야 합니다.');
assert.match(html, /&raw=\$\{encodeURIComponent\(meta\.sha/, '원본 요청은 메타 요청과 다른 URL 이어야 합니다.');
const guard = ['GITHUB_SYNC_DATA_KEYS', 'validateGitHubSyncRemoteData', 'importPayloadHasData']
  .map(name => html.match(new RegExp(`(?:const ${name} = [^;]*;|function ${name}\\([^]*?\\n\\})`))[0]).join('\n');
const guardContext = {};
vm.runInNewContext(`${guard}; v = validateGitHubSyncRemoteData; has = importPayloadHasData;`, guardContext);
const metaJson = { name: 'x', sha: 'abc', size: 34279679, content: '', encoding: 'none' };
assert.throws(() => guardContext.v(metaJson, { size: 34279679 }, 200), /앱 데이터가 아닙니다/);
assert.throws(() => guardContext.v({}, { size: 10 }, 2), /앱 데이터가 아닙니다/);
assert.throws(() => guardContext.v({ scenarios: [] }, { size: 34279679 }, 41), /크기/);
assert.doesNotThrow(() => guardContext.v({ scenarios: [], records: [] }, { size: 100 }, 40));
assert.doesNotThrow(() => guardContext.v([], { size: 0 }, 2));
assert.equal(guardContext.has({ scenarios: [], records: [] }), false);
assert.equal(guardContext.has({ scenarios: [{}] }), true);
assert.match(html, /토큰이 저장소에 접근할 수 없습니다/);
assert.match(html, /if \(!importPayloadHasData\(payload\)\) \{[\s\S]*?throw new Error/, '빈 결과는 적용하지 않아야 합니다.');
assert.match(html, /if \(!hasGitHubSyncData\(\) && meta\.exists && meta\.size > 1024\)/, '빈 로컬이 원격을 덮어쓰면 안 됩니다.');

console.log('github sync checks: OK');
