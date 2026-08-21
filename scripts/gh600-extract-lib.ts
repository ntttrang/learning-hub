/**
 * Shared donor-parsing helpers for the GH-600 extractor and parity suite.
 *
 * learn-gh-600 is vendored in this repository: its embedded
 * script segments are data-to-validate, never trusted code. Captured segments
 * evaluate in a `node:vm` context with a bare sandbox — no require/process/
 * globals reachable — and every capture throws loudly on donor drift instead
 * of returning partial data.
 *
 * Side-effect-free by design (unlike the phase-3 extractor CLI, which runs at
 * import time): the parity suite imports this module safely.
 */
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import vm from 'node:vm';

/** Repo root = parent of scripts/. */
export const REPO_ROOT = join(import.meta.dirname, '..');
export const DONOR_ROOT = join(REPO_ROOT, 'learn-gh-600');

/** Read a donor file; a missing donor file produces an actionable error. */
export function readDonorFile(relPath: string): string {
  try {
    return readFileSync(join(DONOR_ROOT, relPath), 'utf8');
  } catch (error) {
    const code = (error as NodeJS.ErrnoException).code;
    throw new Error(
      `cannot read donor file learn-gh-600/${relPath} — the vendored donor directory is incomplete? ` +
        `restore it from version control (errno ${code})`,
    );
  }
}

/**
 * Capture a `const NAME=[…];` declaration from donor HTML. The array closes
 * with a column-zero `];` (inner ` ],` closes are indented), so the first
 * line-start `];` after the declaration is the array end.
 */
export function captureConst(html: string, name: string): string {
  const start = html.indexOf(`const ${name}=`);
  if (start < 0) throw new Error(`donor drift: "const ${name}=" not found`);
  const tail = html.slice(start);
  const scriptEnd = tail.indexOf('</script>');
  if (scriptEnd < 0) throw new Error(`donor drift: no </script> after "const ${name}="`);
  const close = tail.slice(0, scriptEnd).search(/\n\];/);
  if (close < 0) throw new Error(`donor drift: no line-start "];" closing ${name}`);
  return tail.slice(0, close + 3); // through "];"
}

/** Evaluate a captured declaration in a bare vm sandbox; return NAME's value. */
export function evalConst<T>(source: string, name: string): T {
  return vm.runInNewContext(`${source}\n${name}`, {}, { timeout: 1000 }) as T;
}

/** Capture + evaluate in one step. */
export function loadDonorConst<T>(html: string, name: string): T {
  return evalConst<T>(captureConst(html, name), name);
}
