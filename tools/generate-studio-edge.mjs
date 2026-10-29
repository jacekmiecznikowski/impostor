#!/usr/bin/env node
// Run node tools/generate-studio-edge.mjs after editing admin assets.
// It copies source into deterministic Deno TypeScript string modules.
// Deployment: supabase functions deploy partyjniak-studio --no-verify-jwt
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const files=['index.html','studio.css','studio.js','config.js'];
for(const name of files){
  const input=await readFile(path.join(root,'admin',name),'utf8');
  const output='export default '+JSON.stringify(input)+';\n';
  const dest=path.join(root,'supabase','functions','partyjniak-studio',name+'.ts');
  if(process.argv.includes('--check')){
    const current=await readFile(dest,'utf8');
    if(current!==output)throw new Error('Outdated Edge bundle asset: '+name);
  } else {
    await writeFile(dest,output);
  }
}
console.log(process.argv.includes('--check')?'Edge asset bundle up to date':'Wrote Edge asset bundle');
