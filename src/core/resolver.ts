import * as fs from 'fs/promises';
import * as path from 'path';
import * as yaml from 'yaml';
import { LayerName, ModuleManifest, ResolvedModule, StackweaveConfig } from '../types';
import { parseModuleEntry } from './config';

export const LAYER_ORDER: Record<LayerName, number> = {
  base: 1,
  lang: 2,
  stack: 3,
  infra: 4,
  pattern: 5,
  project: 6,
};

/**
 * Reads and parses module.yaml from the given module directory.
 */
export async function loadModuleManifest(modulePath: string): Promise<ModuleManifest> {
  const manifestPath = path.join(modulePath, 'module.yaml');
  const raw = await fs.readFile(manifestPath, 'utf-8');
  const parsed = yaml.parse(raw);

  if (!parsed || typeof parsed !== 'object') {
    throw new Error(`Invalid module.yaml at ${manifestPath}`);
  }

  const m = parsed as Record<string, unknown>;
  if (!m.name || typeof m.name !== 'string') {
    throw new Error(`module.yaml at ${manifestPath} missing "name"`);
  }
  if (!m.layer || typeof m.layer !== 'string') {
    throw new Error(`module.yaml at ${manifestPath} missing "layer"`);
  }

  return {
    name: m.name,
    description: typeof m.description === 'string' ? m.description : '',
    layer: m.layer as LayerName,
    version: typeof m.version === 'string' ? m.version : '0.0.0',
    dependencies: Array.isArray(m.dependencies) ? (m.dependencies as string[]) : undefined,
    variables:
      m.variables && typeof m.variables === 'object'
        ? (m.variables as ModuleManifest['variables'])
        : undefined,
  };
}

/**
 * Finds the directory for a module by searching each path in searchPaths.
 */
async function findModulePath(name: string, searchPaths: string[]): Promise<string | null> {
  for (const searchPath of searchPaths) {
    const candidate = path.join(searchPath, name);
    try {
      await fs.access(path.join(candidate, 'module.yaml'));
      return candidate;
    } catch {
      // not found in this search path, continue
    }
  }
  return null;
}

/**
 * Resolves all modules declared in config, loading manifests and merging
 * variable defaults with user-supplied overrides.
 * Also resolves transitive dependencies.
 */
export async function resolveModules(
  config: StackweaveConfig,
  searchPaths: string[]
): Promise<ResolvedModule[]> {
  const resolved = new Map<string, ResolvedModule>();
  const userVariables = new Map<string, Record<string, unknown>>();

  // First pass: collect user-declared modules and their variable overrides
  for (const entry of config.modules) {
    const { name, variables } = parseModuleEntry(entry);
    userVariables.set(name, variables);
  }

  // Resolve a module by name, recursively resolving dependencies first
  async function resolveOne(name: string): Promise<void> {
    if (resolved.has(name)) return;

    const modulePath = await findModulePath(name, searchPaths);
    if (!modulePath) {
      throw new Error(
        `Module "${name}" not found in search paths: ${searchPaths.join(', ')}`
      );
    }

    const manifest = await loadModuleManifest(modulePath);

    // Resolve dependencies first (depth-first)
    for (const dep of manifest.dependencies ?? []) {
      await resolveOne(dep);
    }

    // Build effective variables: defaults → user overrides
    const effectiveVars: Record<string, unknown> = {};
    for (const [varName, varDef] of Object.entries(manifest.variables ?? {})) {
      effectiveVars[varName] = varDef.default;
    }
    const overrides = userVariables.get(name) ?? {};
    Object.assign(effectiveVars, overrides);

    resolved.set(name, { manifest, path: modulePath, variables: effectiveVars });
  }

  // Seed with user-declared modules (deps will be pulled in transitively)
  for (const entry of config.modules) {
    const { name } = parseModuleEntry(entry);
    await resolveOne(name);
  }

  return Array.from(resolved.values());
}

/**
 * Topologically sorts resolved modules using Kahn's algorithm.
 * Within the same topological rank, sorts by LAYER_ORDER (lower layers first).
 * Throws if a cycle is detected.
 */
export function topologicalSort(modules: ResolvedModule[]): ResolvedModule[] {
  const nameToModule = new Map<string, ResolvedModule>();
  for (const m of modules) {
    nameToModule.set(m.manifest.name, m);
  }

  // Build adjacency: name → set of names that depend on it (edges point from dep to dependent)
  const inDegree = new Map<string, number>();
  const dependents = new Map<string, Set<string>>();

  for (const m of modules) {
    if (!inDegree.has(m.manifest.name)) inDegree.set(m.manifest.name, 0);
    if (!dependents.has(m.manifest.name)) dependents.set(m.manifest.name, new Set());
  }

  for (const m of modules) {
    for (const dep of m.manifest.dependencies ?? []) {
      // dep must come before m
      if (!nameToModule.has(dep)) continue; // skip deps not in the set
      dependents.get(dep)!.add(m.manifest.name);
      inDegree.set(m.manifest.name, (inDegree.get(m.manifest.name) ?? 0) + 1);
    }
  }

  // Queue: all nodes with in-degree 0, sorted by layer
  const queue: string[] = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) queue.push(name);
  }
  queue.sort((a, b) => {
    const la = LAYER_ORDER[nameToModule.get(a)!.manifest.layer] ?? 0;
    const lb = LAYER_ORDER[nameToModule.get(b)!.manifest.layer] ?? 0;
    return la - lb;
  });

  const result: ResolvedModule[] = [];

  while (queue.length > 0) {
    // Pick the module with lowest layer order from the queue
    queue.sort((a, b) => {
      const la = LAYER_ORDER[nameToModule.get(a)!.manifest.layer] ?? 0;
      const lb = LAYER_ORDER[nameToModule.get(b)!.manifest.layer] ?? 0;
      return la - lb;
    });

    const name = queue.shift()!;
    result.push(nameToModule.get(name)!);

    const deps = dependents.get(name) ?? new Set();
    for (const dependent of deps) {
      const newDegree = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }

  if (result.length !== modules.length) {
    throw new Error('Circular dependency detected among modules');
  }

  return result;
}
