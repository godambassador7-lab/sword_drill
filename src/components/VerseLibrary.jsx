import React from 'react'
import { CATEGORIES, VERSE_LIBRARY } from '../data/verses'
export default function VerseLibrary({ currentCat, setCurrentCat, tr='KJV', showApo=true, onTapVerse }){
  const cat=currentCat; const list=cat?(VERSE_LIBRARY[cat]||[]).filter(v=>showApo||!v.apocrypha):[]
  return (<div className="card" style={{marginTop:12}}>
    <div style={{display:'flex',alignItems:'center',gap:10,flexWrap:'wrap'}}>
      <b id="catTitle">{cat||'Library'}</b>
      <span className="muted" id="catCount">{cat?`${list.length} verses • ${tr}`:''}</span>
      <span className="badge">Tap a verse to add to today's drill</span>
    </div>
    <div className="row" style={{marginTop:10}}>
      <div className="card" style={{maxWidth:360}}>
        <b>Categories ({CATEGORIES.length})</b>
        <div className="list" id="catList">
          {CATEGORIES.map(name=>{
            const count=(VERSE_LIBRARY[name]||[]).filter(v=>showApo||!v.apocrypha).length
            return (<div key={name} className="item pill" onClick={()=>setCurrentCat(name)}>
              <div><b>{name}</b><div className="muted" style={{fontSize:12}}>{count} verses</div></div>
            </div>)
          })}
        </div>
      </div>
      <div className="list" id="verseList" style={{flex:'1 1 360px'}}>
        {list.map(v=>{
          const text=v.translations?.[tr] || '[No text available]'
          return (<div key={v.ref} className="item" onClick={()=>onTapVerse?.(v)}>
            <span className={'ref'+(v.apocrypha?' apo':'')}>{v.ref}</span>
            <div className="muted" style={{marginTop:6}}>{text}</div>
          </div>)
        })}
      </div>
    </div>
  </div>)
}
