'use client';
import Link from 'next/link';
import {usePathname,useRouter} from 'next/navigation';
import {useEffect,useState} from 'react';
import {LayoutDashboard,Bot,Link2,Mail,FileSearch,KeyRound,Activity,Menu,ShieldCheck,LogOut} from 'lucide-react';
import {token} from '../../lib/api';
import {getSocket} from '../../lib/socket';
import {Badge} from '../../components/ui';
const NAV=[['/dashboard','Dashboard',LayoutDashboard],['/assistant','AI Assistant',Bot],['/scan/url','URL Scanner',Link2],['/scan/email','Email Analyzer',Mail],['/scan/file','File Scanner',FileSearch],['/password','Password Security',KeyRound],['/monitoring','Monitoring',Activity]] as const;
export default function AppLayout({children}:{children:React.ReactNode}){
  const path=usePathname(),r=useRouter();const [open,setOpen]=useState(false);const [toasts,setT]=useState<any[]>([]);const [ok,setOk]=useState(false);
  useEffect(()=>{if(!token())return void r.replace('/auth');setOk(true);
    const s=getSocket();const h=(e:any)=>{const id=Date.now();setT(t=>[...t,{id,...e}]);setTimeout(()=>setT(t=>t.filter(x=>x.id!==id)),4000)};
    s.on('security:event',h);return()=>{s.off('security:event',h)}},[r]);
  if(!ok)return null;
  return <div className="bg-grid min-h-screen md:grid md:grid-cols-[250px_1fr]">
    <aside className={`fixed inset-y-0 left-0 z-30 w-64 border-r border-edge bg-panel p-4 transition-transform md:sticky md:top-0 md:h-screen md:translate-x-0 ${open?'':'-translate-x-full'}`}>
      <b className="mb-6 flex items-center gap-2 text-lg"><ShieldCheck className="text-brand"/>CyberGuard AI</b>
      <nav className="grid gap-1">{NAV.map(([h,l,I])=><Link key={h} href={h} onClick={()=>setOpen(false)} className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm ${path===h?'bg-white/10 text-white shadow-[inset_3px_0_#5B8CFF]':'text-mute hover:bg-white/5'}`}><I size={18}/>{l}</Link>)}</nav>
      <button className="btn mt-6 w-full" onClick={()=>{localStorage.clear();r.push('/')}}><LogOut size={16}/>Log out</button></aside>
    <div className="min-w-0"><header className="sticky top-0 z-20 flex items-center gap-3 border-b border-edge bg-ink/80 px-4 py-3 backdrop-blur md:px-8"><button className="btn md:hidden" aria-label="Menu" onClick={()=>setOpen(!open)}><Menu size={18}/></button><span className="flex-1"/><span className="text-sm text-safe">● Protected</span></header>
      <main className="mx-auto max-w-6xl space-y-4 p-4 md:p-8">{children}</main></div>
    <div className="fixed bottom-4 right-4 z-50 grid gap-2" aria-live="polite">{toasts.map(t=><div key={t.id} className="card flex items-center gap-3 !p-3 text-sm"><Badge s={t.severity}/>{t.message}</div>)}</div></div>}
