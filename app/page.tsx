"use client";
import { useState, useEffect } from "react";

const TC: Record<string,{bg:string;bdr:string;txt:string;lt:string;label:string}> = {
  Kalo:{bg:"#134e4a",bdr:"#14b8a6",txt:"#5eead4",lt:"#ccfbf1",label:"Kalo (Teal)"},
  Cila:{bg:"#7c2d12",bdr:"#f97316",txt:"#fdba74",lt:"#fff7ed",label:"Cila (Orange)"},
  Vatu:{bg:"#581c87",bdr:"#a855f7",txt:"#c084fc",lt:"#faf5ff",label:"Vatu (Purple)"},
};
const ADMIN_PW = "survivor50admin";

type Cast = {id:string;name:string;tribe:string;status:string;weekOut:number|null};
type Week = {num:number;deadline:string;results:Record<string,string|null>;scored:boolean};
type GameData = {
  cast:Cast[];players:string[];weeks:Week[];
  votes:Record<number,Record<string,Record<string,string>>>;
  winnerPicks:Record<string,{pick1:string;pick2:string;pick3:string;locked:boolean}>;
  seasonWinner:string|null;
};

async function loadData():Promise<GameData> { const r=await fetch("/api/data"); return r.json(); }
async function saveData(d:GameData) { await fetch("/api/data",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify(d)}); }

function getNowET(){const s=new Date().toLocaleString("en-US",{timeZone:"America/New_York"});return new Date(s);}
function beforeDL(dl:string|null){if(!dl) return false;return getNowET()<new Date(dl);}
function fmtDL(d:string|null){if(!d) return "No deadline";return new Date(d).toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:true})+" ET";}

const S = {
  card:{background:"rgba(30,20,10,0.85)",border:"1px solid rgba(180,120,40,0.3)",borderRadius:12,padding:16,marginBottom:12} as React.CSSProperties,
  inp:{background:"rgba(50,35,15,0.9)",border:"1px solid rgba(180,120,40,0.4)",borderRadius:8,padding:"8px 12px",color:"#fde68a",fontSize:14,width:"100%",fontFamily:"sans-serif",boxSizing:"border-box"} as React.CSSProperties,
  btn:(c="#d97706")=>({background:c,color:"#fff",border:"none",borderRadius:8,padding:"8px 16px",cursor:"pointer",fontWeight:600,fontSize:14,fontFamily:"sans-serif"}) as React.CSSProperties,
};

export default function App(){
  const [data,setData]=useState<GameData|null>(null);
  const [loading,setLoading]=useState(true);
  const [user,setUser]=useState<string|null>(null);
  const [isAdmin,setIsAdmin]=useState(false);
  const [tab,setTab]=useState("vote");
  const [adminTab,setAdminTab]=useState("cast");
  const [msg,setMsg]=useState("");

  useEffect(()=>{loadData().then(d=>{setData(d);setLoading(false);}).catch(()=>setLoading(false));},[]);

  const save=async(nd:GameData)=>{setData(nd);await saveData(nd);};
  const flash=(m:string)=>{setMsg(m);setTimeout(()=>setMsg(""),3000);};

  if(loading||!data) return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0f00 0%,#0d0800 100%)",display:"flex",alignItems:"center",justifyContent:"center",color:"#fbbf24",fontFamily:"Georgia,serif",fontSize:24}}>
      <div style={{textAlign:"center"}}><div style={{fontSize:60,marginBottom:16}}>🔥</div>Loading Tribal Council...</div>
    </div>
  );

  if(!user&&!isAdmin) return <LoginScreen data={data} setUser={setUser} setIsAdmin={setIsAdmin}/>;

  const castById:Record<string,Cast>={};
  data.cast.forEach(c=>castById[c.id]=c);
  const tribes=[...new Set(data.cast.map(c=>c.tribe))];

  function calcScores(){
    const scores:Record<string,{weekly:number;winner:number;total:number}>={};
    data!.players.forEach(p=>{scores[p]={weekly:0,winner:0,total:0};});
    data!.weeks.forEach(w=>{
      if(!w.results||!w.scored) return;
      data!.players.forEach(p=>{
        const pv=data!.votes[w.num]?.[p]; if(!pv) return;
        Object.entries(w.results).forEach(([tribe,elimId])=>{if(elimId&&pv[tribe]===elimId) scores[p].weekly+=5;});
      });
    });
    if(data!.seasonWinner){
      data!.players.forEach(p=>{
        const wp=data!.winnerPicks[p]; if(!wp?.locked) return;
        if(wp.pick1===data!.seasonWinner) scores[p].winner=50;
        else if(wp.pick2===data!.seasonWinner) scores[p].winner=30;
        else if(wp.pick3===data!.seasonWinner) scores[p].winner=20;
      });
    }
    data!.players.forEach(p=>{scores[p].total=scores[p].weekly+scores[p].winner;});
    return scores;
  }
  const scores=calcScores();

  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0f00 0%,#0d0800 50%,#0a0500 100%)",color:"#fde68a",fontFamily:"Georgia,serif"}}>
      <div style={{background:"linear-gradient(90deg,rgba(120,53,15,0.9),rgba(30,20,10,0.95),rgba(120,53,15,0.9))",borderBottom:"2px solid #b45309",padding:"12px 20px",display:"flex",alignItems:"center",justifyContent:"space-between",flexWrap:"wrap",gap:8}}>
        <div style={{display:"flex",alignItems:"center",gap:10}}>
          <span style={{fontSize:28}}>🔥</span>
          <div>
            <div style={{fontSize:18,fontWeight:700,color:"#fbbf24",letterSpacing:1}}>ANGUS CLAN</div>
            <div style={{fontSize:11,color:"#d97706",letterSpacing:2,textTransform:"uppercase"}}>Survivor Fantasy League</div>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:12}}>
          <span style={{fontSize:13,color:"#d4a053"}}>{isAdmin?"⚙️ Admin":`👤 ${user}`}</span>
          <button onClick={()=>{setUser(null);setIsAdmin(false);setTab("vote");}} style={{...S.btn("#78350f"),fontSize:12,padding:"6px 12px"}}>Log Out</button>
        </div>
      </div>
      {msg&&<div style={{background:"#065f46",color:"#6ee7b7",padding:"10px 20px",textAlign:"center",fontSize:14,fontFamily:"sans-serif"}}>{msg}</div>}
      <div style={{maxWidth:960,margin:"0 auto",padding:16}}>
        {isAdmin?<AdminPanel data={data} save={save} flash={flash} adminTab={adminTab} setAdminTab={setAdminTab} castById={castById} tribes={tribes}/>
        :<PlayerDash data={data} save={save} flash={flash} user={user!} tab={tab} setTab={setTab} scores={scores} castById={castById} tribes={tribes}/>}
      </div>
    </div>
  );
}

