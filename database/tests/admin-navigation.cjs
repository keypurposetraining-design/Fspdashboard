const fs = require("node:fs");
const ts = require("typescript");
const assert = require("node:assert/strict");
const source = fs.readFileSync("src/components/shell/nav.ts", "utf8");
const js = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText;
const testModule = { exports: {} };
new Function("require", "exports", "module", js)(require, testModule.exports, testModule);
const nav = testModule.exports;
const admin = nav.groupsForRole("admin").flatMap(group => group.links.map(link => link.href));
assert.deepEqual(admin, ["/admin", "/admin/members", "/admin/payments", "/admin/courses", "/admin/memberships", "/admin/updates", "/admin/audit-logs", "/admin/account"]);
for (const role of ["member", "trainer"]) {
  const links = nav.groupsForRole(role).flatMap(group => group.links);
  assert(links.some(link => link.href === "/dashboard"));
  assert(!links.some(link => link.href.startsWith("/admin")));
}
assert(nav.groupsForRole("super_admin").some(group => group.id === "super-admin"));
console.log("PASS: admin management navigation, member separation, and Super Admin navigation.");
