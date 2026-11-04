const fs=require("node:fs");
const ts=require("typescript");
const assert=require("node:assert/strict");
const code=ts.transpileModule(fs.readFileSync("src/lib/program-schedule.ts","utf8"),{compilerOptions:{module:ts.ModuleKind.CommonJS}}).outputText;
const result={exports:{}};
new Function("require","exports","module",code)(require,result.exports,result);
const {indiaDate,scheduledPrograms,registrationOpen}=result.exports;
assert.equal(indiaDate(Date.parse("2026-10-12T18:29:59Z")),"2026-10-12");
assert.equal(indiaDate(Date.parse("2026-10-12T18:30:00Z")),"2026-10-13");
const items=[
 {id:"past",is_active:true,start_date:"2026-10-11"},
 {id:"today",is_active:true,start_date:"2026-10-12",program_time:"10:00"},
 {id:"later",is_active:true,start_date:"2026-10-14",program_time:"10:00"},
 {id:"next-late",is_active:true,start_date:"2026-10-13",program_time:"19:00"},
 {id:"next-early",is_active:true,start_date:"2026-10-13",program_time:"09:00"},
 {id:"inactive",is_active:false,start_date:"2026-10-12"},
 {id:"undated",is_active:true,start_date:null},
];
const groups=scheduledPrograms(items,"2026-10-12");
assert.deepEqual(groups.today.map(item=>item.id),["today"]);
assert.deepEqual(groups.upcoming.map(item=>item.id),["next-early","next-late","later"]);
assert.equal(registrationOpen({...items[1],registration_open:false},"2026-10-12"),false);
assert.equal(registrationOpen(items[0],"2026-10-12"),false);
assert.deepEqual(groups.past,[]);
const history=scheduledPrograms([
 ...items,
 {id:"archived",is_active:false,start_date:"2026-10-10"},
],"2026-10-12",true);
assert.deepEqual(history.past.map(item=>item.id),["past","archived"]);
assert.deepEqual(history.upcoming.map(item=>item.id),["next-early","next-late","later"]);
assert.equal(registrationOpen({id:"archived",is_active:false,start_date:"2026-10-10"},"2026-10-12"),false);
console.log("PASS: India midnight, actual-date categorization, future sorting, inactive/past exclusion, and registration closure.");