function LoginScreen({data,setUser,setIsAdmin}:{data:GameData;setUser:(u:string)=>void;setIsAdmin:(b:boolean)=>void}){
  const [sel,setSel]=useState("");const [pw,setPw]=useState("");const [showAdmin,setShowAdmin]=useState(false);const [err,setErr]=useState("");
  return (
    <div style={{minHeight:"100vh",background:"linear-gradient(180deg,#1a0f00 0%,#0d0800 60%,#000 100%)",display:"flex",alignItems:"center",justifyContent:"center",fontFamily:"Georgia,serif",padding:20}}>
      <div style={{width:"100%",maxWidth:420,textAlign:"center"}}>
        <div style={{fontSize:64,marginBottom:8}}>🔥</div>
        <h1 style={{color:"#fbbf24",fontSize:28,margin:"0 0 4px",letterSpacing:2}}>ANGUS CLAN</h1>
        <p style={{color:"#d97706",fontSize:13,letterSpacing:3,textTransform:"uppercase",margin:"0 0 32px"}}>Survivor 50 Fantasy League</p>
        <div style={S.card}>
          {!showAdmin?<>
            <p style={{color:"#d4a053",fontSize:14,margin:"0 0 12px"}}>Select your name to enter:</p>
            <select value={sel} onChange={e=>setSel(e.target.value)} style={{...S.inp,marginBottom:12,cursor:"pointer"}}>
              <option value="">— Choose Player —</option>
              {data.players.map(p=><option key={p} value={p}>{p}</option>)}
            </select>
            <button disabled={!sel} onClick={()=>sel&&setUser(sel)} style={{...S.btn(sel?"#d97706":"#555"),width:"100%",opacity:sel?1:0.5}}>Enter Tribal Council</button>
            {data.players.length===0&&<p style={{color:"#b45309",fontSize:12,marginTop:12,fontFamily:"sans-serif"}}>No players added yet. Ask the admin to add players.</p>}
            <div style={{marginTop:20,borderTop:"1px solid rgba(180,120,40,0.2)",paddingTop:12}}>
              <button onClick={()=>setShowAdmin(true)} style={{background:"none",border:"none",color:"#92400e",cursor:"pointer",fontSize:12,fontFamily:"sans-serif"}}>🔒 Admin Login</button>
            </div>
          </>:<>
            <p style={{color:"#d4a053",fontSize:14,margin:"0 0 12px"}}>Admin Password:</p>
            <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter password" style={{...S.inp,marginBottom:12}} onKeyDown={e=>{if(e.key==="Enter"){if(pw===ADMIN_PW)setIsAdmin(true);else setErr("Wrong password");}}}/>
            {err&&<p style={{color:"#ef4444",fontSize:13,margin:"0 0 8px"}}>{err}</p>}
            <button onClick={()=>{if(pw===ADMIN_PW)setIsAdmin(true);else setErr("Wrong password");}} style={{...S.btn(),width:"100%"}}>Login as Admin</button>
            <div style={{marginTop:12}}>
              <button onClick={()=>{setShowAdmin(false);setErr("");setPw("");}} style={{background:"none",border:"none",color:"#92400e",cursor:"pointer",fontSize:12,fontFamily:"sans-serif"}}>← Back to Player Login</button>
            </div>
          </>}
        </div>
      </div>
    </div>
  );
}

