import React, { useState } from 'react'
import { clean } from '../utils'
function makeFillQ(ref,text){const w=(text||'').split(/\s+/).filter(Boolean);if(w.length<6)return null;const hide=Math.max(1,Math.floor(w.length*0.18));const idxs=new Set();while(idxs.size<hide){idxs.add(Math.floor(Math.random()*w.length))}const ans=[...idxs].map(i=>clean(w[i]));const html=w.map((t,i)=>idxs.has(i)?`<span class="pill" data-m="${clean(t)}">_____</span>`:t).join(' ');return {type:'fill',ref,html,answer:ans,full:text}}
function makeMCQ(ref,text,pool,tr){if(!text)return null;const correct=text;const d=[];for(const v of pool){const t=v.translations?.[tr]||'';if(t&&t!==correct&&d.length<3)d.push(t);if(d.length===3)break}if(d.length<3)return null;const options=[correct,...d].sort(()=>Math.random()-0.5);return {type:'mc',ref,options,answer:correct,full:text}}
function makeRefQ(ref,text){if(!text)return null;return {type:'ref',ref,clue:text,answer:ref,full:text}}
export default function Drill({mode='fill',tr='KJV',pool=[],onAward}){
  const [qi,setQi]=useState(0); const [qs,setQs]=useState([]); const [feedback,setFeedback]=useState(''); const [started,setStarted]=useState(false)
  const start=()=>{ if(!pool.length){setFeedback('Choose a category first');return} let built=[]; if(mode==='fill')built=pool.map(v=>makeFillQ(v.ref,v.translations?.[tr]||'')).filter(Boolean).slice(0,6); if(mode==='mc')built=pool.map(v=>makeMCQ(v.ref,v.translations?.[tr]||'',pool,tr)).filter(Boolean).slice(0,6); if(mode==='ref')built=pool.map(v=>makeRefQ(v.ref,v.translations?.[tr]||'')).filter(Boolean).slice(0,6); setQs(built);setQi(0);setStarted(true);setFeedback('Drill started') }
  const submit=()=>{const q=qs[qi];if(!q)return;let ok=false;if(q.type==='fill'){const inputs=Array.from(document.querySelectorAll('#answerArea input'));ok=inputs.every(i=>clean(i.value)===i.dataset.a)}else if(q.type==='mc'){const sel=Array.from(document.querySelectorAll('#answerArea .pill')).find(p=>p.dataset.selected==='1');ok=!!sel&&sel.dataset.opt===q.answer}else{const val=document.querySelector('#answerArea input')?.value||'';ok=clean(val)===clean(q.ref)} if(ok){onAward?.(q.ref);setFeedback('Correct! +25 Word Tokens')}else{setFeedback(`Not quite. Answer: ${q.full} (${q.ref})`) }}
  const q=qs[qi]
  return (<div className="card">
    <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
      <div className="pill" onClick={start}>Start Drill</div>
      <div className="pill" onClick={()=>setQi(qi>0?qi-1:0)}>◀</div>
      <div className="pill" onClick={()=>setQi(qi<qs.length-1?qi+1:qi)}>Next ▶</div>
      <div className="pill" onClick={submit}>Submit</div>
    </div>
    <div className="item" style={{marginTop:10}}>
      <div id="prompt" className="muted">{!started?'Pick a category, then press “Start Drill”.': q? (q.type==='fill'
       ? <div dangerouslySetInnerHTML={{__html:`<div class='muted'>Complete:</div><div class='pill' style='margin:6px 0'>${q.ref}</div>${q.html}`}}/>
       : q.type==='mc' ? <div><div><b>{q.ref}</b></div><div className="muted" style={{marginTop:6}}>Choose the correct verse text</div></div>
       : <div><div className="muted">Which reference is this?</div><div className="item" style={{marginTop:6}}>{q.clue}</div></div> ) : 'No questions.'}</div>
      <div id="answerArea" style={{marginTop:8}}>
        {q&&q.type==='fill'&& q.answer.map((a,i)=>(<input key={i} placeholder={`Word ${i+1}`} data-a={a}/>))}
        {q&&q.type==='mc'&& q.options.map((opt,i)=>(<div key={i} className="pill" data-opt={opt} onClick={e=>{document.querySelectorAll('#answerArea .pill').forEach(p=>p.style.outline=''); e.currentTarget.style.outline='2px solid rgba(255,255,255,.4)'; e.currentTarget.dataset.selected='1'}} style={{margin:'6px 0'}}>{opt}</div>))}
        {q&&q.type==='ref'&& (<input placeholder="Type the reference (e.g., John 3:16)" data-a={q.ref}/>)}
      </div>
      <div id="feedback" className="muted" style={{marginTop:6}}>{feedback}</div>
    </div>
  </div>)
}
