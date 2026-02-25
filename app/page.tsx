"use client";
import { useState, useEffect } from "react";

const TC: Record<string, { bg:string; bdr:string; txt:string; lt:string; label:string }> = {
  Kalo:{bg:"#134e4a",bdr:"#14b8a6",txt:"#5eead4",lt:"#ccfbf1",label:"Kalo (Teal)"},
  Cila:{bg:"#7c2d12",bdr:"#f97316",txt:"#fdba74",lt:"#fff7ed",label:"Cila (Orange)"},
  Vatu:{bg:"#581c87",bdr:"#a855f7",txt:"#c084fc",lt:"#faf5ff",label:"Vatu (Purple)"},
};

const ADMIN_PW = "survivor50admin";

type Cast = { id:string; name:string; tribe:string; status:string; weekOut:number|null };
type Week = { num:number; deadline:string; results:Record<string,string|null>; scored:boolean };
type GameData = {
  cast: Cast[];
  players: string[];
  weeks: Week[];
  votes: Record<number, Record<string, Record<string,string>>>;
  winnerPicks: Record<string, { pick1:string; pick2:string; pick3:string; locked:boolean }>;
  seasonWinner: string|null;
};

async function loadData(): Promise<GameData> {
  const r = await fetch("/api/data");
  return r.json();
}
async function saveData(d: GameData) {
  await fetch("/api/data", { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify(d) });
}

function getNowET() {
  const s = new Date().toLocaleString("en-US",{timeZone:"America/New_York"});
  return new Date(s);
}
function beforeDL(dl:string|null) {
  if(!dl) return false;
  return getNowET() < new Date(dl);
}
function fmtDL(d:string|null) {
  if(!d) return "No deadline";
  return new Date(d).toLocaleString("en-US",{timeZone:"America/New_York",weekday:"short",month:"short",day:"numeric",hour:"numeric",minute:"2-digit",hour12:true})+" ET";
}

const card = "bg-[rgba(30,20,10,0.85)] border border-[rgba(180,120,40,0.3)] rounded-xl p-4 mb-3";
const inp = "bg-[rgba(50,35,15,0.9)] border border-[rgba(180,120,40,0.4)] rounded-lg px-3 py-2 text-[#fde68a] text-sm w-full";
const btnPrimary = "bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg px-4 py-2 text-sm cursor-pointer transition-colors";
const btnDark = "bg-[#3a2510] hover:bg-[#4a3520] text-amber-200 font-semibold rounded-lg px-4 py-2 text-sm cursor-pointer transition-colors";

export default function App() {
  const [data, setData] = useState<GameData|null>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<string|null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [tab, setTab] = useState("vote");
  const [adminTab, setAdminTab] = useState("cast");
  const [msg, setMsg] = useState("");

  useEffect(() => {
    loadData().then(d => { setData(d); setLoading(false); }).catch(() => setLoading(false));
  }, []);

  const save = async (nd: GameData) => {
    setData(nd);
    await saveData(nd);
  };
  const flash = (m:string) => { setMsg(m); setTimeout(()=>setMsg(""),3000); };

  if(loading||!data) return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0f00] to-[#0d0800] flex items-center justify-center text-amber-400 font-serif text-2xl">
      <div className="text-center"><div className="text-6xl mb-4">🔥</div>Loading Tribal Council...</div>
    </div>
  );

  if(!user && !isAdmin) return <LoginScreen data={data} setUser={setUser} setIsAdmin={setIsAdmin} />;

  const castById: Record<string,Cast> = {};
  data.cast.forEach(c => castById[c.id] = c);
  const tribes = [...new Set(data.cast.map(c=>c.tribe))];

  function calcScores() {
    const scores: Record<string,{weekly:number;winner:number;total:number}> = {};
    data!.players.forEach(p => { scores[p] = {weekly:0,winner:0,total:0}; });
    data!.weeks.forEach(w => {
      if(!w.results||!w.scored) return;
      data!.players.forEach(p => {
        const pv = data!.votes[w.num]?.[p];
        if(!pv) return;
        Object.entries(w.results).forEach(([tribe,elimId]) => {
          if(elimId && pv[tribe]===elimId) scores[p].weekly += 5;
        });
      });
    });
    if(data!.seasonWinner) {
      data!.players.forEach(p => {
        const wp = data!.winnerPicks[p];
        if(!wp?.locked) return;
        if(wp.pick1===data!.seasonWinner) scores[p].winner = 50;
        else if(wp.pick2===data!.seasonWinner) scores[p].winner = 30;
        else if(wp.pick3===data!.seasonWinner) scores[p].winner = 20;
      });
    }
    data!.players.forEach(p => { scores[p].total = scores[p].weekly + scores[p].winner; });
    return scores;
  }
  const scores = calcScores();

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0f00] via-[#0d0800] to-[#0a0500] text-[#fde68a] font-serif">
      <div className="bg-gradient-to-r from-[rgba(120,53,15,0.9)] via-[rgba(30,20,10,0.95)] to-[rgba(120,53,15,0.9)] border-b-2 border-amber-700 px-5 py-3 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🔥</span>
          <div>
            <div className="text-lg font-bold text-amber-400 tracking-wider">ANGUS CLAN</div>
            <div className="text-xs text-amber-600 tracking-widest uppercase">Survivor Fantasy League</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-[#d4a053]">{isAdmin?"⚙️ Admin":`👤 ${user}`}</span>
          <button onClick={()=>{setUser(null);setIsAdmin(false);setTab("vote");}} className="bg-[#78350f] text-white text-xs px-3 py-1.5 rounded-lg cursor-pointer">Log Out</button>
        </div>
      </div>
      {msg && <div className="bg-emerald-900 text-emerald-300 py-2.5 px-5 text-center text-sm font-sans">{msg}</div>}
      <div className="max-w-[960px] mx-auto p-4">
        {isAdmin ? (
          <AdminPanel data={data} save={save} flash={flash} adminTab={adminTab} setAdminTab={setAdminTab} castById={castById} tribes={tribes} />
        ) : (
          <PlayerDash data={data} save={save} flash={flash} user={user!} tab={tab} setTab={setTab} scores={scores} castById={castById} tribes={tribes} />
        )}
      </div>
    </div>
  );
}