function PlayerDash({data,save,flash,user,tab,setTab,scores,castById,tribes}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;user:string;tab:string;setTab:(t:string)=>void;scores:Record<string,{weekly:number;winner:number;total:number}>;castById:Record<string,Cast>;tribes:string[]}){
  const tabs=[{id:"vote",label:"🗳️ Vote"},{id:"board",label:"🏆 Board"},{id:"picks",label:"⭐ Picks"},{id:"history",label:"📅 History"}];
  return (
    <div>
      <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} style={{...S.btn(tab===t.id?"#b45309":"#3a2510"),fontSize:13,padding:"8px 14px",borderRadius:8}}>{t.label}</button>)}
      </div>
      {tab==="vote"&&<VoteTab data={data} save={save} flash={flash} user={user} castById={castById}/>}
      {tab==="board"&&<Leaderboard data={data} scores={scores} castById={castById}/>}
      {tab==="picks"&&<WinnerPicks data={data} save={save} flash={flash} user={user} castById={castById}/>}
      {tab==="history"&&<History data={data} castById={castById}/>}
    </div>
  );
}

function VoteTab({data,save,flash,user,castById}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;user:string;castById:Record<string,Cast>}){
  const currentWeek=data.weeks.length>0?data.weeks[data.weeks.length-1]:null;
  const [picks,setPicks]=useState<Record<string,string>>({});
  useEffect(()=>{if(currentWeek&&data.votes[currentWeek.num]?.[user]) setPicks({...data.votes[currentWeek.num][user]});else setPicks({});},[currentWeek?.num,user]);

  if(!currentWeek) return <div style={S.card}><p style={{color:"#d4a053",textAlign:"center",margin:0}}>No active week yet. The admin will open voting soon!</p></div>;

  const open=beforeDL(currentWeek.deadline);const locked=!open;
  const activeTribes=[...new Set(data.cast.filter(c=>c.status==="active").map(c=>c.tribe))];

  const submitVote=async()=>{
    const nd={...data,votes:{...data.votes}};
    if(!nd.votes[currentWeek.num]) nd.votes[currentWeek.num]={};
    nd.votes[currentWeek.num]={...nd.votes[currentWeek.num],[user]:{...picks}};
    await save(nd);flash("✅ Vote saved!");
  };

  return (
    <div>
      <div style={{...S.card,display:"flex",justifyContent:"space-between",alignItems:"center",flexWrap:"wrap",gap:8}}>
        <div>
          <span style={{fontSize:18,fontWeight:700,color:"#fbbf24"}}>Week {currentWeek.num}</span>
          {currentWeek.scored&&<span style={{marginLeft:10,fontSize:12,color:"#6ee7b7",fontFamily:"sans-serif"}}>✅ Scored</span>}
        </div>
        <div style={{fontSize:13,fontFamily:"sans-serif",color:locked?"#ef4444":"#6ee7b7"}}>{locked?"🔒 Votes locked":`⏰ ${fmtDL(currentWeek.deadline)}`}</div>
      </div>
      {activeTribes.map(tribe=>{
        const members=data.cast.filter(c=>c.tribe===tribe&&c.status==="active");
        const tc=TC[tribe]||{bg:"#333",bdr:"#666",txt:"#ccc",lt:"#eee",label:tribe};
        const result=currentWeek.results?.[tribe];const correct=result&&picks[tribe]===result;
        return (
          <div key={tribe} style={{...S.card,borderColor:tc.bdr,borderWidth:2}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:12}}>
              <span style={{fontSize:16,fontWeight:700,color:tc.txt}}>{tc.label||tribe}</span>
              {currentWeek.scored&&result&&<span style={{fontSize:12,fontFamily:"sans-serif",color:correct?"#6ee7b7":"#fca5a5"}}>{correct?"✅ +5 pts":`❌ ${castById[result]?.name}`}</span>}
            </div>
            <div style={{display:"grid",gridTemplateColumns:"repeat(auto-fill,minmax(160px,1fr))",gap:8}}>
              {members.map(m=>{
                const selected=picks[tribe]===m.id;
                return <button key={m.id} disabled={locked} onClick={()=>{if(!locked) setPicks(p=>({...p,[tribe]:m.id}));}}
                  style={{padding:"10px 12px",borderRadius:8,border:`2px solid ${selected?tc.bdr:"rgba(100,80,40,0.3)"}`,background:selected?tc.bg:"rgba(30,20,10,0.6)",color:selected?tc.lt:"#d4a053",cursor:locked?"default":"pointer",fontSize:14,fontFamily:"Georgia,serif",textAlign:"left",opacity:locked&&!selected?0.5:1,transition:"all 0.15s"}}>
                  {selected&&"🔥 "}{m.name}
                </button>;
              })}
            </div>
          </div>
        );
      })}
      {!locked&&<button onClick={submitVote} style={{...S.btn("#059669"),width:"100%",padding:"12px",fontSize:16,marginTop:4}}>🗳️ Submit Vote</button>}
    </div>
  );
}

