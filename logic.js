export const LETTERS = ['H','K','O','R','T','X'];
export const COLORS = [
  {name:'Red',hex:'#c32535'}, {name:'Blue',hex:'#1462cb'},
  {name:'Green',hex:'#16804a'}, {name:'Purple',hex:'#863daf'}
];
export function shuffle(items, random = Math.random) {
  const a = [...items];
  for (let i=a.length-1;i>0;i--) { const j=Math.floor(random()*(i+1)); [a[i],a[j]]=[a[j],a[i]]; }
  return a;
}
export function makeTrial(condition) {
  const letters=shuffle(LETTERS).slice(0,3), colors=shuffle(COLORS).slice(0,3);
  return {condition, items:letters.map((letter,i)=>({letter,color:colors[i].name})), digits:shuffle('123456789'.split('')).slice(0,2)};
}
export function classify(report, items) {
  if (!report.letter && !report.color) return 'blank';
  if (!report.letter || !report.color) return 'partial';
  if (items.some(x=>x.letter===report.letter && x.color===report.color)) return 'correct';
  if (items.some(x=>x.letter===report.letter) && items.some(x=>x.color===report.color)) return 'recombined';
  return 'feature_error';
}
export function summarize(records,condition) {
  const rows=records.filter(x=>!x.practice && (!condition || x.condition===condition));
  const counts={correct:0,recombined:0,feature_error:0,partial:0,blank:0};
  rows.forEach(r=>r.reports.forEach(p=>counts[classify(p,r.items)]++));
  const complete=counts.correct+counts.recombined+counts.feature_error;
  const digitTrials=rows.filter(r=>r.condition==='divided');
  return {...counts,trials:rows.length,complete,rate:complete?counts.recombined/complete:null,
    digitCorrect:digitTrials.reduce((n,r)=>n+r.digitResponse.filter((d,i)=>d===r.digits[i]).length,0),digitTotal:digitTrials.length*2};
}
export function csvCell(value) {
  let text=String(value??'');
  if (/^[\s]*[=+@-]/.test(text)) text="'"+text;
  return '"'+text.replaceAll('"','""')+'"';
}
export function toCSV(records, session, student = {}) {
  const headers=['session','first_name','last_name','email','trial','practice','condition','requested_ms','frame_estimated_ms','interrupted_attempts','left_digit','right_digit','left_digit_response','right_digit_response','stimulus_left','stimulus_center','stimulus_right','report_slot','letter_response','color_response','classification'];
  const rows=records.flatMap((r,i)=>r.reports.map((p,j)=>[session,student.firstName??'',student.lastName??'',student.email??'',i+1,r.practice,r.condition,r.requestedMs,r.actualMs.toFixed(2),r.interruptions,...r.digits,...r.digitResponse,...r.items.map(x=>x.color+' '+x.letter),j+1,p.letter,p.color,classify(p,r.items)]));
  return [headers,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');
}
