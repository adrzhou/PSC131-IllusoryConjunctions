import {makeSubmission,sendResults} from './submission.js';
import {LETTERS,COLORS,shuffle,makeTrial,classify,summarize,toCSV} from './logic.js';
const $=id=>document.getElementById(id);
const panels=['ready','display','digit-form','letter-form','interrupted'];
let records=[],schedule=[],index=0,current=null,active=false,phase='idle',frame=0,requested=200,interruptions=0,sessionId='',student={firstName:'',lastName:'',email:''};
let submissionState='idle';
const canvas=$('stimulus'),ctx=canvas.getContext('2d');
for(let i=0;i<3;i++) {
  const row=document.createElement('div');row.className='report-row';
  row.innerHTML=`<span>${i+1}</span><label for="letter-${i}">Letter<select id="letter-${i}"><option value="">Unsure / no report</option>${LETTERS.map(l=>`<option>${l}</option>`).join('')}</select></label><label for="color-${i}">Color<select id="color-${i}"><option value="">Unsure / no report</option>${COLORS.map(c=>`<option>${c.name}</option>`).join('')}</select></label>`;
  $('report-rows').append(row);
}
function panel(id) {panels.forEach(p=>$(p).hidden=p!==id);document.body.classList.toggle('running',id==='display');}
function focus(id) {$(id).focus({preventScroll:true});}
function begin() {
  records=[];index=0;interruptions=0;requested=200;submissionState='idle';
  sessionId=globalThis.crypto?.randomUUID?.()||String(Date.now());
  schedule=shuffle(Array.from({length:32},(_,i)=>i%2?'focused':'divided'));
  active=true;$('intro').hidden=true;$('results').hidden=true;$('session').hidden=false;$('instructor').open=false;$('instructor').hidden=true;
  window.scrollTo(0,0);ready();
}
function ready() {
  phase='ready';current=makeTrial(schedule[index]);current.practice=false;current.requestedMs=requested;current.digitResponse=['',''];
  $('progress').textContent=`SESSION / TRIAL ${index+1} OF ${schedule.length}`;
  $('bar').style.width=(index/schedule.length*100)+'%';
  const divided=current.condition==='divided';
  $('condition').textContent=divided?'DIGITS FIRST':'LETTERS ONLY';
  $('ready-title').textContent=divided?'Prioritize the two digits.':'Focus on the colored letters.';
  $('ready-instruction').textContent=divided?'Remember the black digits from left to right. You’ll report them first, then any colored letters you remember.':'Remember which letters and colors belong together. Ignore the black digits. You’ll report only the colored letters.';
  panel('ready');window.scrollTo(0,0);focus('show');
}
function clear() {ctx.fillStyle='#fff';ctx.fillRect(0,0,1000,400);}
function fixation() {clear();ctx.strokeStyle='#18262b';ctx.lineWidth=3;ctx.beginPath();ctx.moveTo(490,200);ctx.lineTo(510,200);ctx.moveTo(500,190);ctx.lineTo(500,210);ctx.stroke();}
function stimulus() {
  clear();ctx.textAlign='center';ctx.textBaseline='middle';ctx.font='bold 82px Arial, sans-serif';
  current.items.forEach((x,i)=>{ctx.fillStyle=COLORS.find(c=>c.name===x.color).hex;ctx.fillText(x.letter,350+i*150,200);});
  ctx.fillStyle='#151515';ctx.fillText(current.digits[0],150,200);ctx.fillText(current.digits[1],850,200);
}
function createMask() {
  const mask=document.createElement('canvas');mask.width=1000;mask.height=400;
  const m=mask.getContext('2d');m.fillStyle='#fff';m.fillRect(0,0,1000,400);
  const palette=['#151515',...COLORS.map(c=>c.hex)];
  for(let i=0;i<750;i++){m.strokeStyle=palette[i%palette.length];m.lineWidth=2+Math.random()*3;m.beginPath();const x=90+Math.random()*820,y=125+Math.random()*150;m.moveTo(x,y);m.lineTo(x+Math.random()*26-13,y+Math.random()*26-13);m.stroke();}
  return mask;
}
function show() {
  if(phase!=='ready')return;
  if(document.hidden || !document.hasFocus())return;
  const mask=createMask();phase='fixation';panel('display');
  let start,stimStart,maskStart;
  function tick(t) {
    if(phase==='fixation') {if(start===undefined){start=t;fixation();}if(t-start>=650){stimulus();stimStart=t;phase='stimulus';}}
    else if(phase==='stimulus' && t-stimStart>=requested){current.actualMs=t-stimStart;ctx.drawImage(mask,0,0);maskStart=t;phase='mask';}
    else if(phase==='mask' && t-maskStart>=200){clear();phase='response';if(current.condition==='divided'){ $('digit-form').reset();panel('digit-form');focus('left-digit');}else letters();return;}
    frame=requestAnimationFrame(tick);
  }
  frame=requestAnimationFrame(tick);
}
function letters() {$('letter-form').reset();$('report-error').textContent='';panel('letter-form');focus('letter-0');}
function interrupt(reason) {
  if(!['fixation','stimulus','mask'].includes(phase))return;
  cancelAnimationFrame(frame);interruptions++;phase='interrupted';clear();$('interruption-reason').textContent=reason;panel('interrupted');focus('retry');
}
document.addEventListener('visibilitychange',()=>{if(document.hidden)interrupt('The tab was hidden during the display.');});
window.addEventListener('blur',()=>interrupt('The window lost focus during the display.'));
window.addEventListener('resize',()=>interrupt('The window size changed during the display.'));
$('retry').onclick=ready;$('show').onclick=show;
$('student-form').onsubmit=e=>{
  e.preventDefault();
  for(const id of ['first-name','last-name','email']) {
    const field=$(id);field.value=field.value.trim();
    if(!field.checkValidity()){field.reportValidity();return;}
  }
  student={firstName:$('first-name').value,lastName:$('last-name').value,email:$('email').value};
  begin();
};
$('digit-form').onsubmit=e=>{e.preventDefault();current.digitResponse=[$('left-digit').value,$('right-digit').value];letters();};
$('letter-form').onsubmit=e=>{
  e.preventDefault();const reports=Array.from({length:3},(_,i)=>({letter:$('letter-'+i).value,color:$('color-'+i).value}));
  const letters=reports.map(x=>x.letter).filter(Boolean),colors=reports.map(x=>x.color).filter(Boolean);
  if(new Set(letters).size<letters.length || new Set(colors).size<colors.length){$('report-error').textContent='Each letter and each color can be reported once. Use “unsure” if you cannot distinguish the items.';return;}
  current.reports=reports;current.interruptions=interruptions;interruptions=0;records.push(current);
  next();
};
function pair(x) {return (x.color||'?')+' '+(x.letter||'?');}
function next(){index++;if(index<schedule.length)ready();else finish(false);}
function finish(early){active=false;phase='idle';cancelAnimationFrame(frame);document.body.classList.remove('running');$('session').hidden=true;$('results').hidden=false;$('instructor').hidden=false;
  $('result-note').textContent=`${records.length} of ${schedule.length} scored trials completed${early?' (session ended early)':''}. Recombined reports can happen, but they are not guaranteed. These descriptive results do not distinguish perception from guessing or memory errors.`;
  const total=summarize(records);
  $('summary').innerHTML=`<div class="stats"><div class="stat"><strong>${total.recombined}</strong><span>Recombined pairs</span></div><div class="stat"><strong>${total.correct}</strong><span>Correct pairs</span></div><div class="stat"><strong>${total.feature_error}</strong><span>Feature errors</span></div></div><div class="card" style="margin-top:24px"><h2>Compare the two tasks</h2><div class="table-wrap"><table><thead><tr><th>Condition</th><th>Trials</th><th>Complete pairs</th><th>Recombined / complete</th><th>Partial / blank slots</th><th>Digits correct</th></tr></thead><tbody>${['divided','focused'].map(c=>{const s=summarize(records,c);return `<tr><td>${c==='divided'?'Digits first':'Letters only'}</td><td>${s.trials}</td><td>${s.complete}</td><td>${s.recombined} / ${s.complete} (${s.rate===null?'—':Math.round(s.rate*100)+'%'})</td><td>${s.partial} / ${s.blank}</td><td>${s.digitTotal?s.digitCorrect+' / '+s.digitTotal:'Not requested'}</td></tr>`;}).join('')}</tbody></table></div><p class="muted">Rate denominator: complete letter–color reports, including feature errors. Each trial has three report slots. Partial reports and blanks are excluded from that rate. No significance test is implied.</p></div>`;
  $('trial-review').innerHTML='<table><thead><tr><th>Trial / task</th><th>Shown pairs</th><th>Your reports (category)</th><th>Exposure estimate</th></tr></thead><tbody>'+records.map((r,i)=>`<tr><td>${i+1} / ${r.condition==='divided'?'digits first':'letters only'}</td><td>${r.items.map(pair).join(' · ')}</td><td>${r.reports.map(p=>pair(p)+' ('+classify(p,r.items).replaceAll('_',' ')+')').join(' · ')}</td><td>${r.actualMs.toFixed(1)} ms</td></tr>`).join('')+'</tbody></table>';
  $('download').disabled=!records.length;
  $('submit-results').disabled=!records.length;
  $('submit-results').hidden=false;
  $('submit-results').textContent='Submit completed trials';
  $('submission-status').textContent=records.length
    ? 'These results have not been submitted. You can submit completed trials or download a CSV.'
    : 'No completed trials to submit.';
  window.scrollTo(0,0);focus('download');
  if(!early && records.length===32) submitResults();
}
async function submitResults() {
  if (submissionState==='pending' || submissionState==='saved' || !records.length) return;
  // Serialize before any asynchronous work so a retry uses this session's data.
  const payload=makeSubmission(sessionId,student,records);
  submissionState='pending';
  $('submit-results').disabled=true;
  $('again').disabled=true;
  $('submission-status').textContent='Submitting your results to the course Google Sheet. Please keep this page open…';
  try {
    await sendResults(payload);
    submissionState='saved';
    $('submission-status').textContent='Your results were saved to the course Google Sheet. You can also download a CSV copy.';
    $('submit-results').hidden=true;
  } catch {
    submissionState='unconfirmed';
    $('submission-status').textContent='We could not confirm that your results were saved. The connection may require sign-in or may be unavailable. Download your CSV as a backup, then retry or give the CSV to your instructor. Retrying uses the same session ID to avoid duplicate rows.';
    $('submit-results').textContent='Retry submission';
    $('submit-results').disabled=false;
  } finally {
    $('again').disabled=false;
  }
}
$('submit-results').onclick=submitResults;
$('quit').onclick=()=>{if(!active)return;if(!confirm('End this session? Completed trials will remain available to download.'))return;finish(true);};
$('again').onclick=()=>{if(submissionState==='pending')return;if(records.length && submissionState!=='saved' && !confirm('Your results have not been confirmed as saved. Download your CSV before starting a new session. Continue?'))return;$('results').hidden=true;$('intro').hidden=false;$('instructor').hidden=true;$('student-form').reset();focus('first-name');};
$('download').onclick=()=>{const blob=new Blob(['\ufeff'+toCSV(records,sessionId,student)],{type:'text/csv;charset=utf-8'});const url=URL.createObjectURL(blob);const a=document.createElement('a');a.href=url;a.download='psc131-illusory-conjunctions-'+sessionId+'.csv';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
window.addEventListener('beforeunload',e=>{if(active || records.length){e.preventDefault();e.returnValue='';}});
