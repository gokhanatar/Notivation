#!/usr/bin/env node
/**
 * Fix App Store Connect character limits:
 * - keywords.txt: max 100 characters
 * - description.txt: max 4000 characters
 * - subtitle.txt: max 30 characters
 * - name.txt: max 30 characters
 * - promotional_text.txt: max 170 characters
 */

import { readFileSync, writeFileSync, readdirSync, existsSync } from 'fs';
import { join } from 'path';

const META_DIR = join(import.meta.dirname, 'metadata');
const locales = readdirSync(META_DIR).filter(d => {
  const p = join(META_DIR, d);
  return existsSync(join(p, 'name.txt'));
});

let fixes = 0;

for (const locale of locales) {
  const dir = join(META_DIR, locale);

  // --- Keywords: max 100 chars ---
  const kwFile = join(dir, 'keywords.txt');
  if (existsSync(kwFile)) {
    let kw = readFileSync(kwFile, 'utf8').trim();
    if (kw.length > 100) {
      const tags = kw.split(',');
      while (tags.join(',').length > 100 && tags.length > 1) {
        tags.pop();
      }
      const trimmed = tags.join(',');
      writeFileSync(kwFile, trimmed);
      console.log(`[fix] ${locale}/keywords.txt: ${kw.length} → ${trimmed.length} chars`);
      fixes++;
    }
  }

  // --- Description: max 4000 chars ---
  const descFile = join(dir, 'description.txt');
  if (existsSync(descFile)) {
    let desc = readFileSync(descFile, 'utf8');
    if (desc.length > 4000) {
      // Try to trim at last paragraph boundary before 4000
      const trimTarget = 3990; // small buffer
      let cut = desc.substring(0, trimTarget);
      // Find last double-newline (paragraph break)
      const lastPara = cut.lastIndexOf('\n\n');
      if (lastPara > 3000) {
        cut = desc.substring(0, lastPara);
      } else {
        // Fall back: cut at last sentence end
        const lastSentence = cut.lastIndexOf('. ');
        if (lastSentence > 3000) {
          cut = desc.substring(0, lastSentence + 1);
        } else {
          cut = desc.substring(0, trimTarget);
        }
      }
      writeFileSync(descFile, cut);
      console.log(`[fix] ${locale}/description.txt: ${desc.length} → ${cut.length} chars`);
      fixes++;
    }
  }

  // --- Subtitle: max 30 chars ---
  const subFile = join(dir, 'subtitle.txt');
  if (existsSync(subFile)) {
    let sub = readFileSync(subFile, 'utf8').trim();
    if (sub.length > 30) {
      const trimmed = sub.substring(0, 30);
      writeFileSync(subFile, trimmed);
      console.log(`[fix] ${locale}/subtitle.txt: ${sub.length} → ${trimmed.length} chars`);
      fixes++;
    }
  }

  // --- Name: max 30 chars ---
  const nameFile = join(dir, 'name.txt');
  if (existsSync(nameFile)) {
    let name = readFileSync(nameFile, 'utf8').trim();
    if (name.length > 30) {
      const trimmed = name.substring(0, 30);
      writeFileSync(nameFile, trimmed);
      console.log(`[fix] ${locale}/name.txt: ${name.length} → ${trimmed.length} chars`);
      fixes++;
    }
  }

  // --- Promotional text: max 170 chars ---
  const promoFile = join(dir, 'promotional_text.txt');
  if (existsSync(promoFile)) {
    let promo = readFileSync(promoFile, 'utf8').trim();
    if (promo.length > 170) {
      // Cut at last sentence before 170
      let cut = promo.substring(0, 168);
      const lastDot = cut.lastIndexOf('.');
      if (lastDot > 100) {
        cut = promo.substring(0, lastDot + 1);
      }
      writeFileSync(promoFile, cut);
      console.log(`[fix] ${locale}/promotional_text.txt: ${promo.length} → ${cut.length} chars`);
      fixes++;
    }
  }
}

console.log(`\nDone: ${fixes} files fixed.`);
