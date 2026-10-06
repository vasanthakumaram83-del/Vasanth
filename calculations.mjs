export const PLAN_START='2026-09-30',PLAN_END='2027-09-30',PLAN_DAYS=366,DAILY_LEARNING=7.5;
export function planDay(date){if(date<PLAN_START)return{state:'not-started',day:0};if(date>PLAN_END)return{state:'ended',day:366};return{state:'active',day:Math.floor((Date.parse(date+'T00:00:00Z')-Date.parse(PLAN_START+'T00:00:00Z'))/86400000)+1}}
export function withinPlan(date){return /^\d{4}-\d\d-\d\d$/.test(date)&&date>=PLAN_START&&date<=PLAN_END}
export function dailyGain(actualLearning,recoveredObligation=0){return Math.max(0,actualLearning-DAILY_LEARNING-Math.max(0,recoveredObligation))}
export function gainBalance(dailyGains,excuses){return dailyGains.reduce((a,b)=>a+b,0)-excuses.reduce((a,b)=>a+b,0)}
export function recoveryHours(taskHours,mode='normal'){return taskHours*(mode==='strict'?2:1)}
