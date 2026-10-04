import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import http from 'http';
import { Server } from 'socket.io';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { z } from 'zod';

const prisma = new PrismaClient();
const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000' } });

app.use(helmet());
app.use(cors({ origin: process.env.FRONTEND_URL || 'http://localhost:3000' }));
app.use(express.json({ limit: '1mb' }));
app.use(rateLimit({ windowMs: 60_000, limit: 100 }));

const JWT_SECRET = process.env.JWT_SECRET || 'development-only-secret';

function sign(userId: string) { return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '7d' }); }
function auth(req: any, res: any, next: any) {
  const token = req.headers.authorization?.replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Authentication required' });
  try { req.userId = (jwt.verify(token, JWT_SECRET) as any).userId; next(); }
  catch { return res.status(401).json({ error: 'Invalid or expired token' }); }
}

const authSchema = z.object({ email: z.string().email(), password: z.string().min(8), name: z.string().min(2).max(80).optional() });
const scanSchema = z.object({ type: z.enum(['URL','EMAIL','FILE','PASSWORD']), target: z.string().max(10000).optional() });

app.get('/api/health', (_req,res)=>res.json({ok:true,service:'cyberguard-backend'}));

app.post('/api/auth/register', async (req,res)=>{
  const parsed = authSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({error:'Invalid registration data'});
  const {email,password,name} = parsed.data;
  const exists = await prisma.user.findUnique({where:{email}});
  if (exists) return res.status(409).json({error:'Account already exists'});
  const passwordHash = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({data:{email,name:name || email.split('@')[0],passwordHash}});
  res.status(201).json({token:sign(user.id),user:{id:user.id,email:user.email,name:user.name}});
});

app.post('/api/auth/login', async (req,res)=>{
  const parsed = authSchema.pick({email:true,password:true}).safeParse(req.body);
  if (!parsed.success) return res.status(400).json({error:'Invalid login data'});
  const user = await prisma.user.findUnique({where:{email:parsed.data.email}});
  if (!user || !(await bcrypt.compare(parsed.data.password,user.passwordHash))) return res.status(401).json({error:'Invalid credentials'});
  res.json({token:sign(user.id),user:{id:user.id,email:user.email,name:user.name}});
});

function localUrlRisk(target: string) {
  try {
    const u = new URL(target);
    let score = 10;
    const reasons:string[] = [];
    if (u.protocol !== 'https:') { score += 25; reasons.push('The URL does not use HTTPS.'); }
    if (u.hostname.includes('xn--')) { score += 25; reasons.push('Punycode domain detected.'); }
    if (u.hostname.split('.').length > 4) { score += 10; reasons.push('Unusually deep subdomain structure.'); }
    if (/[^\x00-\x7F]/.test(u.hostname)) { score += 20; reasons.push('Non-ASCII hostname detected.'); }
    if (u.username || u.password) { score += 20; reasons.push('Credential-like URL syntax detected.'); }
    score = Math.min(score,100);
    return {score, severity: score>=80?'HIGH':score>=55?'MEDIUM':score>=25?'LOW':'SAFE', verdict:score>=55?'SUSPICIOUS':'LOW RISK', reasons};
  } catch { return {score:100,severity:'CRITICAL',verdict:'INVALID URL',reasons:['The supplied value is not a valid URL.']}; }
}

