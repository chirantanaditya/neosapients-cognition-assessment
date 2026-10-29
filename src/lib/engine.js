/* Pure assessment rules. No personal data is persisted or transmitted. */
'use strict';
 const baseline=[
  {id:'B1',topic:'Your AI landscape',key:'agents',q:'How many AI agents do you run in production today?',opts:['None yet','1–5','6–20','More than 20']}
 ];
 const priorities=[
 ['Finding the right first use case','Start where decisions repeat.','Pick a high-volume, rules-heavy workflow with clear outcomes, such as onboarding or exceptions handling, and prove value there first.'],
 ['Proving ROI to leadership','Define the outcome before the agent.','Agree the business metric up front and record every agent outcome against it, so ROI is evidence, not a forecast.'],
 ['Data scattered across systems','Build the context layer first.','Connect your highest-value domains into one governed context layer before building agents on top of it.'],
 ['Security and data-access concerns','Enforce access outside the agent.','Apply entitlements per user, record, and action in an independent layer, so no agent inherits broad system access.'],
 ['Regulatory and compliance approval','Design for the examiner from day one.','Bring risk and compliance in early, and encode their limits as Policy-as-code your agents cannot bypass.'],
 ['Explaining agent decisions to auditors','Record every decision in an Outcome Ledger.','Capture inputs, reasoning, approvals, and outcomes in an immutable record you can produce on demand.'],
 ['Risk of agents taking wrong actions','Gate actions by risk.','Tier actions by risk, halt on threshold breach, and escalate to a named owner before anything executes.'],
 ['Choosing models and vendors','Stay model-agnostic.','Keep context, memory, and policy outside the model so you can adopt or replace any model without rebuilding.'],
 ['Skills and talent gaps','Give teams a governed foundation.','Let business teams build on shared context, controls, and evaluation instead of solving them again for every project.'],
 ['Integrating with legacy core systems','Connect, don’t replace.','Wrap core systems with governed access so agents work alongside them without a core migration.']
 ];
 function path(answer){return answer===0?'none':'full';}
 function steps(answer,questions){
  const priorityStep={id:'R1',kind:'rank',topic:'Your priorities',q:'What’s holding you back? Pick at least 3 challenges in order of importance.'};
  return path(answer)==='none'?[baseline[0],priorityStep]:[baseline[0],...questions.map(q=>({...q,kind:'scored',q:'Which statement is closest to how your AI agents operate today?'})),priorityStep];
 }
 function priorityActions(ranking){return ranking.map(i=>{const p=priorities[i];return {topic:p[0],title:p[1],body:p[2]};});}
 function score(answers,questions,tiers){if(questions.some(q=>![0,1].includes(answers[q.id])))throw Error('Complete all ten scored questions first.');const points=questions.map(q=>+(answers[q.id]===q.strong));const total=points.reduce((a,b)=>a+b,0)*10;return {total,gap:100-total,tier:tiers.filter(t=>total>=t.min).at(-1),pillars:['Knowledge','Memory','Governance'].map(name=>{const indexes=questions.map((q,i)=>q.pillar===name?i:-1).filter(i=>i>=0);return {name,pct:Math.round(indexes.reduce((n,i)=>n+points[i],0)/indexes.length*100)};}),actions:questions.map((q,i)=>({...q,index:i})).filter((q,i)=>!points[i]).reverse().map(q=>({topic:q.topic,title:q.rec[0],body:q.rec[1],pillar:q.pillar}))};}
export {baseline,priorities,path,steps,score,priorityActions};
