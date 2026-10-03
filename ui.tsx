import {ReactNode} from 'react';
export type Sev='SAFE'|'LOW'|'MEDIUM'|'HIGH'|'CRITICAL';
export const SEV_COLOR:Record<Sev,string>={SAFE:'text-safe',LOW:'text-low',MEDIUM:'text-med',HIGH:'text-high',CRITICAL:'text-crit'};
export const Badge=({s}:{s?:string|null})=>{const k=((s||'SAFE').toUpperCase()) as Sev;return <span className={`rounded-full border border-current px-2.5 py-0.5 text-xs font-bold ${SEV_COLOR[k]||'text-mute'}`}>{k[0]+k.slice(1).toLowerCase()}</span>};
export const Card=({title,children,className=''}:{title?:string;children:ReactNode;className?:string})=><section className={`card ${className}`}>{title&&<h3 className="mb-3 text-sm font-semibold text-mute">{title}</h3>}{children}</section>;
export const Skeleton=()=><Card><div className="skel"/><div className="skel w-2/3"/><div className="skel w-5/6"/></Card>;
export const Empty=({t,s}:{t:string;s:string})=><div className="py-10 text-center text-mute"><b className="block text-white">{t}</b><span className="text-sm">{s}</span></div>;
export function Ring({value,invert=false,size=120}:{value:number;invert?:boolean;size?:number}){
  const k=invert?100-value:value,c=k>=80?'#3FB68B':k>=60?'#E8B04A':'#EF5B6B';
  return <svg width={size} height={size} viewBox="0 0 120 120" role="img" aria-label={`Score ${value}`}><circle cx="60" cy="60" r="50" fill="none" stroke="#223250" strokeWidth="10"/><circle cx="60" cy="60" r="50" fill="none" stroke={c} strokeWidth="10" strokeLinecap="round" strokeDasharray={`${3.14*value} 314`} transform="rotate(-90 60 60)"/><text x="60" y="68" textAnchor="middle" fontSize="28" fontWeight="800" fill="#fff">{value}</text></svg>;
}
export const EventRow=({e}:{e:{message:string;severity:string;createdAt?:string}})=><div className="flex items-start gap-3 border-b border-edge py-3 last:border-0"><span className={`mt-2 h-2 w-2 rounded-full bg-current ${SEV_COLOR[(e.severity as Sev)]||'text-mute'}`}/><div className="flex-1"><p className="text-sm">{e.message}</p><p className="text-xs text-mute">{e.createdAt?new Date(e.createdAt).toLocaleString():'just now'}</p></div><Badge s={e.severity}/></div>;