app.post('/api/scans', auth, async (req:any,res)=>{
  const parsed = scanSchema.safeParse(req.body);
  if (!parsed.success) return res.status(400).json({error:'Invalid scan request'});
  const {type,target} = parsed.data;
  const scan = await prisma.scan.create({data:{userId:req.userId,type,target:type==='PASSWORD'?null:target,status:'RUNNING'}});
  let result:any = {score:50,severity:'MEDIUM',verdict:'REVIEW REQUIRED',explanation:'Analysis completed using the local defensive engine.',metadata:{}};
  if (type === 'URL' && target) {
    const r = localUrlRisk(target);
    result = {...r, explanation:r.reasons.length ? r.reasons.join(' ') : 'No obvious local heuristic indicators were found.'};
  }
  if (type === 'EMAIL' && target) {
    const indicators = ['verify your account','urgent','password','click here','payment','login'].filter(x=>target.toLowerCase().includes(x));
    const score = Math.min(95, 15 + indicators.length*13);
    result = {score,severity:score>=80?'HIGH':score>=55?'MEDIUM':'LOW',verdict:score>=55?'SUSPICIOUS':'LOW RISK',
      explanation: indicators.length ? `Detected ${indicators.length} suspicious language indicator(s): ${indicators.join(', ')}.` : 'No common phishing-language indicators were detected by the local heuristic engine.',
      metadata:{indicators}};
  }
  if (type === 'FILE' && target) {
    const [name='',hash='',size='0'] = target.split('|');
    const risky = /\.(exe|scr|bat|js|vbs|ps1|jar|msi)$/i.test(name) || /\.\w+\.(exe|scr|bat)$/i.test(name);
    const score = risky ? 78 : 12;
    result = {score,severity:risky?'HIGH':'SAFE',verdict:risky?'POTENTIALLY MALICIOUS':'NO THREATS FOUND',
      explanation: risky ? 'Executable or script files can run code on your device. Do not open it unless you fully trust the sender.' : 'No risky file type or double-extension pattern was found. This is a local heuristic check, not a full antivirus scan.',
      metadata:{name,sha256:hash,size:Number(size)}};
  }
  if (type === 'PASSWORD') {
    const p = target || '';
    const score = Math.min(100, (p.length>=12?45:20) + (/[A-Z]/.test(p)?15:0) + (/[a-z]/.test(p)?10:0) + (/\d/.test(p)?15:0) + (/[^\w]/.test(p)?15:0));
    result = {score,severity:score>=80?'SAFE':score>=55?'LOW':'HIGH',verdict:score>=80?'STRONG':'WEAK',
      explanation:'This local check evaluates password complexity only. Raw passwords are not stored.'};
  }
  const updated = await prisma.scan.update({where:{id:scan.id},data:{status:'COMPLETED',score:result.score,severity:result.severity,verdict:result.verdict,explanation:result.explanation,metadata:result.metadata,completedAt:new Date()}});
  await prisma.securityEvent.create({data:{userId:req.userId,type:`${type}_SCAN`,message:`${type} scan completed: ${result.verdict}`,severity:result.severity}});
  io.to(req.userId).emit('security:event',{type:`${type}_SCAN`,message:`${type} scan completed: ${result.verdict}`,severity:result.severity});
  res.status(201).json(updated);
});

app.get('/api/dashboard', auth, async (req:any,res)=>{
  const [scans,alerts,events] = await Promise.all([
    prisma.scan.findMany({where:{userId:req.userId},orderBy:{createdAt:'desc'},take:8}),
    prisma.alert.findMany({where:{userId:req.userId},orderBy:{createdAt:'desc'},take:5}),
    prisma.securityEvent.findMany({where:{userId:req.userId},orderBy:{createdAt:'desc'},take:10})
  ]);
  const scores = scans.filter(s=>s.score!==null).map(s=>s.score as number);
  const risk = scores.length ? Math.round(scores.reduce((a,b)=>a+b,0)/scores.length) : 82;
  res.json({securityScore:100-risk,scans,alerts,events});
});


app.get('/api/scans', auth, async (req:any,res)=>res.json(await prisma.scan.findMany({where:{userId:req.userId},orderBy:{createdAt:'desc'},take:50})));
app.get('/api/alerts', auth, async (req:any,res)=>res.json(await prisma.alert.findMany({where:{userId:req.userId},orderBy:{createdAt:'desc'},take:50})));
app.patch('/api/alerts/:id/read', auth, async (req:any,res)=>{
  await prisma.alert.updateMany({where:{id:req.params.id,userId:req.userId},data:{read:true}});
  res.json({ok:true});
});
function localReply(q:string){
  if (/phish/i.test(q)) return 'Phishing is a fake message or site that tricks you into giving away logins or money. Check the sender address, do not click urgent links, and scan suspicious URLs with the URL Scanner.';
  if (/password/i.test(q)) return 'Use a password manager with long, unique passphrases, never reuse passwords, and turn on multi-factor authentication for email and banking.';
  if (/improve|secur/i.test(q)) return 'Three quick wins: enable MFA on important accounts, replace reused passwords, and keep your devices updated.';
  return 'I can help with phishing, passwords, malware and account safety. Try asking about one of those.';
}
app.post('/api/assistant', auth, async (req:any,res)=>{
  const p = z.object({message:z.string().min(1).max(2000)}).safeParse(req.body);
  if (!p.success) return res.status(400).json({error:'Message is required'});
  try {
    const r = await fetch((process.env.AI_SERVICE_URL||'http://localhost:8000')+'/chat',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({message:p.data.message})});
    if (r.ok) return res.json(await r.json());
  } catch {}
  res.json({reply:localReply(p.data.message),source:'local'});
});

io.on('connection', socket => {
  socket.on('join', (userId:string) => socket.join(userId));
});
server.listen(Number(process.env.PORT)||4000,()=>console.log(`CyberGuard API running on ${process.env.PORT||4000}`));
