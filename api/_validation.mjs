export const start='2026-09-30', end='2027-09-30';
const tasks={early:1,run:.5,workout:.25,yoga:.25,morning:1,current:.5,evening1:2,evening2:1,english:.5,night:1.5};
const statuses=new Set(['Not started','Completed','Partially Completed','Missed']);
const inRange=d=>typeof d==='string'&&/^\d{4}-\d\d-\d\d$/.test(d)&&d>=start&&d<=end;
function assert(ok,msg){if(!ok)throw new Error(msg)}
function string(v,max,label){assert(typeof v==='string'&&v.length<=max,`${label} is invalid or too long.`)}
export function validateState(s){
  assert(s&&typeof s==='object'&&!Array.isArray(s),'Backup data must be an object.');
  assert(Array.isArray(s.tasks)&&s.tasks.length<=3660,'Task records are invalid or too many.');
  for(const x of s.tasks){assert(inRange(x.date),'Task date is outside the plan.');assert(Object.hasOwn(tasks,x.id),'Unknown task.');assert(statuses.has(x.status),'Invalid task status.');const h=Number(x.actual||0);assert(Number.isFinite(h)&&h>=0&&h<=tasks[x.id],'Task duration is outside its valid range.');for(const f of ['content','notes'])if(x[f]!=null)string(x[f],5000,f);}
  for(const key of ['journals','sleep']){assert(s[key]&&typeof s[key]==='object'&&!Array.isArray(s[key]),`${key} must be a date map.`);for(const d of Object.keys(s[key]))assert(inRange(d),`${key} contains a date outside the plan.`)}
  for(const [d,j] of Object.entries(s.journals)){assert(Array.isArray(j.fields)&&j.fields.length<=5,'Journal entry is invalid.');for(const f of j.fields)string(f,5000,'Journal field');}
  for(const [d,z] of Object.entries(s.sleep)){const h=Number(z.duration||0);assert(Number.isFinite(h)&&h>=0&&h<=24,'Sleep duration is invalid.');}
  assert(Array.isArray(s.recovery)&&s.recovery.length<=10000,'Recovery ledger is invalid or too large.');for(const r of s.recovery){assert(inRange(r.date)&&Object.hasOwn(tasks,r.taskId),'Recovery record is invalid.');const h=Number(r.hours),done=Number(r.recoveredHours||0);assert(Number.isFinite(h)&&h>=0&&h<=24&&Number.isFinite(done)&&done>=0&&done<=h,'Recovery hours are invalid.');}
  assert(Array.isArray(s.ledger)&&s.ledger.length<=10000,'Gain ledger is invalid or too large.');for(const x of s.ledger){assert(inRange(x.date)&&['gain','excuse'].includes(x.type),'Ledger record is invalid.');const h=Number(x.hours);assert(Number.isFinite(h)&&h>0&&h<=24,'Ledger hours are invalid.');for(const f of ['reason','description'])if(x[f]!=null)string(x[f],1000,f);}
  assert(s.settings&&['normal','strict'].includes(s.settings.recoveryMode),'Recovery setting is invalid.');
  assert(s.reminders&&typeof s.reminders==='object'&&!Array.isArray(s.reminders),'Reminder settings are invalid.');
  return s;
}