function LoginScreen({data,setUser,setIsAdmin}:{data:GameData;setUser:(u:string)=>void;setIsAdmin:(b:boolean)=>void}) {
  const [sel,setSel] = useState("");
  const [pw,setPw] = useState("");
  const [showAdmin,setShowAdmin] = useState(false);
  const [err,setErr] = useState("");

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#1a0f00] to-black flex items-center justify-center font-serif p-5">
      <div className="w-full max-w-[420px] text-center">
        <div className="text-7xl mb-2">🔥</div>
        <h1 className="text-amber-400 text-3xl font-bold tracking-wider mb-1">ANGUS CLAN</h1>
        <p className="text-amber-600 text-xs tracking-[0.2em] uppercase mb-8">Survivor 50 Fantasy League</p>
        <div className={card}>
          {!showAdmin ? (
            <>
              <p className="text-[#d4a053] text-sm mb-3">Select your name to enter:</p>
              <select value={sel} onChange={e=>setSel(e.target.value)} className={inp + " mb-3 cursor-pointer"}>
                <option value="">— Choose Player —</option>
                {data.players.map(p=><option key={p} value={p}>{p}</option>)}
              </select>
              <button disabled={!sel} onClick={()=>sel&&setUser(sel)} className={`${btnPrimary} w-full ${!sel?"opacity-50":""}`}>Enter Tribal Council</button>
              {data.players.length===0 && <p className="text-amber-700 text-xs mt-3 font-sans">No players added yet. Ask the admin to add players.</p>}
              <div className="mt-5 border-t border-[rgba(180,120,40,0.2)] pt-3">
                <button onClick={()=>setShowAdmin(true)} className="bg-transparent border-0 text-amber-800 cursor-pointer text-xs font-sans">🔒 Admin Login</button>
              </div>
            </>
          ) : (
            <>
              <p className="text-[#d4a053] text-sm mb-3">Admin Password:</p>
              <input type="password" value={pw} onChange={e=>setPw(e.target.value)} placeholder="Enter password" className={inp + " mb-3"} onKeyDown={e=>{if(e.key==="Enter"){if(pw===ADMIN_PW)setIsAdmin(true);else setErr("Wrong password");}}} />
              {err && <p className="text-red-500 text-sm mb-2">{err}</p>}
              <button onClick={()=>{if(pw===ADMIN_PW)setIsAdmin(true);else setErr("Wrong password");}} className={`${btnPrimary} w-full`}>Login as Admin</button>
              <div className="mt-3">
                <button onClick={()=>{setShowAdmin(false);setErr("");setPw("");}} className="bg-transparent border-0 text-amber-800 cursor-pointer text-xs font-sans">← Back to Player Login</button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

function PlayerDash({data,save,flash,user,tab,setTab,scores,castById,tribes}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;user:string;tab:string;setTab:(t:string)=>void;scores:Record<string,{weekly:number;winner:number;total:number}>;castById:Record<string,Cast>;tribes:string[]}) {
  const tabs = [{id:"vote",label:"🗳️ Vote"},{id:"board",label:"🏆 Board"},{id:"picks",label:"⭐ Picks"},{id:"history",label:"📅 History"}];
  return (
    <div>
      <div className="flex gap-1 mb-4 flex-wrap">
        {tabs.map(t=><button key={t.id} onClick={()=>setTab(t.id)} className={`${tab===t.id?btnPrimary:btnDark} text-sm px-3.5 py-2`}>{t.label}</button>)}
      </div>
      {tab==="vote" && <VoteTab data={data} save={save} flash={flash} user={user} castById={castById} />}
      {tab==="board" && <Leaderboard data={data} scores={scores} castById={castById} />}
      {tab==="picks" && <WinnerPicks data={data} save={save} flash={flash} user={user} castById={castById} />}
      {tab==="history" && <History data={data} castById={castById} />}
    </div>
  );
}

function VoteTab({data,save,flash,user,castById}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;user:string;castById:Record<string,Cast>}) {
  const currentWeek = data.weeks.length>0 ? data.weeks[data.weeks.length-1] : null;
  const [picks,setPicks] = useState<Record<string,string>>({});

  useEffect(() => {
    if(currentWeek && data.votes[currentWeek.num]?.[user]) setPicks({...data.votes[currentWeek.num][user]});
    else setPicks({});
  }, [currentWeek?.num, user]);

  if(!currentWeek) return <div className={card}><p className="text-[#d4a053] text-center">No active week yet. The admin will open voting soon!</p></div>;

  const open = beforeDL(currentWeek.deadline);
  const locked = !open;
  const activeTribes = [...new Set(data.cast.filter(c=>c.status==="active").map(c=>c.tribe))];

  const submitVote = async () => {
    const nd = {...data, votes:{...data.votes}};
    if(!nd.votes[currentWeek.num]) nd.votes[currentWeek.num] = {};
    nd.votes[currentWeek.num] = {...nd.votes[currentWeek.num], [user]: {...picks}};
    await save(nd);
    flash("✅ Vote saved!");
  };

  return (
    <div>
      <div className={card + " flex justify-between items-center flex-wrap gap-2"}>
        <div>
          <span className="text-lg font-bold text-amber-400">Week {currentWeek.num}</span>
          {currentWeek.scored && <span className="ml-2.5 text-xs text-emerald-300 font-sans">✅ Scored</span>}
        </div>
        <div className={`text-sm font-sans ${locked?"text-red-400":"text-emerald-300"}`}>
          {locked?"🔒 Votes locked":`⏰ ${fmtDL(currentWeek.deadline)}`}
        </div>
      </div>
      {activeTribes.map(tribe => {
        const members = data.cast.filter(c=>c.tribe===tribe&&c.status==="active");
        const tc = TC[tribe]||{bg:"#333",bdr:"#666",txt:"#ccc",lt:"#eee",label:tribe};
        const result = currentWeek.results?.[tribe];
        const correct = result && picks[tribe]===result;
        return (
          <div key={tribe} className={card} style={{borderColor:tc.bdr,borderWidth:2}}>
            <div className="flex justify-between items-center mb-3">
              <span className="text-base font-bold" style={{color:tc.txt}}>{tc.label||tribe}</span>
              {currentWeek.scored && result && <span className={`text-xs font-sans ${correct?"text-emerald-300":"text-red-300"}`}>{correct?"✅ +5 pts":`❌ ${castById[result]?.name}`}</span>}
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(160px,1fr))] gap-2">
              {members.map(m => {
                const selected = picks[tribe]===m.id;
                return (
                  <button key={m.id} disabled={locked} onClick={()=>{if(!locked) setPicks(p=>({...p,[tribe]:m.id}));}}
                    className="p-2.5 rounded-lg text-sm font-serif text-left transition-all"
                    style={{
                      border:`2px solid ${selected?tc.bdr:"rgba(100,80,40,0.3)"}`,
                      background:selected?tc.bg:"rgba(30,20,10,0.6)",
                      color:selected?tc.lt:"#d4a053",
                      opacity:locked&&!selected?0.5:1,
                      cursor:locked?"default":"pointer",
                    }}>
                    {selected&&"🔥 "}{m.name}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {!locked && <button onClick={submitVote} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg w-full py-3 text-base cursor-pointer mt-1">🗳️ Submit Vote</button>}
    </div>
  );
}

function Leaderboard({data,scores,castById}:{data:GameData;scores:Record<string,{weekly:number;winner:number;total:number}>;castById:Record<string,Cast>}) {
  const sorted = [...data.players].sort((a,b)=>(scores[b]?.total||0)-(scores[a]?.total||0));
  const medals = ["🥇","🥈","🥉"];
  return (
    <div>
      <h2 className="text-amber-400 text-xl mb-4">🏆 Leaderboard</h2>
      {sorted.map((p,i) => {
        const s = scores[p]||{weekly:0,winner:0,total:0};
        const wp = data.winnerPicks[p];
        return (
          <div key={p} className={card + " flex items-center gap-3 flex-wrap"}>
            <span className="text-2xl min-w-[36px] text-center">{medals[i]||`#${i+1}`}</span>
            <div className="flex-1 min-w-[140px]">
              <div className="text-base font-bold text-amber-400">{p}</div>
              <div className="text-xs font-sans text-[#b08040] mt-0.5">Weekly: {s.weekly} pts{s.winner>0&&` • Winner: ${s.winner} pts`}</div>
              {wp?.locked && <div className="text-[11px] font-sans text-[#8b7040] mt-1">
                Picks: {[wp.pick1,wp.pick2,wp.pick3].map((pid,j)=>{const c=castById[pid];if(!c) return null;const out=c.status==="eliminated";return <span key={j} className="mr-2" style={{textDecoration:out?"line-through":"none",opacity:out?0.5:1}}>#{j+1} {c.name}</span>;})}
              </div>}
            </div>
            <div className="text-3xl font-bold text-amber-400 font-sans">{s.total}</div>
          </div>
        );
      })}
      {data.players.length===0 && <div className={card}><p className="text-[#b08040] text-center">No players yet.</p></div>}
    </div>
  );
}

function WinnerPicks({data,save,flash,user,castById}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;user:string;castById:Record<string,Cast>}) {
  const wp = data.winnerPicks[user]||{} as any;
  const locked = wp.locked;
  const [p1,setP1] = useState(wp.pick1||"");
  const [p2,setP2] = useState(wp.pick2||"");
  const [p3,setP3] = useState(wp.pick3||"");

  useEffect(()=>{const w=data.winnerPicks[user]||{} as any;setP1(w.pick1||"");setP2(w.pick2||"");setP3(w.pick3||"");},[data.winnerPicks[user]?.locked]);

  const active = data.cast.filter(c=>c.status==="active");
  const used = [p1,p2,p3].filter(Boolean);

  const submit = async ()=>{
    if(!p1||!p2||!p3){flash("Select all 3");return;}
    const nd = {...data,winnerPicks:{...data.winnerPicks,[user]:{pick1:p1,pick2:p2,pick3:p3,locked:true}}};
    await save(nd);
    flash("⭐ Winner picks locked!");
  };

  const renderPick = (val:string,setter:(v:string)=>void,pts:number,rank:number) => {
    const c = castById[val];
    const elim = c?.status==="eliminated";
    return (
      <div className={card} style={{borderColor:val?"#b45309":"rgba(100,80,40,0.3)"}}>
        <div className="flex justify-between mb-2">
          <span className="text-amber-400 font-bold">#{rank} Pick — {pts} pts</span>
          {locked&&elim&&<span className="text-red-400 text-xs font-sans">❌ Eliminated</span>}
        </div>
        {locked ? <div className="text-base" style={{color:elim?"#78716c":"#fde68a",textDecoration:elim?"line-through":"none"}}>{c?.name||"Not set"}</div> :
          <select value={val} onChange={e=>setter(e.target.value)} className={inp+" cursor-pointer"}>
            <option value="">— Select —</option>
            {active.filter(m=>!used.includes(m.id)||m.id===val).map(m=><option key={m.id} value={m.id}>{m.name} ({m.tribe})</option>)}
          </select>
        }
      </div>
    );
  };

  return (
    <div>
      <h2 className="text-amber-400 text-xl mb-1">⭐ Top 3 Winner Picks</h2>
      <p className="text-[#b08040] text-sm font-sans mb-4">{locked?"Your picks are locked. Good luck!":"Pick your top 3 to WIN Survivor 50. Locked after submission!"}</p>
      {renderPick(p1,setP1,50,1)}
      {renderPick(p2,setP2,30,2)}
      {renderPick(p3,setP3,20,3)}
      {!locked && <button onClick={submit} disabled={!p1||!p2||!p3} className={`${btnPrimary} w-full py-3 text-base ${!p1||!p2||!p3?"opacity-50":""}`}>🔒 Lock In Winner Picks</button>}
    </div>
  );
}

function History({data,castById}:{data:GameData;castById:Record<string,Cast>}) {
  const weeks = [...data.weeks].reverse();
  if(!weeks.length) return <div className={card}><p className="text-[#b08040] text-center">No weeks yet.</p></div>;
  return (
    <div>
      <h2 className="text-amber-400 text-xl mb-4">📅 Weekly History</h2>
      {weeks.map(w => (
        <div key={w.num} className={card}>
          <div className="flex justify-between mb-3 flex-wrap gap-1">
            <span className="text-base font-bold text-amber-400">Week {w.num}</span>
            <span className={`text-xs font-sans ${w.scored?"text-emerald-300":"text-red-300"}`}>{w.scored?"Scored":"Pending"}</span>
          </div>
          {w.results && Object.entries(w.results).filter(([,v])=>v).length>0 &&
            <div className="mb-3 p-2 bg-[rgba(120,53,15,0.2)] rounded-lg">
              <span className="text-xs text-amber-600 font-sans">Eliminated: </span>
              {Object.entries(w.results).filter(([,v])=>v).map(([tribe,id])=><span key={tribe} className="text-sm mr-3" style={{color:TC[tribe]?.txt||"#ccc"}}>{castById[id!]?.name} ({tribe})</span>)}
            </div>
          }
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm font-sans">
              <thead><tr className="border-b border-[rgba(180,120,40,0.3)]">
                <th className="text-left p-1.5 text-[#d4a053]">Player</th>
                {Object.keys(w.results||{}).map(t=><th key={t} className="text-left p-1.5" style={{color:TC[t]?.txt||"#ccc"}}>{t}</th>)}
                <th className="text-right p-1.5 text-[#d4a053]">Pts</th>
              </tr></thead>
              <tbody>{data.players.map(p=>{
                const pv = data.votes[w.num]?.[p]||{};
                let pts=0;
                return <tr key={p} className="border-b border-[rgba(80,60,20,0.2)]">
                  <td className="p-1.5 text-[#fde68a]">{p}</td>
                  {Object.entries(w.results||{}).map(([tribe,elimId])=>{
                    const vote=pv[tribe];const correct=elimId&&vote===elimId;if(correct)pts+=5;
                    return <td key={tribe} className="p-1.5" style={{color:!vote?"#666":correct?"#6ee7b7":"#fca5a5"}}>{vote?castById[vote]?.name||"?":"—"} {vote&&(correct?"✅":"❌")}</td>;
                  })}
                  <td className="p-1.5 text-right text-amber-400 font-bold">{w.scored?pts:"—"}</td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      ))}
    </div>
  );
}

function AdminPanel({data,save,flash,adminTab,setAdminTab,castById,tribes}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;adminTab:string;setAdminTab:(t:string)=>void;castById:Record<string,Cast>;tribes:string[]}) {
  const tabs = [{id:"cast",label:"🏝️ Cast"},{id:"weeks",label:"📅 Weeks"},{id:"players",label:"👥 Players"},{id:"winner",label:"👑 Winner"}];
  return (
    <div>
      <h2 className="text-amber-400 text-xl mb-3">⚙️ Admin Panel</h2>
      <div className="flex gap-1 mb-4 flex-wrap">
        {tabs.map(t=><button key={t.id} onClick={()=>setAdminTab(t.id)} className={`${adminTab===t.id?btnPrimary:btnDark} text-sm px-3.5 py-2`}>{t.label}</button>)}
      </div>
      {adminTab==="cast" && <AdminCast data={data} save={save} flash={flash} tribes={tribes} />}
      {adminTab==="weeks" && <AdminWeeks data={data} save={save} flash={flash} castById={castById} />}
      {adminTab==="players" && <AdminPlayers data={data} save={save} flash={flash} />}
      {adminTab==="winner" && <AdminWinner data={data} save={save} flash={flash} castById={castById} />}
    </div>
  );
}

function AdminCast({data,save,flash,tribes}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;tribes:string[]}) {
  const [editId,setEditId] = useState<string|null>(null);
  const [editName,setEditName] = useState("");
  const [editTribe,setEditTribe] = useState("");
  const [newName,setNewName] = useState("");
  const [newTribe,setNewTribe] = useState(tribes[0]||"");
  const [newTribeName,setNewTribeName] = useState("");
  const allTribes = [...new Set(data.cast.map(c=>c.tribe))];

  return (
    <div>
      <div className={card}>
        <h3 className="text-amber-600 text-sm font-bold mb-2">Add New Tribe Name</h3>
        <div className="flex gap-2">
          <input value={newTribeName} onChange={e=>setNewTribeName(e.target.value)} placeholder="e.g. Merged Tribe" className={inp+" flex-1"} />
          <button onClick={()=>{if(!newTribeName.trim()) return; setNewTribe(newTribeName.trim());setNewTribeName("");flash("Tribe name set.");}} className={btnPrimary}>Add</button>
        </div>
      </div>
      <div className={card}>
        <h3 className="text-amber-600 text-sm font-bold mb-2">Add Cast Member</h3>
        <div className="flex gap-2 flex-wrap">
          <input value={newName} onChange={e=>setNewName(e.target.value)} placeholder="Name" className={inp+" flex-[2] min-w-[150px]"} />
          <select value={newTribe} onChange={e=>setNewTribe(e.target.value)} className={inp+" flex-1 min-w-[100px] cursor-pointer"}>
            {allTribes.map(t=><option key={t}>{t}</option>)}
            {newTribeName&&!allTribes.includes(newTribeName)&&<option value={newTribeName}>{newTribeName}</option>}
          </select>
          <button onClick={async()=>{if(!newName.trim()||!newTribe.trim()) return;const id="x"+Date.now();const nd={...data,cast:[...data.cast,{id,name:newName.trim(),tribe:newTribe,status:"active",weekOut:null}]};await save(nd);setNewName("");flash("✅ Added");}} className={btnPrimary}>Add</button>
        </div>
      </div>
      {allTribes.map(tribe=>{
        const tc = TC[tribe]||{bg:"#333",bdr:"#888",txt:"#ccc",lt:"#eee",label:tribe};
        const members = data.cast.filter(c=>c.tribe===tribe);
        return (
          <div key={tribe} className={card} style={{borderColor:tc.bdr,borderWidth:2}}>
            <h3 className="text-base font-bold mb-2.5" style={{color:tc.txt}}>{tc.label||tribe} ({members.filter(m=>m.status==="active").length} active)</h3>
            {members.map(m=>(
              <div key={m.id} className="flex items-center gap-2 py-1.5 border-b border-[rgba(80,60,20,0.15)] flex-wrap">
                {editId===m.id ? <>
                  <input value={editName} onChange={e=>setEditName(e.target.value)} className={inp+" flex-1 min-w-[120px]"} />
                  <select value={editTribe} onChange={e=>setEditTribe(e.target.value)} className={inp+" w-[100px] cursor-pointer"}>{allTribes.map(t=><option key={t}>{t}</option>)}</select>
                  <button onClick={async()=>{const nd={...data,cast:data.cast.map(c=>c.id===m.id?{...c,name:editName,tribe:editTribe}:c)};await save(nd);setEditId(null);flash("✅ Updated");}} className="bg-emerald-600 text-white text-xs px-2.5 py-1 rounded-lg cursor-pointer">Save</button>
                  <button onClick={()=>setEditId(null)} className="bg-[#78350f] text-white text-xs px-2.5 py-1 rounded-lg cursor-pointer">Cancel</button>
                </> : <>
                  <span className="flex-1 text-sm" style={{color:m.status==="eliminated"?"#78716c":"#fde68a",textDecoration:m.status==="eliminated"?"line-through":"none"}}>
                    {m.name} {m.status==="eliminated"&&`(Week ${m.weekOut})`}
                  </span>
                  <button onClick={()=>{setEditId(m.id);setEditName(m.name);setEditTribe(m.tribe);}} className="bg-[#78350f] text-white text-[11px] px-2 py-0.5 rounded cursor-pointer">Edit</button>
                  {m.status==="active" ?
                    <button onClick={async()=>{const wk=prompt("Eliminated in which week?",String(data.weeks.length||1));if(wk){const nd={...data,cast:data.cast.map(c=>c.id===m.id?{...c,status:"eliminated",weekOut:parseInt(wk)}:c)};await save(nd);flash("☠️ Eliminated");}}} className="bg-red-600 text-white text-[11px] px-2 py-0.5 rounded cursor-pointer">Eliminate</button>
                  : <button onClick={async()=>{const nd={...data,cast:data.cast.map(c=>c.id===m.id?{...c,status:"active",weekOut:null}:c)};await save(nd);flash("✅ Reactivated");}} className="bg-emerald-600 text-white text-[11px] px-2 py-0.5 rounded cursor-pointer">Reactivate</button>
                  }
                  <button onClick={async()=>{const nd={...data,cast:data.cast.filter(c=>c.id!==m.id)};await save(nd);flash("Removed");}} className="bg-[#555] text-white text-[11px] px-2 py-0.5 rounded cursor-pointer">✕</button>
                </>}
              </div>
            ))}
          </div>
        );
      })}
    </div>
  );
}

function AdminWeeks({data,save,flash,castById}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;castById:Record<string,Cast>}) {
  const [selResults,setSelResults] = useState<Record<string,string>>({});

  const createWeek = async () => {
    const num = data.weeks.length+1;
    const now = new Date();
    const wed = new Date(now);
    wed.setDate(wed.getDate()+((3-wed.getDay()+7)%7||7));
    wed.setHours(20,0,0,0);
    const tribes = [...new Set(data.cast.filter(c=>c.status==="active").map(c=>c.tribe))];
    const results: Record<string,null> = {};
    tribes.forEach(t=>results[t]=null);
    const nd = {...data,weeks:[...data.weeks,{num,deadline:wed.toISOString(),results,scored:false}]};
    await save(nd);
    flash(`✅ Week ${num} created!`);
  };

  return (
    <div>
      <button onClick={createWeek} className="bg-emerald-600 hover:bg-emerald-700 text-white font-semibold rounded-lg w-full py-3 mb-4 cursor-pointer">+ Create Week {data.weeks.length+1}</button>
      {[...data.weeks].reverse().map(w=>{
        const open = beforeDL(w.deadline);
        const activeTribes = Object.keys(w.results||{});
        return (
          <div key={w.num} className={card}>
            <div className="flex justify-between items-center mb-2.5 flex-wrap gap-1">
              <span className="text-base font-bold text-amber-400">Week {w.num}</span>
              <div className="flex gap-1.5 items-center">
                <span className={`text-xs font-sans ${open?"text-emerald-300":w.scored?"text-emerald-300":"text-red-300"}`}>{open?"Open":w.scored?"Scored":"Awaiting results"}</span>
                <button onClick={async()=>{const nd={...data,weeks:data.weeks.filter(x=>x.num!==w.num)};const nv={...nd.votes};delete nv[w.num];nd.votes=nv;await save(nd);flash("Deleted");}} className="bg-[#555] text-white text-[11px] px-2 py-0.5 rounded cursor-pointer">✕</button>
              </div>
            </div>
            <div className="mb-2.5">
              <label className="text-xs text-[#b08040] font-sans">Deadline:</label>
              <input type="datetime-local" value={w.deadline?.slice(0,16)||""} onChange={async e=>{const nd={...data,weeks:data.weeks.map(x=>x.num===w.num?{...x,deadline:e.target.value}:x)};await save(nd);flash("Updated");}} className={inp+" mt-1"} />
            </div>
            {!w.scored && <div>
              <p className="text-amber-600 text-sm mb-2 font-sans">Enter elimination results:</p>
              {activeTribes.map(tribe=>{
                const members = data.cast.filter(c=>c.tribe===tribe&&(c.status==="active"||(c.weekOut===w.num)));
                const tc = TC[tribe]||{txt:"#ccc",label:tribe};
                const key = `${w.num}-${tribe}`;
                return <div key={tribe} className="mb-2">
                  <label className="text-sm" style={{color:tc.txt}}>{tc.label||tribe}:</label>
                  <select value={selResults[key]||w.results?.[tribe]||""} onChange={e=>setSelResults(r=>({...r,[key]:e.target.value}))} className={inp+" mt-1 cursor-pointer"}>
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
              }} className="bg-emerald-600 text-white font-semibold rounded-lg px-4 py-2 text-sm mt-2 cursor-pointer">Score Week {w.num}</button>
            </div>}
            {w.scored && <div className="p-2 bg-[rgba(6,95,70,0.2)] rounded-lg">
              <span className="text-sm font-sans text-emerald-300">Results: </span>
              {Object.entries(w.results||{}).map(([tribe,id])=><span key={tribe} className="text-sm mr-2.5" style={{color:TC[tribe]?.txt||"#ccc"}}>{tribe}: {id?castById[id]?.name:"None"}</span>)}
            </div>}
            <div className="mt-2.5"><span className="text-xs text-[#8b7040] font-sans">Votes: {Object.keys(data.votes[w.num]||{}).length}/{data.players.length}</span></div>
          </div>
        );
      })}
    </div>
  );
}

function AdminPlayers({data,save,flash}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void}) {
  const [newP,setNewP] = useState("");
  return (
    <div>
      <div className={card}>
        <h3 className="text-amber-600 text-sm font-bold mb-2">Add Player ({data.players.length}/10)</h3>
        <div className="flex gap-2">
          <input value={newP} onChange={e=>setNewP(e.target.value)} placeholder="Player name" className={inp+" flex-1"} onKeyDown={async e=>{if(e.key==="Enter"&&newP.trim()&&!data.players.includes(newP.trim())){const nd={...data,players:[...data.players,newP.trim()]};await save(nd);setNewP("");flash("✅ Added");}}} />
          <button onClick={async()=>{if(!newP.trim()||data.players.includes(newP.trim())) return;const nd={...data,players:[...data.players,newP.trim()]};await save(nd);setNewP("");flash("✅ Added");}} disabled={data.players.length>=10} className={btnPrimary}>Add</button>
        </div>
      </div>
      <div className={card}>
        <h3 className="text-amber-600 text-sm font-bold mb-2">Current Players</h3>
        {data.players.length===0&&<p className="text-[#8b7040] text-sm">No players yet.</p>}
        {data.players.map(p=><div key={p} className="flex justify-between items-center py-2 border-b border-[rgba(80,60,20,0.15)]">
          <span className="text-[#fde68a] text-sm">{p}</span>
          <button onClick={async()=>{const nd={...data,players:data.players.filter(x=>x!==p)};await save(nd);flash("Removed");}} className="bg-red-600 text-white text-xs px-2.5 py-1 rounded cursor-pointer">Remove</button>
        </div>)}
      </div>
      <div className={card}>
        <h3 className="text-amber-600 text-sm font-bold mb-2">Unlock Winner Picks</h3>
        <p className="text-[#8b7040] text-xs font-sans mb-2">Unlock a player's picks so they can re-submit.</p>
        {data.players.map(p=>{const wp=data.winnerPicks[p];if(!wp?.locked) return null;return <div key={p} className="flex justify-between items-center py-1">
          <span className="text-[#fde68a] text-sm">{p}</span>
          <button onClick={async()=>{const nd={...data,winnerPicks:{...data.winnerPicks,[p]:{...wp,locked:false}}};await save(nd);flash(`Unlocked ${p}`);}} className="bg-[#78350f] text-white text-[11px] px-2.5 py-1 rounded cursor-pointer">Unlock</button>
        </div>;})}
      </div>
    </div>
  );
}

function AdminWinner({data,save,flash,castById}:{data:GameData;save:(d:GameData)=>Promise<void>;flash:(m:string)=>void;castById:Record<string,Cast>}) {
  const [sel,setSel] = useState(data.seasonWinner||"");
  return (
    <div className={card}>
      <h3 className="text-amber-600 text-sm font-bold mb-2">👑 Crown the Sole Survivor</h3>
      <p className="text-[#8b7040] text-xs font-sans mb-3">Set at end of season. Winner pick bonuses (50/30/20) apply to leaderboard.</p>
      {data.seasonWinner && <div className="p-3 bg-[rgba(120,53,15,0.3)] rounded-lg mb-3 text-center">
        <span className="text-lg text-amber-400">👑 {castById[data.seasonWinner]?.name}</span>
        <div><button onClick={async()=>{const nd={...data,seasonWinner:null};await save(nd);setSel("");flash("Cleared");}} className="bg-[#78350f] text-white text-xs px-3 py-1 rounded mt-2 cursor-pointer">Clear</button></div>
      </div>}
      <select value={sel} onChange={e=>setSel(e.target.value)} className={inp+" mb-3 cursor-pointer"}>
        <option value="">— Select Winner —</option>
        {data.cast.map(m=><option key={m.id} value={m.id}>{m.name} ({m.tribe})</option>)}
      </select>
      <button onClick={async()=>{if(!sel) return;const nd={...data,seasonWinner:sel};await save(nd);flash(`👑 ${castById[sel]?.name} crowned!`);}} disabled={!sel} className={`${btnPrimary} w-full ${!sel?"opacity-50":""}`}>Crown Sole Survivor</button>
    </div>
  );
}