import {io,Socket} from 'socket.io-client';
let s:Socket|null=null;
export function getSocket(){
  if(!s){s=io(process.env.NEXT_PUBLIC_API_URL||'http://localhost:4000');
    s.on('connect',()=>{const u=JSON.parse(localStorage.getItem('cg_user')||'null');if(u)s!.emit('join',u.id)})}
  return s;
}
