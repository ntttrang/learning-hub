/**
 * Converter regression net on real donor bodies (GH-600 pack).
 *
 * Pins block-kind sequences and spot content for one topic per domain,
 * plus a whole-corpus pass: all 23 bodies convert using only the known
 * block vocabulary. Donor reads go through the shared extract lib.
 */
import { describe, expect, it } from 'vitest';
import type { CoreBlock } from '../src/sdk/types';
import { convertBody } from './gh600-blocks';
import { loadDonorConst, readDonorFile } from './gh600-extract-lib';

interface DonorTopic {
  id: string;
  name: string;
  body: string;
}

const html = readDonorFile('gh600-study-plan-captain-corgi.html');
const domains = loadDonorConst<
  { id: number; name: string; topics: DonorTopic[]; quiz: unknown[] }[]
>(html, 'DOMAINS');

const topics = domains.flatMap((domain) => domain.topics);

function topic(id: string): DonorTopic {
  const found = topics.find((t) => t.id === id);
  if (!found) throw new Error(`test setup: donor topic ${id} not found`);
  return found;
}

function kinds(id: string): string[] {
  return convertBody(topic(id).body).map((block) => block.kind);
}

describe('gh600 donor shape', () => {
  it('carries 6 domains, 23 topics, 30 quiz entries', () => {
    expect(domains).toHaveLength(6);
    expect(topics).toHaveLength(23);
    expect(domains.reduce((n, d) => n + d.quiz.length, 0)).toBe(30);
  });
});

describe('gh600 body conversion', () => {
  it('converts every topic body with the known block vocabulary', () => {
    for (const t of topics) {
      const blocks = convertBody(t.body);
      expect(blocks.length, t.id).toBeGreaterThan(0);
      for (const block of blocks) {
        expect(['md', 'heading', 'list', 'code', 'tip', 'table'], t.id).toContain(block.kind);
      }
    }
  });

  it('d1t1: md + 3 key callouts + fact-list + tip, icons dropped', () => {
    expect(kinds('d1t1')).toEqual(['md', 'tip', 'tip', 'tip', 'list', 'tip']);
    const blocks = convertBody(topic('d1t1').body) as CoreBlock[];
    expect((blocks[0] as { body: string }).body).toMatch(/^The agent lifecycle/);
    expect((blocks[1] as { text: string }).text).toMatch(/^\*\*📋 Plan:\*\*/);
    const list = blocks[4] as { items: string[] };
    expect(list.items.some((item) => item.includes('**distinct, separated steps**'))).toBe(true);
    expect(list.items.some((item) => item.includes('→'))).toBe(false);
  });

  it('d1t3: consecutive ap-rows merge into one Anti-pattern/Correct table', () => {
    expect(kinds('d1t3')).toEqual(['table', 'tip']);
    const table = convertBody(topic('d1t3').body)[0] as {
      headers: string[];
      rows: string[][];
    };
    expect(table.headers).toEqual(['Anti-pattern', 'Correct']);
    expect(table.rows).toHaveLength(4);
    expect(table.rows[0][0]).toContain('no validation window');
    expect(table.rows[0][1]).toContain('validation gate');
  });

  it('d2t1: callout + 3-column table + yaml code block + tip', () => {
    expect(kinds('d2t1')).toEqual(['tip', 'table', 'code', 'tip']);
    const blocks = convertBody(topic('d2t1').body) as CoreBlock[];
    const table = blocks[1] as { headers: string[] };
    expect(table.headers).toEqual(['Component', 'Purpose', 'Exam Relevance']);
    const code = blocks[2] as { language: string; code: string };
    expect(code.language).toBe('yaml');
    expect(code.code).toContain('mcp_servers:');
  });

  it('d3t3: key callout + json code block + key callout', () => {
    expect(kinds('d3t3')).toEqual(['tip', 'code', 'tip']);
    const code = convertBody(topic('d3t3').body)[1] as { language: string; code: string };
    expect(code.language).toBe('json');
    expect(code.code).toContain('"task": "refactor-auth-module"');
  });

  it('d2t3: inline code with style attribute becomes markdown backticks', () => {
    const tip = convertBody(topic('d2t3').body)[1] as { text: string };
    expect(tip.text).toContain('`copilot/`');
  });
});
