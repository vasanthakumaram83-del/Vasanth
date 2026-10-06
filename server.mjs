import http from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash,randomBytes,scryptSync,timingSafeEqual} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.dirname(fileURLToPath(import.meta.url)), dataDir=path.join(root,'data'), dbFile=path.join(dataDir,'tracker.json');
const start='2026-09-30',end='2027-09-30';
const initial=()=>({users:[],tasks:[],journals:{},sleep:{},recovery:[],ledger:[],reminders:{},settings:{recoveryMode:'normal'}});
await mkdir(dataDir,{recursive:true}); let db; try{db=JSON.parse(await readFile(dbFile,'utf8'))}catch{db=initial()}
const save=()=>writeFile(dbFile,JSON.stringify(db,null,2));
const tasks=[['early','Early Morning Study','4:00–5:00 AM',1,'study',true],['run','Running','5:00–5:30 AM',.5,'exercise',false],['workout','Workout','5:30–5:45 AM',.25,'exercise',false],['yoga','Yoga','5:45–6:00 AM',.25,'exercise',false],['morning','Morning Study','6:00–7:00 AM',1,'study',true],['current','Current Affairs','Flexible · 30 min',.5,'learning',true],['evening1','Evening Study','4:00–6:00 PM',2,'study',true],['evening2','Evening Study','6:30–7:30 PM',1,'study',true],['english','English Learning','8:00–8:30 PM',.5,'learning',true],['night','Night Study','8:30–10:00 PM',1.5,'study',true]];
const dayNum=d=>Math.floor((Date.parse(d+'T00:00:00Z')-Date.parse(start+'T00:00:00Z'))/86400000)+1;
const within=d=>/^\d{4}-\d\d-\d\d$/.test(d)&&d>=start&&d<=end;
function send(res,status,obj,headers={}){res.writeHead(status,{'content-type':'application/json','cache-control':'no-store',...headers});res.end(JSON.stringify(obj))}
function cookie(req){return (req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('sid='))?.slice(4)}
const sessions=new Map();
async function body(req){let s='';for await(const c of req)s+=c;if(s.length>1e6)throw Error('Request too large');return s?JSON.parse(s):{}}
function user(req){const id=sessions.get(cookie(req));return db.users.find(u=>u.id===id)}
const server=http.createServer(async(req,res)=>{try{
 const url=new URL(req.url,'http://localhost');
 if(url.pathname==='/api/auth'&&req.method==='GET'){const u=user(req);return send(res,200,{authenticated:!!u,username:u?.name||'',registrationOpen:db.users.length===0,setupCodeRequired:false})}
 if(url.pathname==='/api/register'&&req.method==='POST'){const b=await body(req);if(!b.name||!b.password||b.password.length<10)return send(res,400,{error:'Use a name and a password of at least 10 characters.'});if(db.users.length)return send(res,409,{error:'This local instance already has an account. Sign in instead.'});const salt=randomBytes(16).toString('hex'),id=randomBytes(16).toString('hex');db.users.push({id,name:b.name,password:salt+':'+scryptSync(b.password,salt,64).toString('hex')});sessions.set(randomBytes(32).toString('hex'),id);const sid=[...sessions.keys()].at(-1);await save();return send(res,201,{ok:true},{'set-cookie':`sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`})}
 if(url.pathname==='/api/login'&&req.method==='POST'){const b=await body(req),u=db.users.find(x=>x.name===b.name);if(!u)return send(res,401,{error:'Name or password is incorrect.'});const [salt,hash]=u.password.split(':'),actual=scryptSync(b.password||'',salt,64);if(!timingSafeEqual(actual,Buffer.from(hash,'hex')))return send(res,401,{error:'Name or password is incorrect.'});const sid=randomBytes(32).toString('hex');sessions.set(sid,u.id);return send(res,200,{ok:true},{'set-cookie':`sid=${sid}; HttpOnly; SameSite=Strict; Path=/; Max-Age=2592000`})}
 if(url.pathname==='/api/logout'){sessions.delete(cookie(req));return send(res,200,{ok:true},{'set-cookie':'sid=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0'})}
 if(!url.pathname.startsWith('/api/')){const file=path.resolve(root,url.pathname==='/'?'index.html':'.'+url.pathname);if(!file.startsWith(root+path.sep))return send(res,403,{});try{const bytes=await readFile(file);res.writeHead(200,{'content-type':file.endsWith('.css')?'text/css':file.endsWith('.js')?'text/javascript':'text/html','cache-control':'no-store'});return res.end(bytes)}catch{return send(res,404,{error:'Not found'})}}
 const u=user(req);if(!u)return send(res,401,{error:'Sign in to continue.'});
 if(url.pathname==='/api/data'&&req.method==='GET')return send(res,200,{data:{tasks:db.tasks.filter(x=>x.uid===u.id),journals:db.journals[u.id]||{},sleep:db.sleep[u.id]||{},recovery:db.recovery.filter(x=>x.uid===u.id),ledger:db.ledger.filter(x=>x.uid===u.id),settings:db.settings[u.id]||{recoveryMode:'normal'},reminders:db.reminders[u.id]||{}}});
 if(url.pathname==='/api/data'&&req.method==='PUT'){const b=await body(req);if(b.tasks)db.tasks=db.tasks.filter(x=>x.uid!==u.id).concat(b.tasks.filter(x=>within(x.date)).map(x=>({...x,uid:u.id})));if(b.journals)db.journals[u.id]=b.journals;if(b.sleep)db.sleep[u.id]=b.sleep;if(b.recovery)db.recovery=db.recovery.filter(x=>x.uid!==u.id).concat(b.recovery.map(x=>({...x,uid:u.id})));if(b.ledger)db.ledger=db.ledger.filter(x=>x.uid!==u.id).concat(b.ledger.map(x=>({...x,uid:u.id})));if(b.settings)db.settings[u.id]=b.settings;if(b.reminders)db.reminders[u.id]=b.reminders;await save();return send(res,200,{ok:true})}
 return send(res,404,{error:'Not found'});
 }catch(e){send(res,400,{error:e.message||'Request failed'})}});
const requestedPort=Number(process.env.PORT||3000);
async function listen(port){return new Promise((resolve,reject)=>{const onError=e=>{server.off('listening',onListen);reject(e)},onListen=()=>{server.off('error',onError);resolve(server.address().port)};server.once('error',onError);server.once('listening',onListen);server.listen(port)})}
let activePort;
for(let port=requestedPort;port<requestedPort+100;port++){try{activePort=await listen(port);break}catch(e){if(e.code!=='EADDRINUSE')throw e}}
if(activePort===undefined)activePort=await listen(0);
console.log(`Discipline tracker at http://127.0.0.1:${activePort}`);
export {dayNum,within,tasks,start,end};
