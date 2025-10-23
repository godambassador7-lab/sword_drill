import React from 'react'
export default function MemoryBible({ learnedCount=0, total=100 }){
  const pct=Math.min(100,Math.round((learnedCount/total)*100))
  return (<div className="card" style={{marginTop:12}}>
    <div className="memory">
      <div className="bible-shell">
        <div className="water" style={{['--level']: pct+'%'}}>
          <div className="wave back"></div><div className="wave front"></div>
        </div>
        <div className="overlay-center">
          <div className="big">{pct}% Complete</div>
          <div className="sub">{learnedCount} / {total} Verses</div>
        </div>
      </div>
      <div className="muted">Complete all verses to earn the title <b>Sword Drill General</b>.</div>
    </div>
  </div>)
}
