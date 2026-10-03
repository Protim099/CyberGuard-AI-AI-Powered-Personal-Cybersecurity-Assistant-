const BASE=process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000';
export const token=()=>typeof window!=='undefined'?localStorage.getItem('cg_token'):null;
export async function api<T=any>(path:string,opt:RequestInit={}):Promise<T>{
  const r=await fetch(`${BASE}/api${path}`,{...opt,headers:{'Content-Type':'application/json',...(token()?{Authorization:`Bearer ${token()}`}:{}),...opt.headers}});
  if(r.status===401&&typeof window!=='undefined'&&!path.startsWith('/auth')){localStorage.removeItem('cg_token');location.href='/auth'}
  const j=await r.json().catch(()=>({}));if(!r.ok)throw new Error(j.error||'Request failed');return j;
}
