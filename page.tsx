'use client';
import {use,useState} from 'react';
import {api} from '../../../../lib/api';
import {Badge,Card,Ring,Skeleton} from '../../../../components/ui';
const CFG:any={url:{t:'URL security scanner',ph:'https://example.com/login',type:'URL'},email:{t:'Email threat analyzer',ph:'Paste the full email text or headers',type:'EMAIL'},file:{t:'File scanner',type:'FILE'}};
async function sha256(f:File){const b=await crypto.subtle.digest('SHA-256',await f.arrayBuffer());return [...new Uint8Array(b)].map(x=>x.toString(16).padStart(2,'0')).join('')}
export default function Scan({params}:{params:Promise<{type:string}>}){
  const {type}=use(params);const c=CFG[type]||CFG.url;
  const [v,setV]=useState('');const [busy,setBusy]=useState(false);const [r,setR]=useState<any>(null);const [e,setE]=useState('');const [hash,setHash]=useState('');
  async function run(target:string){setBusy(true);setE('');setR(null);try{setR(await api('/scans',{method:'POST',body:JSON.stringify({type:c.type,target})}))}catch(x:any){setE(x.message)}setBusy(false)}
  async function pick(f?:File){if(!f)return;const h=await sha256(f);setHash(h);setV(`${f.name} (${(f.size/1024).toFixed(1)} KB)`);run(`${f.name}|${h}|${f.size}`)}
  const bad=r&&['MEDIUM','HIGH','CRITICAL'].includes(r.severity);
  return <><h1 className="text-3xl font-extrabold">{c.t}</h1>
    <Card>{c.type==='FILE'?<label className="block cursor-pointer rounded-xl border-2 border-dashed border-edge p-10 text-center hover:border-brand" onDragOver={x=>x.preventDefault()} onDrop={x=>{x.preventDefault();pick(x.dataTransfer.files[0])}}><b>Drop a file or click to browse</b><p className="text-sm text-mute">The file is hashed in your browser. Only the name, hash and size are sent.</p><input type="file" hidden onChange={x=>pick(x.target.files?.[0])}/></label>
    :<><label htmlFor="t" className="text-sm text-mute">{c.type==='URL'?'Link to check':'Email content'}</label>
      {c.type==='URL'?<input id="t" className="input mt-1" placeholder={c.ph} value={v} onChange={x=>setV(x.target.value)}/>:<textarea id="t" className="input mt-1 min-h-40" placeholder={c.ph} value={v} onChange={x=>setV(x.target.value)}/>}
      <button className="btn btn-p mt-3" disabled={busy||!v.trim()} onClick={()=>run(v.trim())}>{busy?'Scanning…':'Scan now'}</button></>}</Card>
    {busy&&<Skeleton/>}{e&&<Card><p role="alert" className="text-crit">Couldn’t complete the scan: {e}</p></Card>}
    {r&&<div className="grid gap-4 md:grid-cols-[auto_1fr]"><Card title="Risk score"><Ring value={r.score??0} invert/></Card>
      <Card title="Result"><div className="flex items-center gap-3"><Badge s={r.severity}/><b>{r.verdict}</b></div>{hash&&<p className="mt-2 break-all text-xs text-mute">SHA-256: {hash}</p>}<p className="mt-3">{r.explanation}</p>
        <h4 className="mt-4 text-sm font-semibold text-mute">Recommended actions</h4><ul className="list-disc pl-5 text-sm">{bad?<><li>Do not open, click or run it.</li><li>Report it as phishing or delete it.</li><li>If you interacted with it, change the affected password and enable MFA.</li></>:<><li>No action needed.</li><li>Keep MFA on for important accounts.</li></>}</ul></Card></div>}</>}
