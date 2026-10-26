const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 첨부 HTML 은 앱 origin 에서 실행되면 안 된다: allow-same-origin 없는 sandbox iframe 의 srcdoc 로만 연다.
const frameTag = html.match(/<iframe id="attach-view-frame"[^>]*>/)?.[0];
assert.ok(frameTag, '첨부 보기용 iframe 이 필요합니다.');
assert.match(frameTag, /sandbox="allow-scripts"/);
assert.ok(!/allow-same-origin|allow-top-navigation|allow-popups|allow-forms/.test(frameTag), 'sandbox 에 앱 권한을 주는 값이 있으면 안 됩니다.');
const openFn = html.match(/async function openAttachmentIsolated\([^]*?\n\}/)?.[0];
assert.ok(openFn);
assert.match(openFn, /setAttribute\('sandbox', 'allow-scripts'\)/);
assert.match(openFn, /frame\.srcdoc = /);
assert.ok(!/createObjectURL|window\.open|location\./.test(openFn), '첨부를 blob: URL 이나 새 창으로 열면 안 됩니다.');
assert.ok(!/allow-same-origin/.test(html.replace(/\/\/[^\n]*|\/\*[^]*?\*\//g, '').replace(frameTag, '')), 'allow-same-origin 은 코드 어디에도 쓰지 않습니다.');
const downloadFn = html.match(/async function downloadAttachment\([^]*?\n\}/)?.[0];
assert.match(downloadFn, /application\/octet-stream/, '다운로드는 형식을 octet-stream 으로 고정해야 합니다.');

console.log('attachment security checks: OK');
