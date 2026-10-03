'use client';
import {Suspense,useState} from 'react';
import {useRouter,useSearchParams} from 'next/navigation';
import {ShieldCheck} from 'lucide-react';
import {api} from '../../lib/api';
function Form(){
  const r=useRouter(),q=useSearchParams();const [reg,setReg]=useState(q.get('mode')==='register');
  const [f,setF]=useState({name:'',email:'',password:''});const [e,setE]=useState('');const [b,setB]=useState(false);
  async function go(){setB(true);setE('');try{const d=await api(`/auth/${reg?'register':'login'}`,{method:'POST',body:JSON.stringify(f)});localStorage.setItem('cg_token',d.token);localStorage.setItem('cg_user',JSON.stringify(d.user));r.push('/dashboard')}catch(x:any){setE(x.message)}setB(false)}
  return <div className="bg-grid grid min-h-screen place-items-center p-5"><div className="card w-full max-w-md"><b className="mb-4 flex items-center gap-2"><ShieldCheck className="text-brand"/>CyberGuard AI</b>
  <h1 className="text-2xl font-extrabold">{reg?'Create your account':'Welcome back'}</h1><p className="mb-4 text-sm text-mute">Passwords are hashed with bcrypt and never stored in plain text.</p>
  {reg&&<><label className="text-sm text-mute" htmlFor="n">Full name</label><input id="n" className="input mb-3" value={f.name} onChange={x=>setF({...f,name:x.target.value})}/></>}
  <label className="text-sm text-mute" htmlFor="e">Email</label><input id="e" type="email" className="input mb-3" value={f.email} onChange={x=>setF({...f,email:x.target.value})}/>
  <label className="text-sm text-mute" htmlFor="p">Password (8+ characters)</label><input id="p" type="password" className="input" value={f.password} onChange={x=>setF({...f,password:x.target.value})}/>
  {e&&<p role="alert" className="mt-3 text-sm text-crit">{e}</p>}
  <button className="btn btn-p mt-5 w-full justify-center" disabled={b} onClick={go}>{b?'Please wait…':reg?'Create account':'Log in'}</button>
  <button className="mt-4 text-sm text-mute underline" onClick={()=>setReg(!reg)}>{reg?'I already have an account':'Create an account'}</button></div></div>}
export default function Auth(){return <Suspense><Form/></Suspense>}
