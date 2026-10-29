// Static login/editor frontend only — no administrative REST endpoints.
// Authentication and editing are enforced by Supabase Auth + PostgreSQL RPC.
import html from './index.html.ts';
import style from './studio.css.ts';
import script from './studio.js.ts';
import config from './config.js.ts';

const documents = new Map<string,{body:string;type:string}>([
  ['index.html',{body:html,type:'text/html; charset=utf-8'}],
  ['studio.css',{body:style,type:'text/css; charset=utf-8'}],
  ['studio.js',{body:script,type:'text/javascript; charset=utf-8'}],
  ['config.js',{body:config,type:'text/javascript; charset=utf-8'}]
]);
const headers: Record<string,string> = {
  'Cache-Control':'no-store',
  'X-Content-Type-Options':'nosniff',
  'Referrer-Policy':'no-referrer',
  'X-Frame-Options':'DENY',
  'Cross-Origin-Opener-Policy':'same-origin',
  'Permissions-Policy':'camera=(), microphone=(), geolocation=(), payment=()',
  'Strict-Transport-Security':'max-age=31536000; includeSubDomains',
  'Content-Security-Policy': "default-src 'none'; script-src 'self'; style-src 'self'; img-src 'self' data:; connect-src https://astcatgvvliatokqalhd.supabase.co; font-src 'self'; base-uri 'none'; form-action 'none'; object-src 'none'; frame-ancestors 'none'"
};
Deno.serve((request:Request):Response=>{
  if(request.method!=='GET'&&request.method!=='HEAD')
    return new Response('Method not allowed',{status:405,headers:{...headers,Allow:'GET, HEAD'}});
  const url=new URL(request.url);
  if(url.pathname.endsWith('/partyjniak-studio'))
    return Response.redirect(url.origin+url.pathname+'/',308);
  const filename=url.pathname.split('/').at(-1)||'index.html';
  const doc=documents.get(filename);
  if(!doc)return new Response('Not found',{status:404,headers});
  return new Response(request.method==='HEAD'?null:doc.body,{
    status:200,headers:{...headers,'Content-Type':doc.type}
  });
});
