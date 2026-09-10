const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');
const index = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

assert.match(index, /location\.replace\('\.\/TRPG%20/, 'GitHub Pages 루트에서 앱 파일로 이동해야 합니다.');
assert.match(html, /id="github-sync-btn"[^>]*onclick="openGitHubSyncModal\(\)"/, 'GitHub 동기화 버튼이 필요합니다.');
assert.match(html, /GITHUB_SYNC_INTERVAL_MS = 10 \* 60 \* 1000/, '원격 업로드는 10분 제한을 사용해야 합니다.');
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

console.log('github sync checks: OK');
