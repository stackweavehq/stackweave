import * as fs from 'fs/promises';
import * as os from 'os';
import * as path from 'path';
import { Fragment, MergeResult } from '../types';

/**
 * Validates that outputDir is safe to recursively delete.
 * It must be a descendant of configDir and its basename must start with a dot.
 */
export function validateOutputDir(outputDir: string, configDir: string): void {
  const resolved = path.resolve(outputDir);
  const resolvedConfig = path.resolve(configDir);
  const homeDir = os.homedir();

  // Block root-level paths
  if (resolved === '/' || resolved === homeDir) {
    throw new Error(
      `Refusing to clean "${resolved}": output directory must be inside the project root`
    );
  }

  // Must be a descendant of configDir
  const relative = path.relative(resolvedConfig, resolved);
  if (relative.startsWith('..') || path.isAbsolute(relative)) {
    throw new Error(
      `Refusing to clean "${resolved}": output directory must be inside the project root`
    );
  }

  // Basename must start with a dot (e.g. .claude)
  const base = path.basename(resolved);
  if (!base.startsWith('.')) {
    throw new Error(
      `Refusing to clean "${resolved}": output directory basename must start with a dot (e.g. .claude)`
    );
  }
}

/**
 * Removes the output directory and recreates it as empty.
 */
export async function cleanOutput(outputDir: string, configDir: string): Promise<void> {
  validateOutputDir(outputDir, configDir);
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
