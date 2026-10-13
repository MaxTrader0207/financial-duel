// 版本資訊: the changelog is well formed, newest first, and matches package.json
import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import * as V from '../src/js/version.js';

describe('changelog', () => {
  it('newest first, versions and dates going down, every release with items', () => {
    const r = V.RELEASES;
    for (let i = 1; i < r.length; i++) {
      expect(V.newer(r[i - 1].version, r[i].version), r[i].version).toBe(true);
      expect(r[i - 1].date >= r[i].date, r[i].version).toBe(true);
    }
    for (const x of r) { expect(x.date).toMatch(/^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/); expect(x.title).toBeTruthy(); expect(x.items.length).toBeGreaterThan(0); }
  });
  it('the current version is the one in package.json', () => {
    const pkg = JSON.parse(readFileSync('package.json', 'utf8'));                 // vitest runs from the project root
    expect(V.CURRENT.version).toBe(pkg.version);
  });
  it('compares versions by number, not as text', () => {
    expect(V.newer('3.10.0', '3.9.0')).toBe(true); expect(V.newer('3.9.0', '3.10.0')).toBe(false); expect(V.newer('3.9.0', '3.9.0')).toBe(false);
    expect(V.since('3.11.0').map(r => r.version)).toEqual(V.RELEASES.filter(r => V.newer(r.version, '3.11.0')).map(r => r.version));
  });
});
