import React, { useMemo, useState } from 'react'
import { useStorage } from './hooks/useStorage'
import VerseLibrary from './components/VerseLibrary'
import Drill from './components/Drill'
import MemoryBible from './components/MemoryBible'
import Achievements from './components/Achievements'
import { VERSE_LIBRARY } from './data/verses'

export default function App(){
  const [tr,setTr]=useStorage('sd.tr','KJV')
  const [showApo,setShowApo]=useStorage('sd.apo',true)
  const [mode,setMode]=useStorage('sd.mode','fill')
  const [tokens,setTokens]=useStorage('sd.tokens',0)
  const [learned,setLearned]=useStorage('sd.learned',[])
  const [cat,setCat]=useState(null)
  const learnedSet=useMemo(()=>new Set(learned),[learned])
  const learnedCount=learnedSet.size
  const rank= learnedCount>=100?'Sword Drill General': learnedCount>=75?'Champion': learnedCount>=50?'Elder': learnedCount>=35?'Ambassador': learnedCount>=20?'Disciple': learnedCount>=10?'Scribe': learnedCount>=5?'Page':'Initiate'
  const pool=cat?(VERSE_LIBRARY[cat]||[]).filter(v=>showApo||!v.apocrypha):[]
  const onAward=(ref)=>{ setTokens(tokens+25); if(!learnedSet.has(ref)) setLearned([...learned,ref]) }
  return (<div className="app">
    <div className="titlebar">
      <div className="crest" title="Sword Drill"><img src="/icons/sworddrill_crest.png" alt="SD crest"/></div>
      <div className="title">Sword Drill</div>
    </div>
    <div className="gold-divider"></div>
    <div className="row">
      <div className="card grow">
        <div style={{display:'flex',gap:10,alignItems:'center',flexWrap:'wrap'}}>
          <span className="badge">Word Tokens: <b>{tokens}</b></span>
          <span className="badge">Rank: <b>{rank}</b></span>
          <span className="badge">Translation:
            <select value={tr} onChange={e=>setTr(e.target.value)}>
              <option>KJV</option><option>LXX</option><option>DRB</option><option>WEB</option>
              <option>NIV</option><option>ESV</option><option>NRSV</option><option>CEB</option><option>CSin</option>
            </select>
          </span>
          <span className="badge"><label><input type="checkbox" checked={!!showApo} onChange={e=>setShowApo(e.target.checked)}/> Show Apocrypha ✨</label></span>
          <span className="badge">Mode:
            <select value={mode} onChange={e=>setMode(e.target.value)}>
              <option value="fill">Fill-in-the-Blank</option>
              <option value="mc">Multiple Choice</option>
              <option value="ref">Reference Recall</option>
            </select>
          </span>
        </div>
        <div style={{marginTop:12}}><Drill mode={mode} tr={tr} pool={pool} onAward={onAward}/></div>
      </div>
      <div style={{flex:'1 1 360px'}}>
        <VerseLibrary currentCat={cat} setCurrentCat={setCat} tr={tr} showApo={showApo} onTapVerse={(v)=>{}}/>
      </div>
    </div>
    <MemoryBible learnedCount={learnedCount} total={100}/>
    <Achievements tokens={tokens} learnedCount={learnedCount}/>
    <div className="footer">Sword Drill — <b>v3.0 React PWA</b></div>
  </div>)
}
