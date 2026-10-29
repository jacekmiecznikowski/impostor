import http from 'node:http';
import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
const directory = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../admin');
const files = {
  '/':['index.html','text/html; charset=utf-8'],
  '/index.html':['index.html','text/html; charset=utf-8'],
  '/studio.css':['studio.css','text/css; charset=utf-8'],
  '/studio.js':['studio.js','text/javascript; charset=utf-8']
};
http.createServer(async(req,res)=>{
  const pathname = new URL(req.url,'http://localhost').pathname;
  const item = files[pathname];
  if(!item){res.writeHead(404,{'Content-Type':'text/plain'}).end('Not found');return;}
  try{
    const data=await readFile(path.join(directory,item[0]));
    res.writeHead(200,{
      'Content-Type':item[1], 'Cache-Control':'no-store',
      'X-Content-Type-Options':'nosniff','Referrer-Policy':'no-referrer'
    }).end(data);
  }catch(error){res.writeHead(500).end('Server error');console.error(error);}
}).listen(4174,'127.0.0.1',()=>console.log('Content Studio: http://127.0.0.1:4174'));
