import { NextResponse } from "next/server";

let memoryStore: any = null;

const INIT_DATA = {
  cast: [
    { id:"k1",name:"Charlie Davis",tribe:"Kalo",status:"active",weekOut:null },
    { id:"k2",name:"Tiffany Ervin",tribe:"Kalo",status:"active",weekOut:null },
    { id:"k3",name:"Chrissy Hofbeck",tribe:"Kalo",status:"active",weekOut:null },
    { id:"k4",name:"Kamilla Karthigesu",tribe:"Kalo",status:"active",weekOut:null },
    { id:"k5",name:"Dee Valladares",tribe:"Kalo",status:"active",weekOut:null },
    { id:"k6",name:"Coach Wade",tribe:"Kalo",status:"active",weekOut:null },
    { id:"k7",name:"Mike White",tribe:"Kalo",status:"active",weekOut:null },
    { id:"k8",name:"Jonathan Young",tribe:"Kalo",status:"active",weekOut:null },
    { id:"c1",name:"Rick Devens",tribe:"Cila",status:"active",weekOut:null },
    { id:"c2",name:"Cirie Fields",tribe:"Cila",status:"active",weekOut:null },
    { id:"c3",name:"Emily Flippen",tribe:"Cila",status:"active",weekOut:null },
    { id:"c4",name:"Christian Hubicki",tribe:"Cila",status:"active",weekOut:null },
    { id:"c5",name:"Joe Hunter",tribe:"Cila",status:"active",weekOut:null },
    { id:"c6",name:"Jenna Lewis-Dougherty",tribe:"Cila",status:"active",weekOut:null },
    { id:"c7",name:"Savannah Louie",tribe:"Cila",status:"active",weekOut:null },
    { id:"c8",name:"Ozzy Lusth",tribe:"Cila",status:"active",weekOut:null },
    { id:"v1",name:"Aubry Bracco",tribe:"Vatu",status:"active",weekOut:null },
    { id:"v2",name:"Q Burdette",tribe:"Vatu",status:"active",weekOut:null },
    { id:"v3",name:"Colby Donaldson",tribe:"Vatu",status:"active",weekOut:null },
    { id:"v4",name:"Kyle Fraser",tribe:"Vatu",status:"active",weekOut:null },
    { id:"v5",name:"Angelina Keeley",tribe:"Vatu",status:"active",weekOut:null },
    { id:"v6",name:"Stephenie LaGrossa",tribe:"Vatu",status:"active",weekOut:null },
    { id:"v7",name:"Genevieve Mushaluk",tribe:"Vatu",status:"active",weekOut:null },
    { id:"v8",name:"Rizo Velovic",tribe:"Vatu",status:"active",weekOut:null },
  ],
  players: [],
  weeks: [],
  votes: {},
  winnerPicks: {},
  seasonWinner: null,
};

async function getKV() {
  try {
    const { kv } = await import("@vercel/kv");
    return kv;
  } catch {
    return null;
  }
}

export async function GET() {
  try {
    const kv = await getKV();
    if (kv) {
      const data = await kv.get("acfl:gamedata");
      if (data) return NextResponse.json(data);
      await kv.set("acfl:gamedata", INIT_DATA);
      return NextResponse.json(INIT_DATA);
    }
    // Fallback to memory if KV not available
    if (!memoryStore) memoryStore = JSON.parse(JSON.stringify(INIT_DATA));
    return NextResponse.json(memoryStore);
  } catch (e) {
    console.error("GET error:", e);
    if (!memoryStore) memoryStore = JSON.parse(JSON.stringify(INIT_DATA));
    return NextResponse.json(memoryStore);
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const kv = await getKV();
    if (kv) {
      await kv.set("acfl:gamedata", body);
    } else {
      memoryStore = body;
    }
    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error("POST error:", e);
    return NextResponse.json({ error: "Failed to save" }, { status: 500 });
  }
}