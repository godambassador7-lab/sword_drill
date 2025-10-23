import React from 'react'
export default function Achievements({ tokens=0, learnedCount=0 }){
  const goals=[
    {id:'a1',name:'First Steps',need:5,have:learnedCount},
    {id:'a2',name:'Diligent',need:20,have:learnedCount},
    {id:'a3',name:'Word Hoarder',need:200,have:tokens}
  ]
  return (<div className="card" style={{marginTop:12}}>
    <b>Achievements</b>
    <div className="list" style={{marginTop:10}}>
      {goals.map(g=>{
        const pct=Math.min(100,Math.round((g.have/g.need)*100))
        return (<div key={g.id} className="item">
          <div style={{display:'flex',justifyContent:'space-between'}}>
            <div>{g.name}</div><div className="muted">{pct}%</div>
          </div>
          <div style={{height:8,background:'rgba(255,255,255,.06)',border:'1px solid rgba(255,255,255,.12)',borderRadius:999,overflow:'hidden',marginTop:6}}>
            <div style={{width:pct+'%',height:'100%',background:'linear-gradient(90deg,#ffe9a9,#d9aa2b)'}}/>
          </div>
        </div>)
      })}
    </div>
  </div>)
}
