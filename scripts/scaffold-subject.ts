/**
 * Add-subject scaffolder: stamps a fresh content pack that validates against
 * the SDK schemas and appears in the hub with exactly the modes it has
 * content for — zero core-code edits. Packs are discovered by Vite glob, so
 * writing files is the whole registration; a running dev server must be
 * restarted to pick the new files up.
 *
 * Usage: npm run content:new -- --id <kebab-id> --code <CODE> --title <t>
 *        --accent <token> [--subtitle <s>] [--description <d>]
 *
 * Import-safe: the pure builder is testable from scaffold-subject.test.ts;
 * the CLI body below only runs when this file is the executed entry.
 */
import { mkdir, rm, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { ACCENT_TOKENS, type AccentToken } from '../src/sdk/types';

export interface ScaffoldOptions {
  id: string;
  code: string;
  title: string;
  accent: AccentToken;
  subtitle?: string;
  description?: string;
}

const KEBAB = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/** Validate flag values before anything is written. Throws with a usage fix. */
export function assertValidOptions(opts: ScaffoldOptions): void {
  if (!KEBAB.test(opts.id)) {
    throw new Error(`--id "${opts.id}" must be kebab-case (lowercase letters, digits, single dashes)`);
  }
  if (!opts.code.trim()) throw new Error('--code must not be empty');
  if (!opts.title.trim()) throw new Error('--title must not be empty');
  if (!ACCENT_TOKENS.includes(opts.accent)) {
    throw new Error(`--accent "${opts.accent}" is not a brand token — pick one of: ${ACCENT_TOKENS.join(', ')}`);
  }
}

const json = (value: unknown) => `${JSON.stringify(value, null, 2)}\n`;

/**
 * The whole starter pack as data: relative path → file contents. Minimal but
 * real — one domain, one module, one MDX lesson, one single-choice question —
 * so `enabledModes: ["learn", "practice"]` is honest on day one.
 */
export function buildStarterPack(opts: ScaffoldOptions): Record<string, string> {
  assertValidOptions(opts);
  const { id, code, title, accent } = opts;
  const subtitle = opts.subtitle ?? `${title} · starter pack`;
  const description =
    opts.description ?? `A freshly scaffolded ${title} pack — one welcome lesson and one practice question to grow from.`;

  const subject = {
    id,
    code,
    title,
    subtitle,
    description,
    accent,
    enabledModes: ['learn', 'practice'],
  };
  const domains = [
    {
      id: 'd-foundations',
      order: 1,
      code: 'D1',
      title: 'Foundations',
      summary: `Where ${title} starts — scope, vocabulary, and first principles.`,
    },
  ];
  const modules = [
    {
      id: 'm-getting-started',
      domainId: 'd-foundations',
      order: 1,
      code: '01',
      title: 'Getting started',
      summary: `A first orientation in ${title}.`,
    },
  ];
  const lesson = [
    '---',
    'id: lesson-welcome',
    'domainId: d-foundations',
    'moduleId: m-getting-started',
    'order: 1',
    'slug: welcome',
    `title: Welcome to ${title}`,
    `summary: What this subject covers and how the ${code} pack is put together.`,
    'minutes: 5',
    'difficulty: beginner',
    '---',
    '',
    'This pack was stamped by `npm run content:new`. It already counts: this',
    'lesson feeds Learn progress, and the practice question below enters the',
    'spaced-review pool once answered.',
    '',
    '## What to do next',
    '',
    '- Replace this body with the first real lesson.',
    '- Grow `questions/` — every question links back to a lesson here.',
    '- When labs or exams land, add them to `enabledModes` in `subject.json`.',
    '',
  ].join('\n');
  const questions = [
    {
      id: 'q-welcome',
      kind: 'single',
      domainId: 'd-foundations',
      moduleId: 'm-getting-started',
      lessonId: 'lesson-welcome',
      difficulty: 'beginner',
      prompt: `Which file defines a ${code} pack's identity, accent, and enabled modes?`,
      explanation:
        'subject.json is the pack root: id, code, title, accent, and enabledModes all live there.',
      options: [
        { id: 'subject', text: 'subject.json' },
        { id: 'domains', text: 'domains.json' },
        { id: 'welcome', text: 'lessons/welcome.mdx' },
      ],
      correct: 'subject',
      tags: ['meta'],
    },
  ];

  return {
    'subject.json': json(subject),
    'domains.json': json(domains),
    'modules.json': json(modules),
    'lessons/welcome.mdx': lesson,
    'questions/welcome.json': json(questions[0]),
    'labs.json': json([]),
    'exams.json': json([]),
    'comparisons.json': json([]),
  };
}

async function main(): Promise<void> {
  const args = process.argv.slice(2);
  const flag = (name: string): string | undefined => {
    const at = args.indexOf(`--${name}`);
    return at >= 0 ? args[at + 1] : undefined;
  };

  const opts: ScaffoldOptions = {
    id: flag('id') ?? '',
    code: flag('code') ?? '',
    title: flag('title') ?? '',
    accent: (flag('accent') ?? '') as AccentToken,
    subtitle: flag('subtitle'),
    description: flag('description'),
  };

  try {
    assertValidOptions(opts);
  } catch (error) {
    console.error(`scaffold-subject: ${(error as Error).message}`);
    console.error(
      'usage: npm run content:new -- --id <kebab-id> --code <CODE> --title <t> --accent <token> [--subtitle <s>] [--description <d>]',
    );
    process.exit(1);
  }

  const packDir = join('content', opts.id);
  const files = buildStarterPack(opts);

  // Never clobber an existing pack — scaffold to a taken id is a user decision.
  try {
    await mkdir(packDir);
  } catch {
    console.error(`scaffold-subject: ${packDir}/ already exists — refusing to overwrite it.`);
    process.exit(1);
  }

  try {
    for (const [relative, contents] of Object.entries(files)) {
      const target = join(packDir, relative);
      await mkdir(join(target, '..'), { recursive: true });
      await writeFile(target, contents);
    }
  } catch (error) {
    // Leave no half-stamped pack behind.
    await rm(packDir, { recursive: true, force: true });
    console.error(`scaffold-subject: write failed, cleaned up ${packDir}/ — ${(error as Error).message}`);
    process.exit(1);
  }

  console.log(`Stamped ${packDir}/ (${Object.keys(files).length} files).`);
  console.log('Restart a running dev server — the content glob only re-scans on boot.');
  console.log('Next: npm run content:check, then open the hub.');
}

// Entry guard: importing this module (e.g. from tests) must not run the CLI.
if (process.argv[1]?.endsWith('scaffold-subject.ts')) {
  await main();
}
