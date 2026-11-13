#!/usr/bin/env node
/**
 * Hilfsskript zur automatischen Spiegelung von kopfrechen-pwa:
 * - --code:  Erzeugt CODE_SPIEGEL.md aus allen aktuellen Projektdateien neu.
 * - --drive: Synchronisiert den Projektordner per rsync nach Google Drive (KI-Spiegel/kopfrechen-pwa).
 * Ohne Flag werden beide Schritte nacheinander ausgefuehrt.
 */

import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CODE_SPIEGEL_PATH = path.join(ROOT, 'CODE_SPIEGEL.md');

const PREFERRED_ORDER = [
  'SPEC.md',
  'AGENTS.md',
  '.gitignore',
  '.nojekyll',
  'storage.js',
  'engine.js',
  'ui.js',
  'sw.js',
  'manifest.json',
  'icon.svg',
  'index.html',
  'tests.mjs',
  'tools/update-spiegel.mjs'
];

const EXCLUDED_DIRS = new Set(['.git', 'node_modules']);
const EXCLUDED_FILES = new Set(['.DS_Store', 'CODE_SPIEGEL.md']);
const BINARY_EXTS = new Set(['.png', '.jpg', '.jpeg', '.webp', '.gif', '.ico', '.woff', '.woff2', '.pdf', '.zip']);

function languageForFile(relPath) {
  const base = path.basename(relPath);
  if (base === '.gitignore') return 'gitignore';
  const ext = path.extname(relPath).toLowerCase();
  const map = {
    '.md': 'markdown',
    '.js': 'javascript',
    '.mjs': 'javascript',
    '.html': 'html',
    '.css': 'css',
    '.json': 'json',
    '.svg': 'xml',
    '.sh': 'bash',
    '.command': 'bash'
  };
  return map[ext] ?? 'text';
}

function chooseFence(content) {
  let maxRun = 0;
  for (const match of content.matchAll(/`+/g)) {
    if (match[0].length > maxRun) maxRun = match[0].length;
  }
  const length = Math.max(3, maxRun + 1);
  return '`'.repeat(length);
}

async function collectProjectFiles(dir = ROOT, prefix = '') {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const collected = [];

  for (const entry of entries) {
    if (entry.isDirectory()) {
      if (EXCLUDED_DIRS.has(entry.name)) continue;
      const nextPrefix = prefix ? `${prefix}/${entry.name}` : entry.name;
      collected.push(...(await collectProjectFiles(path.join(dir, entry.name), nextPrefix)));
    } else if (entry.isFile()) {
      if (EXCLUDED_FILES.has(entry.name)) continue;
      const ext = path.extname(entry.name).toLowerCase();
      if (BINARY_EXTS.has(ext)) continue;
      const relPath = prefix ? `${prefix}/${entry.name}` : entry.name;
      collected.push(relPath);
    }
  }

  return collected;
}

async function sortProjectFiles(files) {
  const fileSet = new Set(files);
  const ordered = PREFERRED_ORDER.filter((rel) => fileSet.has(rel));
  const orderedSet = new Set(ordered);
  const remaining = files.filter((rel) => !orderedSet.has(rel)).sort();
  return [...ordered, ...remaining];
}

export async function buildCodeSpiegel() {
  const allFiles = await collectProjectFiles();
  const orderedFiles = await sortProjectFiles(allFiles);

  const sections = [
    '# CODE_SPIEGEL.md',
    '',
    `Aktueller Volltext der Kerndateien aus \`${ROOT}\`.`
  ];

  for (const relPath of orderedFiles) {
    const raw = await fs.readFile(path.join(ROOT, relPath), 'utf8');
    const trimmedEnd = raw.replace(/\r\n/g, '\n').replace(/\n+$/, '');
    const lang = languageForFile(relPath);
    const fence = chooseFence(trimmedEnd);

    sections.push('', `## ${relPath}`, '');
    if (trimmedEnd.length === 0) {
      sections.push(`${fence}${lang}`, fence);
    } else {
      sections.push(`${fence}${lang}`, trimmedEnd, fence);
    }
  }

  const nextContent = `${sections.join('\n')}\n`;
  let previousContent = null;
  try {
    previousContent = await fs.readFile(CODE_SPIEGEL_PATH, 'utf8');
  } catch {
    previousContent = null;
  }

  if (previousContent !== nextContent) {
    await fs.writeFile(CODE_SPIEGEL_PATH, nextContent, 'utf8');
    console.log('CODE_SPIEGEL.md aktualisiert.');
  } else {
    console.log('CODE_SPIEGEL.md ist bereits aktuell.');
  }
}

async function findGoogleDriveRoot() {
  const cloudStorage = path.join(os.homedir(), 'Library', 'CloudStorage');
  let entries;
  try {
    entries = await fs.readdir(cloudStorage, { withFileTypes: true });
  } catch {
    return null;
  }

  const preferred = 'GoogleDrive-kovertben@gmail.com';
  const candidates = entries
    .filter((e) => e.isDirectory() && e.name.startsWith('GoogleDrive-'))
    .map((e) => e.name)
    .sort((a, b) => (a === preferred ? -1 : b === preferred ? 1 : a.localeCompare(b)));

  for (const accountDir of candidates) {
    for (const driveName of ['Meine Ablage', 'My Drive']) {
      const candidate = path.join(cloudStorage, accountDir, driveName);
      try {
        const stat = await fs.stat(candidate);
        if (stat.isDirectory()) return candidate;
      } catch {
        // Naechsten Kandidaten pruefen.
      }
    }
  }
  return null;
}

export async function syncDriveMirror() {
  const driveRoot = await findGoogleDriveRoot();
  if (!driveRoot) {
    console.warn('Hinweis: Google-Drive-Ordner nicht gefunden, Drive-Sync uebersprungen.');
    return false;
  }

  const targetDir = path.join(driveRoot, 'KI-Spiegel', 'kopfrechen-pwa');
  await fs.mkdir(targetDir, { recursive: true });

  execFileSync(
    '/usr/bin/rsync',
    [
      '-rt',
      '--delete',
      '--exclude=.DS_Store',
      '--exclude=.git/',
      '--exclude=node_modules/',
      `${ROOT}/`,
      `${targetDir}/`
    ],
    { stdio: 'inherit' }
  );

  console.log(`Drive-Spiegel synchronisiert: ${targetDir}`);
  return true;
}

async function main() {
  const args = new Set(process.argv.slice(2));
  const runCode = args.has('--code') || args.size === 0;
  const runDrive = args.has('--drive') || args.size === 0;

  if (!runCode && !runDrive) {
    console.error('Unbekannte Option. Erlaubt: --code, --drive (oder ohne Flag fuer beides).');
    process.exit(2);
  }

  if (runCode) await buildCodeSpiegel();
  if (runDrive) await syncDriveMirror();
}

const isDirectRun = process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);
if (isDirectRun) {
  main().catch((err) => {
    console.error(err);
    process.exit(1);
  });
}
