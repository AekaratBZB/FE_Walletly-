#!/usr/bin/env node
/**
 * Keeps the whole-file code blocks in the plan documents identical to the
 * files they describe.
 *
 * Why this exists: the plans under docs/superpowers/plans/ embed complete
 * source for every file they create. That was useful while building, but it
 * duplicates the code, and duplicated code drifts. This branch's plans drifted
 * behind seven fix passes, and re-applying them verbatim would have
 * reintroduced defects the reviews had already caught — including an attack
 * step that destroyed 167,500 THB of a verified portfolio's surplus.
 *
 * Only blocks a human explicitly marked are synced. A marker looks like this,
 * on its own line immediately before the fence:
 *
 *   <!-- sync:src/features/debt/StrategyPanel.jsx -->
 *   ```jsx
 *   ...the file's contents...
 *   ```
 *
 * Opting in per block matters because not every whole-file block is meant to
 * match the shipped file. Task 6 deliberately ships a stub DebtTab that Task 11
 * replaces; syncing that stub to the final component would make Task 6's own
 * step incoherent. Unmarked blocks are history and are left alone.
 *
 * Usage:
 *   node scripts/sync-plan-code.mjs           rewrite drifted blocks
 *   node scripts/sync-plan-code.mjs --check   report drift, exit 1 if any
 *   node scripts/sync-plan-code.mjs --hook    read a Claude Code hook payload on
 *                                             stdin and sync only when the edited
 *                                             file is one the plans embed
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'node:fs';
import { join, dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const repoRoot = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const plansDir = join(repoRoot, 'docs', 'superpowers', 'plans');
const checkOnly = process.argv.includes('--check');
const hookMode = process.argv.includes('--hook');

/**
 * Hook mode: the payload arrives as JSON on stdin. Doing the path test here
 * rather than in the settings.json command keeps that command free of shell
 * quoting, and needs no jq — which is not installed on every machine this
 * repo is cloned to.
 */
if (hookMode) {
  const raw = await new Promise((res) => {
    let buf = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (d) => (buf += d));
    process.stdin.on('end', () => res(buf));
    // A hook invoked with no stdin must not hang the tool call.
    setTimeout(() => res(buf), 2000).unref?.();
  });

  let editedPath = '';
  try {
    const payload = JSON.parse(raw || '{}');
    editedPath =
      payload?.tool_input?.file_path || payload?.tool_response?.filePath || '';
  } catch {
    process.exit(0);
  }

  // Only the feature the plans actually embed, and tolerate either slash style.
  if (!/src[\\/]+features[\\/]+debt[\\/]/.test(editedPath)) {
    process.exit(0);
  }
}

/**
 * A marked block: the marker line, then a fence with an optional language,
 * then the body, then the closing fence. The body is captured lazily so the
 * first closing fence ends it.
 */
const MARKED_BLOCK =
  /<!-- sync:(?<path>[^\s>]+) -->\r?\n(?<open>```[^\n]*\r?\n)(?<body>[\s\S]*?)(?<close>```)/g;

/** Compare ignoring line-ending style, which git normalises on this repo anyway. */
const sameContent = (a, b) => a.replace(/\r\n/g, '\n') === b.replace(/\r\n/g, '\n');

const drifted = [];
const synced = [];
const missing = [];

const planFiles = existsSync(plansDir)
  ? readdirSync(plansDir).filter((f) => f.endsWith('.md'))
  : [];

if (!planFiles.length) {
  console.error(`No plan documents found in ${plansDir}`);
  process.exit(1);
}

for (const planFile of planFiles) {
  const planPath = join(plansDir, planFile);
  const original = readFileSync(planPath, 'utf8');

  const updated = original.replace(
    MARKED_BLOCK,
    (match, _p, _o, _b, _c, _offset, _whole, groups) => {
      const { path: relPath, open, body, close } = groups;
      const sourcePath = join(repoRoot, relPath);

      if (!existsSync(sourcePath)) {
        missing.push({ planFile, relPath });
        return match;
      }

      const source = readFileSync(sourcePath, 'utf8');
      // The fence body always ends with the newline that precedes the closing
      // fence, so normalise the file to exactly one trailing newline.
      const wanted = source.replace(/\r\n/g, '\n').replace(/\n*$/, '\n');

      if (sameContent(body, wanted)) return match;

      drifted.push({ planFile, relPath });
      if (checkOnly) return match;

      synced.push({ planFile, relPath });
      return `<!-- sync:${relPath} -->\n${open}${wanted}${close}`;
    }
  );

  if (!checkOnly && updated !== original) {
    writeFileSync(planPath, updated);
  }
}

for (const { planFile, relPath } of missing) {
  console.error(`missing source: ${relPath} (marked in ${planFile})`);
}

if (checkOnly) {
  if (!drifted.length) {
    console.log('plan code blocks match the source');
    process.exit(missing.length ? 1 : 0);
  }
  console.error(`\n${drifted.length} plan code block(s) have drifted:`);
  for (const { planFile, relPath } of drifted) {
    console.error(`  ${planFile}  <-  ${relPath}`);
  }
  console.error('\nRun: npm run sync:plans');
  process.exit(1);
}

if (hookMode) {
  // Stay silent unless something actually changed, and never fail the tool
  // call — a docs sync must not block an edit.
  if (synced.length) {
    const names = [...new Set(synced.map((s) => s.relPath.split('/').pop()))];
    console.log(
      JSON.stringify({
        systemMessage: `Plan docs updated to match ${names.join(', ')}`,
        suppressOutput: true
      })
    );
  }
  process.exit(0);
}

if (synced.length) {
  console.log(`synced ${synced.length} plan code block(s):`);
  for (const { planFile, relPath } of synced) {
    console.log(`  ${planFile}  <-  ${relPath}`);
  }
} else {
  console.log('plan code blocks already match the source');
}

process.exit(missing.length ? 1 : 0);
