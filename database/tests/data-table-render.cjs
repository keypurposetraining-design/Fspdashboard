const fs = require('node:fs');
const assert = require('node:assert/strict');
const ts = require('typescript');
const React = require('react');
const { renderToStaticMarkup } = require('react-dom/server');

const source = fs.readFileSync('src/components/ui/DataTable.tsx', 'utf8');
const js = ts.transpileModule(source, {
  compilerOptions: { module: ts.ModuleKind.CommonJS, jsx: ts.JsxEmit.ReactJSX, esModuleInterop: true },
}).outputText;
const testModule = { exports: {} };
const load = (name) => name === '@/lib/utils'
  ? { cn: (...values) => values.filter(Boolean).join(' ') }
  : require(name);
new Function('require', 'exports', 'module', js)(load, testModule.exports, testModule);
const { DataTable } = testModule.exports;
const columns = [
  { key: 'name', header: 'Name', cell: row => row.name },
  { key: 'role', header: 'Role', sortKey: 'role', cell: row => row.role },
];
const props = { columns, rows: [{ id: '1', name: 'Admin', role: 'super_admin' }], rowKey: row => row.id };
const render = extra => renderToStaticMarkup(React.createElement(DataTable, { ...props, ...extra }));

assert(!render().includes('aria-sort='));
for (const [desc, direction] of [[false, 'ascending'], [true, 'descending']]) {
  const html = render({ sort: { key: 'role', desc }, onSortChange: () => {} });
  assert(html.includes(`aria-sort="${direction}"`));
  assert.equal((html.match(/aria-sort=/g) || []).length, 1);
}
assert(!render({ sort: { key: 'missing', desc: true } }).includes('aria-sort='));
console.log('PASS: unsorted tables render; only the selected sortable column announces its direction.');
