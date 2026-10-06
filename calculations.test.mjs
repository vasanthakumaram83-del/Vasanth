import test from 'node:test';import assert from 'node:assert/strict';
import{planDay,withinPlan,dailyGain,gainBalance,recoveryHours,PLAN_DAYS}from'./calculations.mjs';
test('inclusive fixed plan has 366 actual calendar dates and correct endpoints',()=>{assert.equal(PLAN_DAYS,366);assert.equal(planDay('2026-09-29').state,'not-started');assert.deepEqual(planDay('2026-09-30'),{state:'active',day:1});assert.deepEqual(planDay('2027-09-30'),{state:'active',day:366});assert.equal(planDay('2027-10-01').state,'ended');assert.equal(withinPlan('2026-09-30'),true);assert.equal(withinPlan('2027-10-01'),false)});
test('learning gain counts only time above 7.5h and confirmed recovery first',()=>{assert.equal(dailyGain(7.5),0);assert.equal(dailyGain(8.5),1);assert.equal(dailyGain(8.5,1),0);assert.equal(dailyGain(9.5,1),1)});
test('normal and strict recovery multipliers are explicit',()=>{assert.equal(recoveryHours(1),1);assert.equal(recoveryHours(.5,'strict'),1)});
test('excuse spending subtracts from gain balance',()=>{assert.equal(gainBalance([1,2],[.5]),2.5);assert.equal(gainBalance([1],[2]),-1)});
