const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8');

// 조합 중 keydown 은 문서 캡처 단계에서 막는다(인라인 onkeydown 포함).
assert.match(html, /document\.addEventListener\('keydown', e => \{\s*if \(isImeComposing\(e\)\) e\.stopImmediatePropagation\(\);[\s\S]*?\}, true\);/);
assert.match(html, /document\.addEventListener\('compositionstart'[\s\S]*?\}, true\);/);
assert.match(html, /document\.addEventListener\('compositionend'[\s\S]*?\}, true\);/);
assert.match(html, /if \(options\.automatic\) await waitForTypingIdle\(\);/, '자동 동기화 적용 전에 입력이 멈출 때까지 기다려야 합니다.');

// isImeComposing 판정
const fn = html.match(/function isImeComposing\(e\) \{[^]*?\n\}/)[0];
const ctx = { imeComposing: false, imeStartedAt: 0, imeEndedAt: -1e9, performance: { now: () => 1000 } };
vm.runInNewContext(`${fn}; this.check = isImeComposing;`, ctx);
const ev = (o = {}) => ({ type: 'keydown', key: 'Enter', isComposing: false, keyCode: 13, ...o });
assert.equal(ctx.check(ev()), false, '일반 Enter 는 조합이 아니다');
assert.equal(ctx.check(ev({ isComposing: true })), true);
assert.equal(ctx.check(ev({ keyCode: 229 })), true, 'keyCode 229 는 IME 입력이다');
ctx.imeComposing = true; ctx.imeStartedAt = 900;
assert.equal(ctx.check(ev()), true, '조합 플래그가 켜져 있으면 막는다');
ctx.imeStartedAt = 1000 - 21000; // 20초 넘게 켜져 있으면 풀린다(compositionend 를 놓친 경우)
assert.equal(ctx.check(ev()), false);
ctx.imeComposing = false; ctx.imeEndedAt = 990; // Safari: compositionend 직후 Enter
assert.equal(ctx.check(ev()), true);
assert.equal(ctx.check(ev({ key: 'a' })), false);
ctx.imeEndedAt = 900;
assert.equal(ctx.check(ev()), false);

assert.match(html, /document\.addEventListener\('blur', deferFocusEvent, true\);\s*document\.addEventListener\('focusout', deferFocusEvent, true\);/, '조합 중 blur·focusout 은 조합 확정 뒤로 미뤄야 합니다.');
assert.match(html, /if \(!e\.isTrusted \|\| !imeComposing/, '다시 보낸 합성 이벤트는 미루지 않아야 합니다.');

console.log('ime guard checks: OK');
