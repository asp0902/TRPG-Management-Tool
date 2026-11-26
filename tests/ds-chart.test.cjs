const fs = require('fs'), path = require('path'), vm = require('vm');
const html = fs.readFileSync(path.join(__dirname, '..', 'TRPG 작업 관리 도구.html'), 'utf8').split(String.fromCharCode(13, 10)).join(String.fromCharCode(10));
let f = 0; const ok = (c, m) => { if (!c) { f++; console.log('FAIL', m); } else console.log('ok', m); };
let n = 0; const ctx = { mkId: () => 'n' + (++n) }; vm.createContext(ctx);
const cut = (a, b) => html.slice(html.indexOf(a), html.indexOf(b));
vm.runInContext(cut('function ds_parseNumber', 'function ds_sortValue') + cut('function ds_cfColor', 'function ds_normCf') + cut('function ds_floatPos', 'function ds_floatCard') + cut('var DS_CHART_TYPES', 'function ds_chartMatrix'), ctx);
const J = JSON.stringify;
const d = ctx.ds_chartData([['이름', 'HP', '비고', 'MP'], ['고블린', '10', '', '1'], ['용', '1,000', '', 'x']]);
ok(J(d.labels) === '["고블린","용"]' && J(d.series.map(s => s.name)) === '["HP","MP"]' && J(d.series[0].values) === '[10,1000]' && J(d.series[1].values) === '[1,null]', '머리글·항목 열 추정, 숫자 없는 열 제외');
const d2 = ctx.ds_chartData([['a', '1'], ['b', '2']]);
ok(J(d2.labels) === '["a","b"]' && d2.series[0].name === '계열 1', '머리글이 없으면 계열 번호');
ok(J(ctx.ds_chartData([['3'], ['4']])) === '{"labels":["1","2"],"series":[{"name":"계열 1","values":[3,4]}]}' && ctx.ds_chartData([]).series.length === 0, '열 하나·빈 범위');
ok(J(ctx.ds_niceTicks(0, 100, 5)) === '[0,20,40,60,80,100]' && ctx.ds_niceTicks(-7, 3, 5)[0] <= -7 && J(ctx.ds_niceTicks(0, 0, 5)) === '[0,0.2,0.4,0.6,0.8,1]', '눈금: 0 포함·음수·모두 0');
const norm = ctx.ds_normCharts([{ rows: ['r', 'x'], cols: ['a'], type: 'zzz', w: 1, h: 99999, color: 'red' }, { rows: [], cols: ['a'] }], [{ id: 'r' }], [{ id: 'a' }]);
ok(norm.length === 1 && norm[0].type === 'bar' && norm[0].w === 240 && norm[0].h === 1200 && norm[0].color === '' && norm[0].legend === true && J(norm[0].rows) === '["r"]', '정규화');
const evil = { labels: ['<script>alert(1)</script>', 'b"'], series: [{ name: '<img onerror=1>', values: [3, -2] }] };
for (const type of ['bar', 'line', 'pie', 'scatter']) {
  const svg = ctx.ds_chartSvg({ type, title: '<b>&', legend: true, color: '' }, evil, 400, 260);
  ok(svg.startsWith('<svg') && svg.endsWith('</svg>') && !/<script|<img|<b>/.test(svg) && !/NaN|Infinity|undefined/.test(svg), type + ': 글자 이스케이프·잘못된 좌표 없음');
}
const bar = ctx.ds_chartSvg({ type: 'bar', legend: false }, { labels: ['a', 'b'], series: [{ name: 's', values: [1, 2] }] }, 300, 200);
ok((bar.match(/<rect /g) || []).length === 3, '막대 2개(+배경)');
ok(/<circle/.test(ctx.ds_chartSvg({ type: 'pie' }, { labels: ['a'], series: [{ name: 's', values: [5] }] }, 300, 200)) && /양수 값이 없습니다/.test(ctx.ds_chartSvg({ type: 'pie' }, { labels: ['a'], series: [{ name: 's', values: [-1] }] }, 300, 200)) && /표시할 숫자가 없습니다/.test(ctx.ds_chartSvg({ type: 'bar' }, { labels: [], series: [] }, 300, 200)), '원형 100%·양수 없음·빈 데이터 안내');
ok(/charts: ds_normCharts/.test(html) && /ds_chartPaint\(\); \/\/ 차트/.test(html) && /'ds_addChart\(\)'/.test(html) && /clone\.charts \|\| \[\]/.test(html), '저장·렌더·메뉴·시트 복제 연결');
process.exit(f ? 1 : 0);
