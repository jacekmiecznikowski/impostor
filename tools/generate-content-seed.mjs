#!/usr/bin/env node
// Reproducible initial import of ALL seven games into Supabase.
// Run after applying migrations/20261029_content_studio.sql.
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
import vm from 'node:vm';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const read = file => readFile(path.join(root, file), 'utf8');

export async function collectGameContent() {
  const ids = ['co-mam-na-mysli','dzika-karta','naokolo','synchronizacja','ticking-bomb','trzy-w-piec'];
  const packs = await Promise.all(ids.map(id => read(`content/${id}.pl.json`).then(JSON.parse)));

  // This is bundled, trusted repository code; never execute remote text here.
  const script = await read('assets/js/games/impostor/data.js');
  const { WORD_DATABASE, CATEGORY_NAMES, DISCUSSION_TIPS } = vm.runInNewContext(
    `${script}\n({WORD_DATABASE,CATEGORY_NAMES,DISCUSSION_TIPS})`, Object.create(null), { timeout: 1000 }
  );
  const impostor = {
    schemaVersion: 1, game: 'impostor', locale: 'pl',
    categories: Object.entries(WORD_DATABASE).map(([id, words]) => ({
      id, name: CATEGORY_NAMES[id]?.name || id,
      icon: CATEGORY_NAMES[id]?.icon || 'fa-layer-group',
      desc: CATEGORY_NAMES[id]?.desc || '', words: JSON.parse(JSON.stringify(words))
    })),
    discussionTips: [...DISCUSSION_TIPS]
  };
  return [impostor, ...packs].sort((a,b) => a.game.localeCompare(b.game));
}

export function toSeedSql(documents) {
  const quote = s => String(s).replaceAll("'", "''");
  return [
    '-- Generated from the actual game packs by node tools/generate-content-seed.mjs',
    '-- Non-destructive: existing edited documents are never overwritten.',
    'begin;', '',
    ...documents.map(doc => {
      if (doc.game === 'dzika-karta') {
        if (doc.prompts?.length < 3 || doc.answers?.length < 10) throw new Error('Dzika Karta is incomplete.');
      } else if (!doc.categories?.length) throw new Error(`Missing categories in ${doc.game}`);
      const payload = quote(JSON.stringify(doc));
      return `insert into public.party_content_documents (game_id, locale, draft, published, revision, published_revision, published_at)
values ('${quote(doc.game)}', '${quote(doc.locale)}', '${payload}'::jsonb,
        '${payload}'::jsonb, 1, 1, now())
on conflict (game_id, locale) do nothing;\n`;
    }),
    'commit;', ''
  ].join('\n');
}

const directRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (directRun) {
  const documents = await collectGameContent();
  const seed = toSeedSql(documents);
  const filepath = path.join(root,'supabase','seed.sql');
  if (process.argv.includes('--check')) {
    const committed = await readFile(filepath,'utf8');
    if (committed !== seed) throw new Error('Seed is stale. Run node tools/generate-content-seed.mjs.');
    console.log('Content seed is current:',documents.map(d => d.game).join(', '));
  } else {
    await writeFile(filepath,seed);
    console.log('Generated initial Supabase seed for',documents.length,'games.');
  }
}
