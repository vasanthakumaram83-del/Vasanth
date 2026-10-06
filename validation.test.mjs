import test from 'node:test';
import assert from 'node:assert/strict';
import {validateState} from './api/_validation.mjs';
const empty=()=>({tasks:[],journals:{},sleep:{},recovery:[],ledger:[],settings:{recoveryMode:'normal'},reminders:{}});
test('cloud data accepts an in-range task and journal entry',()=>{const s=empty();s.tasks.push({date:'2026-09-30',id:'early',status:'Completed',actual:1,content:'Algebra'});s.journals['2026-09-30']={fields:['Studied algebra']};assert.equal(validateState(s),s)});
test('cloud data rejects dates outside the fixed plan',()=>{const s=empty();s.sleep['2027-10-01']={duration:7};assert.throws(()=>validateState(s),/outside the plan/)});
test('cloud data rejects impossible task durations and unknown tasks',()=>{const s=empty();s.tasks.push({date:'2027-09-30',id:'early',status:'Completed',actual:1.25});assert.throws(()=>validateState(s),/duration/);s.tasks[0].id='unplanned';assert.throws(()=>validateState(s),/Unknown task/)});
test('cloud data rejects invalid ledger entries',()=>{const s=empty();s.ledger.push({date:'2026-10-01',type:'excuse',hours:-1});assert.throws(()=>validateState(s),/Ledger hours/)});