function Leaderboard({data,scores,castById}:{data:GameData;scores:Record<string,{weekly:number;winner:number;total:number}>;castById:Record<string,Cast>}){
  const sorted=[...data.players].sort((a,b)=>(scores[b]?.total||0)-(scores[a]?.total||0));
  const medals=["🥇","🥈","🥉"];
  return (
    <div>
      <h2 style={{color:"#fbbf24",fontSize:20,margin:"0 0 16px"}}>🏆 Leaderboard</h2>
      {sorted.map((p,i)=>{
        const s=scores[p]||{weekly:0,winner:0,total:0};const wp=data.winnerPicks[p];
        return (
          <div key={p} style={{...S.card,display:"flex",alignItems:"center",gap:12,flexWrap:"wrap"}}>
            <span style={{fontSize:24,minWidth:36,textAlign:"center"}}>{medals[i]||`#${i+1}`}</span>
            <div style={{flex:1,minWidth:140}}>
              <div style={{fontSize:16,fontWeight:700,color:"#fbbf24"}}>{p}</div>
              <div style={{fontSize:12,fontFamily:"sans-serif",color:"#b08040",marginTop:2}}>Weekly: {s.weekly} pts{s.winner>0&&` • Winner: ${s.winner} pts`}</div>
              {wp?.locked&&<div style={{fontSize:11,fontFamily:"sans-serif",color:"#8b7040",marginTop:4}}>
                Picks: {[wp.pick1,wp.pick2,wp.pick3].map((pid,j)=>{const c=castById[pid];if(!c) return null;const out=c.status==="eliminated";return <span key={j} style={{marginRight:8,textDecoration:out?"line-through":"none",opacity:out?0.5:1}}>#{j+1} {c.name}</span>;})}
              </div>}
            </div>
            <div style={{fontSize:28,fontWeight:700,color:"#fbbf24",fontFamily:"sans-serif"}}>{s.total}</div>
          </div>
        );
      })}
      {data.players.length===0&&<div style={S.card}><p style={{color:"#b08040",margin:0,textAlign:"center"}}>No players yet.</p></div>}
    </div>
  );
}

function WinnerPicks({data,save,flash,user,castById}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;user:string;castById:Record<string,Cast>}){
  const wp=data.winnerPicks[user]||{} as any;const locked=wp.locked;
  const [p1,setP1]=useState(wp.pick1||"");const [p2,setP2]=useState(wp.pick2||"");const [p3,setP3]=useState(wp.pick3||"");
  useEffect(()=>{const w=data.winnerPicks[user]||{} as any;setP1(w.pick1||"");setP2(w.pick2||"");setP3(w.pick3||"");},[data.winnerPicks[user]?.locked]);

  const active=data.cast.filter(c=>c.status==="active");const used=[p1,p2,p3].filter(Boolean);

  const submit=async()=>{if(!p1||!p2||!p3){flash("Select all 3");return;}const nd={...data,winnerPicks:{...data.winnerPicks,[user]:{pick1:p1,pick2:p2,pick3:p3,locked:true}}};await save(nd);flash("⭐ Winner picks locked!");};

  const renderPick=(val:string,setter:(v:string)=>void,pts:number,rank:number)=>{
    const c=castById[val];const elim=c?.status==="eliminated";
    return (
      <div style={{...S.card,borderColor:val?"#b45309":"rgba(100,80,40,0.3)"}}>
        <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
          <span style={{color:"#fbbf24",fontWeight:700}}>#{rank} Pick — {pts} pts</span>
          {locked&&elim&&<span style={{color:"#ef4444",fontSize:12,fontFamily:"sans-serif"}}>❌ Eliminated</span>}
        </div>
        {locked?<div style={{fontSize:16,color:elim?"#78716c":"#fde68a",textDecoration:elim?"line-through":"none"}}>{c?.name||"Not set"}</div>
        :<select value={val} onChange={e=>setter(e.target.value)} style={{...S.inp,cursor:"pointer"}}>
          <option value="">— Select —</option>
          {active.filter(m=>!used.includes(m.id)||m.id===val).map(m=><option key={m.id} value={m.id}>{m.name} ({m.tribe})</option>)}
        </select>}
      </div>
    );
  };

  return (
    <div>
      <h2 style={{color:"#fbbf24",fontSize:20,margin:"0 0 4px"}}>⭐ Top 3 Winner Picks</h2>
      <p style={{color:"#b08040",fontSize:13,fontFamily:"sans-serif",margin:"0 0 16px"}}>{locked?"Your picks are locked. Good luck!":"Pick your top 3 to WIN Survivor 50. Locked after submission!"}</p>
      {renderPick(p1,setP1,50,1)}{renderPick(p2,setP2,30,2)}{renderPick(p3,setP3,20,3)}
      {!locked&&<button onClick={submit} disabled={!p1||!p2||!p3} style={{...S.btn(p1&&p2&&p3?"#d97706":"#555"),width:"100%",padding:12,fontSize:15,opacity:p1&&p2&&p3?1:0.5}}>🔒 Lock In Winner Picks</button>}
    </div>
  );
}

function History({data,castById}:{data:GameData;castById:Record<string,Cast>}){
  const weeks=[...data.weeks].reverse();
  if(!weeks.length) return <div style={S.card}><p style={{color:"#b08040",margin:0,textAlign:"center"}}>No weeks completed yet.</p></div>;
  return (
    <div>
      <h2 style={{color:"#fbbf24",fontSize:20,margin:"0 0 16px"}}>📅 Weekly History</h2>
      {weeks.map(w=>(
        <div key={w.num} style={S.card}>
          <div style={{display:"flex",justifyContent:"space-between",marginBottom:12,flexWrap:"wrap",gap:4}}>
            <span style={{fontSize:16,fontWeight:700,color:"#fbbf24"}}>Week {w.num}</span>
            <span style={{fontSize:12,color:w.scored?"#6ee7b7":"#fca5a5",fontFamily:"sans-serif"}}>{w.scored?"Scored":"Pending"}</span>
          </div>
          {w.results&&Object.entries(w.results).filter(([,v])=>v).length>0&&
            <div style={{marginBottom:12,padding:8,background:"rgba(120,53,15,0.2)",borderRadius:8}}>
              <span style={{fontSize:12,color:"#d97706",fontFamily:"sans-serif"}}>Eliminated: </span>
              {Object.entries(w.results).filter(([,v])=>v).map(([tribe,id])=><span key={tribe} style={{fontSize:13,color:TC[tribe]?.txt||"#ccc",marginRight:12}}>{castById[id!]?.name} ({tribe})</span>)}
            </div>}
          <div style={{overflowX:"auto"}}>
            <table style={{width:"100%",borderCollapse:"collapse",fontSize:13,fontFamily:"sans-serif"}}>
              <thead><tr style={{borderBottom:"1px solid rgba(180,120,40,0.3)"}}>
                <th style={{textAlign:"left",padding:"6px 8px",color:"#d4a053"}}>Player</th>
                {Object.keys(w.results||{}).map(t=><th key={t} style={{textAlign:"left",padding:"6px 8px",color:TC[t]?.txt||"#ccc"}}>{t}</th>)}
                <th style={{textAlign:"right",padding:"6px 8px",color:"#d4a053"}}>Pts</th>
              </tr></thead>
              <tbody>{data.players.map(p=>{
                const pv=data.votes[w.num]?.[p]||{};let pts=0;
                return <tr key={p} style={{borderBottom:"1px solid rgba(80,60,20,0.2)"}}>
                  <td style={{padding:"6px 8px",color:"#fde68a"}}>{p}</td>
                  {Object.entries(w.results||{}).map(([tribe,elimId])=>{
                    const vote=pv[tribe];const correct=elimId&&vote===elimId;if(correct)pts+=5;
                    return <td key={tribe} style={{padding:"6px 8px",color:!vote?"#666":correct?"#6ee7b7":"#fca5a5"}}>{vote?castById[vote]?.name||"?":"—"} {vote&&(correct?"✅":"❌")}</td>;
                  })}
                  <td style={{padding:"6px 8px",textAlign:"right",color:"#fbbf24",fontWeight:700}}>{w.scored?pts:"—"}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminPanel({data,save,flash,adminTab,setAdminTab,castById,tribes}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;adminTab:string;setAdminTab:(t:string)=>void;castById:Record<string,Cast>;tribes:string[]}){
  const tabs=[{id:"cast",label:"🏝️ Cast"},{id:"weeks",label:"📅 Weeks"},{id:"players",label:"👥 Players"},{id:"winner",label:"👑 Winner"}];
  return (
    <div>
      <h2 style={{color:"#fbbf24",fontSize:20,margin:"0 0 12px"}}>⚙️ Admin Panel</h2>
      <div style={{display:"flex",gap:4,marginBottom:16,flexWrap:"wrap"}}>
        {tabs.map(t=><button key={t.id} onClick={()=>setAdminTab(t.id)} style={{...S.btn(adminTab===t.id?"#b45309":"#3a2510"),fontSize:13,padding:"8px 14px"}}>{t.label}</button>)}
      </div>
      {adminTab==="cast"&&<AdminCast data={data} save={save} flash={flash} tribes={tribes}/>}
      {adminTab==="weeks"&&<AdminWeeks data={data} save={save} flash={flash} castById={castById}/>}
      {adminTab==="players"&&<AdminPlayers data={data} save={save} flash={flash}/>}
      {adminTab==="winner"&&<AdminWinner data={data} save={save} flash={flash} castById={castById}/>}
    </div>
  );
}

function AdminCast({data,save,flash,tribes}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;tribes:string[]}){
  const [editId,setEditId]=useState<string|null>(null);const [editName,setEditName]=useState("");const [editTribe,setEditTribe]=useState("");
  const [newName,setNewName]=useState("");const [newTribe,setNewTribe]=useState(tribes[0]||"");const [newTribeName,setNewTribeName]=useState("");
  const allTribes=[...new Set(data.cast.map(c=>c.tribe))];

  return (
    <div>
      <div style={S.card}>
        <h3 style={{color:"#d97706",fontSize:15,margin:"0 0 10px"}}>Add New Tribe Name</h3>
        <div style={{display:"flex",gap:8}}>
          <input value={newTribeName} onChange={e=>setNewTribeName(e.target.value)} placeholder="e.g. Merged Tribe" style={{...S.inp,flex:1}}/>
          <button onClick={()=>{if(!newTribeName.trim()) return;setNewTribe(newTribeName.trim());setNewTribeName("");flash("Tribe name set.");}} style={S.btn()}>Add</button>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{color:"#d97706",fontSize:15,margin:"0 0 10px"}}>Add Cast Member</h3>
        <div style={{display:"flex",gap:8,flexWrap:"wrap"}}>
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" style={{...S.inp,flex:2,minWidth:150}}/>
          <select value={newTribe} onChange={e=>setNewTribe(e.target.value)} style={{...S.inp,flex:1,minWidth:100,cursor:"pointer"}}>
            {allTribes.map(t=><option key={t}>{t}</option>)}
            {newTribeName&&!allTribes.includes(newTribeName)&&<option value={newTribeName}>{newTribeName}</option>}
          </select>
          <button onClick={async()=>{if(!newName.trim()||!newTribe.trim()) return;const id="x"+Date.now();const nd={...data,cast:[...data.cast,{id,name:newName.trim(),tribe:newTribe,status:"active",weekOut:null}]};await save(nd);setNewName("");flash("✅ Added");}} style={S.btn()}>Add</button>
        </div>
      </div>
      {allTribes.map(tribe=>{
        const tc=TC[tribe]||{bg:"#333",bdr:"#888",txt:"#ccc",lt:"#eee",label:tribe};
        const members=data.cast.filter(c=>c.tribe===tribe);
        return (
          <div key={tribe} style={{...S.card,borderColor:tc.bdr,borderWidth:2}}>
            <h3 style={{color:tc.txt,fontSize:16,margin:"0 0 10px"}}>{tc.label||tribe} ({members.filter(m=>m.status==="active").length} active)</h3>
            {members.map(m=>(
              <div key={m.id} style={{display:"flex",alignItems:"center",gap:8,padding:"6px 0",borderBottom:"1px solid rgba(80,60,20,0.15)",flexWrap:"wrap"}}>
                {editId===m.id?<>
                  <input value={editName} onChange={e=>setEditName(e.target.value)} style={{...S.inp,flex:1,minWidth:120}}/>
                  <select value={editTribe} onChange={e=>setEditTribe(e.target.value)} style={{...S.inp,width:100,cursor:"pointer"}}>{allTribes.map(t=><option key={t}>{t}</option>)}</select>
                  <button onClick={async()=>{const nd={...data,cast:data.cast.map(c=>c.id===m.id?{...c,name:editName,tribe:editTribe}:c)};await save(nd);setEditId(null);flash("✅ Updated");}} style={{...S.btn("#059669"),padding:"4px 10px",fontSize:12}}>Save</button>
                  <button onClick={()=>setEditId(null)} style={{...S.btn("#78350f"),padding:"4px 10px",fontSize:12}}>Cancel</button>
                </>:<>
                  <span style={{flex:1,color:m.status==="eliminated"?"#78716c":"#fde68a",textDecoration:m.status==="eliminated"?"line-through":"none",fontSize:14}}>
                    {m.name} {m.status==="eliminated"&&`(Week ${m.weekOut})`}
                  </span>
                  <button onClick={()=>{setEditId(m.id);setEditName(m.name);setEditTribe(m.tribe);}} style={{...S.btn("#78350f"),padding:"3px 8px",fontSize:11}}>Edit</button>
                  {m.status==="active"?
                    <button onClick={async()=>{const wk=prompt("Eliminated in which week?",String(data.weeks.length||1));if(wk){const nd={...data,cast:data.cast.map(c=>c.id===m.id?{...c,status:"eliminated",weekOut:parseInt(wk)}:c)};await save(nd);flash("☠️ Eliminated");}}} style={{...S.btn("#dc2626"),padding:"3px 8px",fontSize:11}}>Eliminate</button>
                  :<button onClick={async()=>{const nd={...data,cast:data.cast.map(c=>c.id===m.id?{...c,status:"active",weekOut:null}:c)};await save(nd);flash("✅ Reactivated");}} style={{...S.btn("#059669"),padding:"3px 8px",fontSize:11}}>Reactivate</button>}
                  <button onClick={async()=>{const nd={...data,cast:data.cast.filter(c=>c.id!==m.id)};await save(nd);flash("Removed");}} style={{...S.btn("#555"),padding:"3px 8px",fontSize:11}}>✕</button>
                </>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function AdminWeeks({data,save,flash,castById}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;castById:Record<string,Cast>}){
  const [selResults,setSelResults]=useState<Record<string,string>>({});

  const createWeek=async()=>{
    const num=data.weeks.length+1;const now=new Date();const wed=new Date(now);
    wed.setDate(wed.getDate()+((3-wed.getDay()+7)%7||7));wed.setHours(20,0,0,0);
    const tribes=[...new Set(data.cast.filter(c=>c.status==="active").map(c=>c.tribe))];
    const results:Record<string,null>={};tribes.forEach(t=>results[t]=null);
    const nd={...data,weeks:[...data.weeks,{num,deadline:wed.toISOString(),results,scored:false}]};
    await save(nd);flash(`✅ Week ${num} created!`);
  };

  return (
    <div>
      <button onClick={createWeek} style={{...S.btn("#059669"),width:"100%",padding:12,marginBottom:16}}>+ Create Week {data.weeks.length+1}</button>
      {[...data.weeks].reverse().map(w=>{
        const open=beforeDL(w.deadline);const activeTribes=Object.keys(w.results||{});
        return (
          <div key={w.num} style={S.card}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:10,flexWrap:"wrap",gap:4}}>
              <span style={{fontSize:16,fontWeight:700,color:"#fbbf24"}}>Week {w.num}</span>
              <div style={{display:"flex",gap:6,alignItems:"center"}}>
                <span style={{fontSize:12,fontFamily:"sans-serif",color:open?"#6ee7b7":w.scored?"#6ee7b7":"#fca5a5"}}>{open?"Open":w.scored?"Scored":"Awaiting results"}</span>
                <button onClick={async()=>{const nd={...data,weeks:data.weeks.filter(x=>x.num!==w.num)};const nv={...nd.votes};delete nv[w.num];nd.votes=nv;await save(nd);flash("Deleted");}} style={{...S.btn("#555"),padding:"2px 8px",fontSize:11}}>✕</button>
              </div>
            </div>
            <div style={{marginBottom:10}}>
              <label style={{fontSize:12,color:"#b08040",fontFamily:"sans-serif"}}>Deadline:</label>
              <input type="datetime-local" value={w.deadline?.slice(0,16)||""} onChange={async e=>{const nd={...data,weeks:data.weeks.map(x=>x.num===w.num?{...x,deadline:e.target.value}:x)};await save(nd);flash("Updated");}} style={{...S.inp,marginTop:4}}/>
            </div>
            {!w.scored&&<div>
              <p style={{color:"#d97706",fontSize:13,margin:"0 0 8px",fontFamily:"sans-serif"}}>Enter elimination results:</p>
              {activeTribes.map(tribe=>{
                const members=data.cast.filter(c=>c.tribe===tribe&&(c.status==="active"||(c.weekOut===w.num)));
                const tc=TC[tribe]||{txt:"#ccc",label:tribe};const key=`${w.num}-${tribe}`;
                return <div key={tribe} style={{marginBottom:8}}>
                  <label style={{fontSize:13,color:tc.txt}}>{tc.label||tribe}:</label>
                  <select value={selResults[key]||w.results?.[tribe]||""} onChange={e=>setSelResults(r=>({...r,[key]:e.target.value}))} style={{...S.inp,marginTop:4,cursor:"pointer"}}>
                    <option value="">No elimination</option>
                    {members.map(m=><option key={m.id} value={m.id}>{m.name}</option>)}
                  </select>
                </div>;
              })}
              <button onClick={async()=>{
                const week=data.weeks.find(x=>x.num===w.num);if(!week) return;
                const nr={...week.results};
                Object.keys(nr).forEach(tribe=>{const k=`${w.num}-${tribe}`;if(selResults[k]!==undefined) nr[tribe]=selResults[k]||null;});
                const nc=data.cast.map(c=>Object.values(nr).includes(c.id)&&c.status==="active"?{...c,status:"eliminated",weekOut:w.num}:c);
                const nd={...data,cast:nc,weeks:data.weeks.map(x=>x.num===w.num?{...x,results:nr,scored:true}:x)};
                await save(nd);flash(`✅ Week ${w.num} scored!`);
              }} style={{...S.btn("#059669"),marginTop:8}}>Score Week {w.num}</button>
            </div>}
            {w.scored&&<div style={{padding:8,background:"rgba(6,95,70,0.2)",borderRadius:8}}>
              <span style={{fontSize:13,fontFamily:"sans-serif",color:"#6ee7b7"}}>Results: </span>
              {Object.entries(w.results||{}).map(([tribe,id])=><span key={tribe} style={{fontSize:13,color:TC[tribe]?.txt||"#ccc",marginRight:10}}>{tribe}: {id?castById[id]?.name:"None"}</span>)}
            </div>}
            <div style={{marginTop:10}}><span style={{fontSize:12,color:"#8b7040",fontFamily:"sans-serif"}}>Votes: {Object.keys(data.votes[w.num]||{}).length}/{data.players.length}</span></div>
          </div>
        );
      })}
    </div>
  );
}

function AdminPlayers({data,save,flash}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void}){
  const [newP,setNewP]=useState("");
  return (
    <div>
      <div style={S.card}>
        <h3 style={{color:"#d97706",fontSize:15,margin:"0 0 10px"}}>Add Player ({data.players.length}/20)</h3>
        <div style={{display:"flex",gap:8}}>
          <input value={newP} onChange={e=>setNewP(e.target.value)} placeholder="Player name" style={{...S.inp,flex:1}} onKeyDown={async e=>{if(e.key==="Enter"&&newP.trim()&&!data.players.includes(newP.trim())){const nd={...data,players:[...data.players,newP.trim()]};await save(nd);setNewP("");flash("✅ Added");}}}/>
          <button onClick={async()=>{if(!newP.trim()||data.players.includes(newP.trim())) return;const nd={...data,players:[...data.players,newP.trim()]};await save(nd);setNewP("");flash("✅ Added");}} disabled={data.players.length>=20} style={S.btn(data.players.length<20?"#d97706":"#555")}>Add</button>
        </div>
      </div>
      <div style={S.card}>
        <h3 style={{color:"#d97706",fontSize:15,margin:"0 0 10px"}}>Current Players</h3>
        {data.players.length===0&&<p style={{color:"#8b7040",fontSize:13,margin:0}}>No players added yet.</p>}
        {data.players.map(p=><div key={p} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 0",borderBottom:"1px solid rgba(80,60,20,0.15)"}}>
          <span style={{color:"#fde68a",fontSize:14}}>{p}</span>
          <button onClick={async()=>{const nd={...data,players:data.players.filter(x=>x!==p)};await save(nd);flash("Removed");}} style={{...S.btn("#dc2626"),padding:"3px 10px",fontSize:12}}>Remove</button>
        </div>)}
      </div>
      <div style={S.card}>
        <h3 style={{color:"#d97706",fontSize:15,margin:"0 0 10px"}}>Unlock Winner Picks</h3>
        <p style={{color:"#8b7040",fontSize:12,fontFamily:"sans-serif",margin:"0 0 10px"}}>Unlock a player&apos;s picks so they can re-submit.</p>
        {data.players.map(p=>{const wp=data.winnerPicks[p];if(!wp?.locked) return null;return <div key={p} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0"}}>
          <span style={{color:"#fde68a",fontSize:13}}>{p}</span>
          <button onClick={async()=>{const nd={...data,winnerPicks:{...data.winnerPicks,[p]:{...wp,locked:false}}};await save(nd);flash(`Unlocked ${p}`);}} style={{...S.btn("#78350f"),padding:"3px 10px",fontSize:11}}>Unlock</button>
        </div>;})}
      </div>
    </div>
  );
}

function AdminWinner({data,save,flash,castById}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;castById:Record<string,Cast>}){
  const [sel,setSel]=useState(data.seasonWinner||"");
  return (
    <div style={S.card}>
      <h3 style={{color:"#d97706",fontSize:15,margin:"0 0 10px"}}>👑 Crown the Sole Survivor</h3>
      <p style={{color:"#8b7040",fontSize:12,fontFamily:"sans-serif",margin:"0 0 12px"}}>Set at end of season. Winner pick bonuses (50/30/20) apply to leaderboard.</p>
      {data.seasonWinner&&<div style={{padding:12,background:"rgba(120,53,15,0.3)",borderRadius:8,marginBottom:12,textAlign:"center"}}>
        <span style={{fontSize:18,color:"#fbbf24"}}>👑 {castById[data.seasonWinner]?.name}</span>
        <div><button onClick={async()=>{const nd={...data,seasonWinner:null};await save(nd);setSel("");flash("Cleared");}} style={{...S.btn("#78350f"),marginTop:8,fontSize:12}}>Clear</button></div>
      </div>}
      <select value={sel} onChange={e=>setSel(e.target.value)} style={{...S.inp,marginBottom:12,cursor:"pointer"}}>
        <option value="">— Select Winner —</option>
        {data.cast.map(m=><option key={m.id} value={m.id}>{m.name} ({m.tribe})</option>)}
      </select>
      <button onClick={async()=>{if(!sel) return;const nd={...data,seasonWinner:sel};await save(nd);flash(`👑 ${castById[sel]?.name} crowned!`);}} disabled={!sel} style={{...S.btn(sel?"#d97706":"#555"),width:"100%",opacity:sel?1:0.5}}>Crown Sole Survivor</button>
    </div>
  );
}