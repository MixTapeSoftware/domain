#!/usr/bin/env node
// Recall test for the domain index.
//
// Each case in cases/*.json is a ticket, the branch and paths someone would work
// on for it, and the decision IDs that mattered. For each case this script works
// out the bounded contexts the way the index does (paths from the project
// config, then the branch name) and checks how many of those decision IDs are in
// the tier-2 titles the index would load. It also reports how big each bounded
// context's titles are against the index budget.
//
// A falling score, or one bounded context outgrowing the budget, is the signal
// to add an embedded (keyword + vector) index. See README.md.
//
//   node evals/recall/score.mjs [--config path/to/.domain/config.json] [--cases dir] [--json]
//
// Needs the same NOTION_TOKEN as the hooks.

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  contextNames,
  contextsFromBranch,
  contextsFromPaths,
  createNotion,
  estimateTokens,
  findConfig,
  loadConfig,
  loadSchemas,
  queryRows,
  titleLine,
  workingSet,
} from '../../scripts/domain-index.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
const plural = (n, word) => `${n} ${word}${n === 1 ? '' : 's'}`;

function parseArgs(argv) {
  const args = { config: null, cases: path.join(here, 'cases'), json: false };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === '--config') args.config = path.resolve(argv[++i]);
    else if (argv[i] === '--cases') args.cases = path.resolve(argv[++i]);
    else if (argv[i] === '--json') args.json = true;
  }
  return args;
}

export function scoreCase(testCase, cfg, names, rows) {
  const canonical = (n) => names.find((k) => k.toLowerCase() === n.toLowerCase());
  let contexts = contextsFromPaths(cfg.boundedContexts, testCase.paths || []).map(canonical).filter(Boolean);
  let from = 'paths';
  if (!contexts.length) {
    contexts = contextsFromBranch(cfg.boundedContexts, names, testCase.branch).map(canonical).filter(Boolean);
    from = 'branch';
  }
  if (!contexts.length) from = 'none worked out: every title, if they fit the budget';
  const set = workingSet(rows, contexts.length ? [...new Set(contexts)] : 'all');
  const loaded = new Set(set.decisions.map((r) => r.uid));
  const expected = testCase.decisions || [];
  const found = expected.filter((id) => loaded.has(id));
  const missing = expected
    .filter((id) => !loaded.has(id))
    .map((id) => {
      const row = rows.decisions.find((r) => r.uid === id);
      return row ? `${id} [${row.bcs.join(', ') || 'no bounded context'}${row.status ? `, ${row.status}` : ''}]` : `${id} [not found in Notion]`;
    });
  return { contexts: [...new Set(contexts)], from, expected, found, missing };
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const file = args.config || findConfig(process.cwd());
  if (!file) throw new Error('No .domain/config.json found. Pass --config or run from the project.');
  const cfg = loadConfig(file);
  if (cfg.problems.length) throw new Error(`${file}: ${cfg.problems.join('; ')}`);
  const token = process.env[cfg.tokenEnv];
  if (!token) throw new Error(`$${cfg.tokenEnv} isn't set.`);

  const notion = createNotion({ token, base: cfg.apiBase, timeoutMs: 30000, tokenEnv: cfg.tokenEnv });
  const schemas = await loadSchemas(notion, cfg, ['decisions', 'requirements']);
  const [decisions, requirements] = await Promise.all([queryRows(notion, schemas.decisions), queryRows(notion, schemas.requirements)]);
  const rows = { decisions, requirements };
  const names = contextNames(schemas);

  const files = fs.readdirSync(args.cases).filter((f) => f.endsWith('.json')).sort();
  const results = files.map((f) => {
    const testCase = JSON.parse(fs.readFileSync(path.join(args.cases, f), 'utf8'));
    return { case: f.replace(/\.json$/, ''), ...scoreCase(testCase, cfg, names, rows) };
  });
  const expected = results.reduce((n, r) => n + r.expected.length, 0);
  const found = results.reduce((n, r) => n + r.found.length, 0);

  const sizes = names.map((bc) => {
    const set = workingSet(rows, [bc]);
    const text = [...set.decisions, ...set.requirements].map((r) => `- ${titleLine(r, false)}`).join('\n');
    return { boundedContext: bc, decisions: set.decisions.length, requirements: set.requirements.length, tokens: estimateTokens(text) };
  });

  if (args.json) {
    process.stdout.write(`${JSON.stringify({ recall: expected ? found / expected : null, found, expected, results, sizes, budgetTokens: cfg.index.budgetTokens }, null, 2)}\n`);
    return;
  }
  const out = ['Recall: decisions that mattered, found in the tier-2 titles for the bounded contexts worked out', ''];
  const width = Math.max(...results.map((r) => r.case.length), 4);
  for (const r of results) {
    const where = r.contexts.length ? `${r.contexts.join(', ')} (from ${r.from})` : r.from;
    out.push(`${r.case.padEnd(width)}  ${String(r.found.length).padStart(2)}/${r.expected.length}  ${where}`);
    if (r.missing.length) out.push(`${''.padEnd(width)}        missing ${r.missing.join('; ')}`);
  }
  out.push('', `Overall: ${found}/${expected}${expected ? ` = ${Math.round((found / expected) * 100)}%` : ''}`, '');
  out.push(`Tier-2 titles per bounded context (the whole index aims for ${cfg.index.budgetTokens} tokens):`);
  for (const s of sizes) {
    const flag = s.tokens > cfg.index.budgetTokens / 3 ? '  <- more than a third of the budget' : '';
    out.push(`  ${s.boundedContext}: ${plural(s.decisions, 'decision')}, ${plural(s.requirements, 'requirement')}, about ${s.tokens} tokens${flag}`);
  }
  out.push(`  (${notion.stats().requests} Notion requests)`);
  process.stdout.write(`${out.join('\n')}\n`);
}

if (process.argv[1] && fs.realpathSync(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((err) => {
    process.stderr.write(`${err.message}\n`);
    process.exitCode = 1;
  });
}
