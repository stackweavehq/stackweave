import * as fs from 'fs/promises';
import * as yaml from 'yaml';
import { ModuleConfig, StackweaveConfig } from '../types';

/**
 * Reads and parses .stackweave.yaml from the given file path.
 */
export async function parseConfig(filePath: string): Promise<StackweaveConfig> {
  const raw = await fs.readFile(filePath, 'utf-8');
  const parsed = yaml.parse(raw);
  return validateConfig(parsed);
}

/**
 * Validates the raw parsed YAML and returns a typed StackweaveConfig.
 * Throws if required fields are missing.
 */
export function validateConfig(config: unknown): StackweaveConfig {
  if (typeof config !== 'object' || config === null) {
    throw new Error('Invalid config: must be an object');
  }

  const raw = config as Record<string, unknown>;

  if (!raw.project || typeof raw.project !== 'object' || raw.project === null) {
    throw new Error('Invalid config: missing "project" section');
  }

  const project = raw.project as Record<string, unknown>;
  if (!project.name || typeof project.name !== 'string') {
    throw new Error('Invalid config: missing or invalid "project.name"');
  }

  if (!Array.isArray(raw.modules)) {
    throw new Error('Invalid config: "modules" must be an array');
  }

  // Validate each module entry
  for (let i = 0; i < raw.modules.length; i++) {
    const entry = raw.modules[i];
    if (typeof entry === 'string') continue;
    if (
      typeof entry !== 'object' ||
      entry === null ||
      Array.isArray(entry)
    ) {
      throw new Error(
        `Module entry at index ${i} is invalid: expected a string or { name: { variables } }, got ${
          entry === null ? 'null' : Array.isArray(entry) ? 'array' : typeof entry
        }`
      );
    }
  }

  // Validate overrides if present
  if (raw.overrides !== undefined) {
    if (typeof raw.overrides !== 'object' || raw.overrides === null || Array.isArray(raw.overrides)) {
      throw new Error('Invalid config: "overrides" must be an object');
    }
    const overrides = raw.overrides as Record<string, unknown>;
    for (const [key, value] of Object.entries(overrides)) {
      if (typeof value !== 'string') {
        throw new Error(
          `Invalid config: overrides.${key} must be a string path, got ${typeof value}`
        );
      }
    }
  }

  return {
    project: {
      name: project.name,
      description: typeof project.description === 'string' ? project.description : undefined,
    },
    modules: raw.modules as ModuleConfig[],
    overrides: raw.overrides as StackweaveConfig['overrides'] | undefined,
  };
}

/**
 * Normalises both the string form ("base-conventions") and the object form
 * ({ "typescript-strict": { strict_mode: true } }) of a module entry.
 */
export function parseModuleEntry(entry: ModuleConfig): {
  name: string;
  variables: Record<string, unknown>;
} {
  if (typeof entry === 'string') {
    return { name: entry, variables: {} };
  }

  const keys = Object.keys(entry);
  if (keys.length !== 1) {
    throw new Error(
      `Invalid module entry: object form must have exactly one key, got: ${JSON.stringify(entry)}`
    );
  }

  const name = keys[0];
  const variables = (entry[name] ?? {}) as Record<string, unknown>;
  return { name, variables };
}
