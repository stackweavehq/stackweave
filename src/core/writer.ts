import * as fs from 'fs/promises';
import * as path from 'path';
import { Fragment, MergeResult } from '../types';

/**
 * Removes the output directory and recreates it as empty.
 */
export async function cleanOutput(outputDir: string): Promise<void> {
  try {
    await fs.rm(outputDir, { recursive: true, force: true });
  } catch {
    // ignore if it doesn't exist
  }
  await fs.mkdir(outputDir, { recursive: true });
}

/**
 * Writes a single fragment file to the appropriate subdirectory under outputDir.
 */
async function writeFragment(outputDir: string, fragment: Fragment): Promise<void> {
  const dir = path.join(outputDir, fragment.type);
  await fs.mkdir(dir, { recursive: true });
  const outPath = path.join(dir, fragment.filename);
  await fs.writeFile(outPath, fragment.content, 'utf-8');
}

/**
 * Writes the complete merge result to outputDir:
 *   - CLAUDE.md at the root of outputDir
 *   - Each fragment under its type subdirectory
 */
export async function writeOutput(outputDir: string, mergeResult: MergeResult): Promise<void> {
  await fs.mkdir(outputDir, { recursive: true });

  // Write CLAUDE.md (concatenation of all sections)
  const claudeMdContent = mergeResult.claudeMdSections.join('\n');
  await fs.writeFile(path.join(outputDir, 'CLAUDE.md'), claudeMdContent, 'utf-8');

  // Write all other fragments grouped by type
  const fragmentValues: Fragment[] = Object.values(mergeResult.fragments);
  await Promise.all(fragmentValues.map((f) => writeFragment(outputDir, f)));
}
