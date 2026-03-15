#!/usr/bin/env node
"use strict";
var __create = Object.create;
var __defProp = Object.defineProperty;
var __getOwnPropDesc = Object.getOwnPropertyDescriptor;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __getProtoOf = Object.getPrototypeOf;
var __hasOwnProp = Object.prototype.hasOwnProperty;
var __copyProps = (to, from, except, desc) => {
  if (from && typeof from === "object" || typeof from === "function") {
    for (let key of __getOwnPropNames(from))
      if (!__hasOwnProp.call(to, key) && key !== except)
        __defProp(to, key, { get: () => from[key], enumerable: !(desc = __getOwnPropDesc(from, key)) || desc.enumerable });
  }
  return to;
};
var __toESM = (mod, isNodeMode, target) => (target = mod != null ? __create(__getProtoOf(mod)) : {}, __copyProps(
  // If the importer is in node compatibility mode or this is not an ESM
  // file that has been converted to a CommonJS file using a Babel-
  // compatible transform (i.e. "__esModule" has not been set), then set
  // "default" to the CommonJS "module.exports" for node compatibility.
  isNodeMode || !mod || !mod.__esModule ? __defProp(target, "default", { value: mod, enumerable: true }) : target,
  mod
));

// src/cli/index.ts
var import_commander3 = require("commander");

// src/cli/generate.ts
var import_commander = require("commander");
var path5 = __toESM(require("path"));

// src/core/engine.ts
var path4 = __toESM(require("path"));

// src/core/config.ts
var fs = __toESM(require("fs/promises"));
var yaml = __toESM(require("yaml"));
async function parseConfig(filePath) {
  const raw = await fs.readFile(filePath, "utf-8");
  const parsed = yaml.parse(raw);
  return validateConfig(parsed);
}
function validateConfig(config) {
  if (typeof config !== "object" || config === null) {
    throw new Error("Invalid config: must be an object");
  }
  const raw = config;
  if (!raw.project || typeof raw.project !== "object" || raw.project === null) {
    throw new Error('Invalid config: missing "project" section');
  }
  const project = raw.project;
  if (!project.name || typeof project.name !== "string") {
    throw new Error('Invalid config: missing or invalid "project.name"');
  }
  if (!Array.isArray(raw.modules)) {
    throw new Error('Invalid config: "modules" must be an array');
  }
  return {
    project: {
      name: project.name,
      description: typeof project.description === "string" ? project.description : void 0
    },
    modules: raw.modules,
    overrides: raw.overrides
  };
}
function parseModuleEntry(entry) {
  if (typeof entry === "string") {
    return { name: entry, variables: {} };
  }
  const keys = Object.keys(entry);
  if (keys.length !== 1) {
    throw new Error(
      `Invalid module entry: object form must have exactly one key, got: ${JSON.stringify(entry)}`
    );
  }
  const name = keys[0];
  const variables = entry[name] ?? {};
  return { name, variables };
}

// src/core/resolver.ts
var fs2 = __toESM(require("fs/promises"));
var path = __toESM(require("path"));
var yaml2 = __toESM(require("yaml"));
var LAYER_ORDER = {
  base: 1,
  lang: 2,
  stack: 3,
  infra: 4,
  pattern: 5,
  project: 6
};
async function loadModuleManifest(modulePath) {
  const manifestPath = path.join(modulePath, "module.yaml");
  const raw = await fs2.readFile(manifestPath, "utf-8");
  const parsed = yaml2.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error(`Invalid module.yaml at ${manifestPath}`);
  }
  const m = parsed;
  if (!m.name || typeof m.name !== "string") {
    throw new Error(`module.yaml at ${manifestPath} missing "name"`);
  }
  if (!m.layer || typeof m.layer !== "string") {
    throw new Error(`module.yaml at ${manifestPath} missing "layer"`);
  }
  return {
    name: m.name,
    description: typeof m.description === "string" ? m.description : "",
    layer: m.layer,
    version: typeof m.version === "string" ? m.version : "0.0.0",
    dependencies: Array.isArray(m.dependencies) ? m.dependencies : void 0,
    variables: m.variables && typeof m.variables === "object" ? m.variables : void 0
  };
}
async function findModulePath(name, searchPaths) {
  for (const searchPath of searchPaths) {
    const candidate = path.join(searchPath, name);
    try {
      await fs2.access(path.join(candidate, "module.yaml"));
      return candidate;
    } catch {
    }
  }
  return null;
}
async function resolveModules(config, searchPaths) {
  const resolved = /* @__PURE__ */ new Map();
  const userVariables = /* @__PURE__ */ new Map();
  for (const entry of config.modules) {
    const { name, variables } = parseModuleEntry(entry);
    userVariables.set(name, variables);
  }
  async function resolveOne(name) {
    if (resolved.has(name)) return;
    const modulePath = await findModulePath(name, searchPaths);
    if (!modulePath) {
      throw new Error(
        `Module "${name}" not found in search paths: ${searchPaths.join(", ")}`
      );
    }
    const manifest = await loadModuleManifest(modulePath);
    for (const dep of manifest.dependencies ?? []) {
      await resolveOne(dep);
    }
    const effectiveVars = {};
    for (const [varName, varDef] of Object.entries(manifest.variables ?? {})) {
      effectiveVars[varName] = varDef.default;
    }
    const overrides = userVariables.get(name) ?? {};
    Object.assign(effectiveVars, overrides);
    resolved.set(name, { manifest, path: modulePath, variables: effectiveVars });
  }
  for (const entry of config.modules) {
    const { name } = parseModuleEntry(entry);
    await resolveOne(name);
  }
  return Array.from(resolved.values());
}
function topologicalSort(modules) {
  const nameToModule = /* @__PURE__ */ new Map();
  for (const m of modules) {
    nameToModule.set(m.manifest.name, m);
  }
  const inDegree = /* @__PURE__ */ new Map();
  const dependents = /* @__PURE__ */ new Map();
  for (const m of modules) {
    if (!inDegree.has(m.manifest.name)) inDegree.set(m.manifest.name, 0);
    if (!dependents.has(m.manifest.name)) dependents.set(m.manifest.name, /* @__PURE__ */ new Set());
  }
  for (const m of modules) {
    for (const dep of m.manifest.dependencies ?? []) {
      if (!nameToModule.has(dep)) continue;
      dependents.get(dep).add(m.manifest.name);
      inDegree.set(m.manifest.name, (inDegree.get(m.manifest.name) ?? 0) + 1);
    }
  }
  const queue = [];
  for (const [name, degree] of inDegree) {
    if (degree === 0) queue.push(name);
  }
  queue.sort((a, b) => {
    const la = LAYER_ORDER[nameToModule.get(a).manifest.layer] ?? 0;
    const lb = LAYER_ORDER[nameToModule.get(b).manifest.layer] ?? 0;
    return la - lb;
  });
  const result = [];
  while (queue.length > 0) {
    queue.sort((a, b) => {
      const la = LAYER_ORDER[nameToModule.get(a).manifest.layer] ?? 0;
      const lb = LAYER_ORDER[nameToModule.get(b).manifest.layer] ?? 0;
      return la - lb;
    });
    const name = queue.shift();
    result.push(nameToModule.get(name));
    const deps = dependents.get(name) ?? /* @__PURE__ */ new Set();
    for (const dependent of deps) {
      const newDegree = (inDegree.get(dependent) ?? 1) - 1;
      inDegree.set(dependent, newDegree);
      if (newDegree === 0) {
        queue.push(dependent);
      }
    }
  }
  if (result.length !== modules.length) {
    throw new Error("Circular dependency detected among modules");
  }
  return result;
}

// src/core/merger.ts
var fs3 = __toESM(require("fs/promises"));
var path2 = __toESM(require("path"));
var import_handlebars = __toESM(require("handlebars"));
async function collectFragments(modules, fragmentType) {
  const fragments = [];
  for (const mod of modules) {
    const fragDir = path2.join(mod.path, fragmentType);
    let files;
    try {
      files = await fs3.readdir(fragDir);
    } catch {
      continue;
    }
    for (const file of files) {
      const filePath = path2.join(fragDir, file);
      const stat2 = await fs3.stat(filePath);
      if (!stat2.isFile()) continue;
      const raw = await fs3.readFile(filePath, "utf-8");
      const content = interpolate(raw, mod.variables);
      fragments.push({
        type: fragmentType,
        filename: file,
        content,
        layer: mod.manifest.layer,
        moduleName: mod.manifest.name
      });
    }
  }
  return fragments;
}
function mergeFragments(fragments) {
  const result = {};
  for (const fragment of fragments) {
    const existing = result[fragment.filename];
    if (!existing) {
      result[fragment.filename] = fragment;
    } else {
      const existingOrder = LAYER_ORDER[existing.layer] ?? 0;
      const newOrder = LAYER_ORDER[fragment.layer] ?? 0;
      if (newOrder >= existingOrder) {
        result[fragment.filename] = fragment;
      }
    }
  }
  return result;
}
function interpolate(content, variables) {
  const template = import_handlebars.default.compile(content, { noEscape: true });
  return template(variables);
}
async function buildClaudeMd(modules, projectName, projectDescription) {
  const lines = [];
  lines.push(`# ${projectName}`);
  if (projectDescription) {
    lines.push("");
    lines.push(projectDescription);
  }
  lines.push("");
  lines.push(
    "> This file was generated by [stackweave](https://github.com/stackweave/stackweave). Do not edit by hand."
  );
  lines.push("");
  for (const mod of modules) {
    const claudeMdDir = path2.join(mod.path, "claude-md");
    let files;
    try {
      files = await fs3.readdir(claudeMdDir);
    } catch {
      continue;
    }
    files.sort();
    for (const file of files) {
      const filePath = path2.join(claudeMdDir, file);
      const stat2 = await fs3.stat(filePath);
      if (!stat2.isFile()) continue;
      const raw = await fs3.readFile(filePath, "utf-8");
      const content = interpolate(raw, mod.variables);
      lines.push(content.trimEnd());
      lines.push("");
    }
  }
  return lines.join("\n");
}
async function buildMergeResult(modules, projectName, projectDescription) {
  const fragmentTypes = ["rules", "commands", "guides", "agents"];
  const allFragments = [];
  for (const type of fragmentTypes) {
    const collected = await collectFragments(modules, type);
    allFragments.push(...collected);
  }
  const mergedFragments = mergeFragments(allFragments);
  const claudeMd = await buildClaudeMd(modules, projectName, projectDescription);
  return {
    fragments: mergedFragments,
    claudeMdSections: [claudeMd]
  };
}

// src/core/writer.ts
var fs4 = __toESM(require("fs/promises"));
var path3 = __toESM(require("path"));
async function cleanOutput(outputDir) {
  try {
    await fs4.rm(outputDir, { recursive: true, force: true });
  } catch {
  }
  await fs4.mkdir(outputDir, { recursive: true });
}
async function writeFragment(outputDir, fragment) {
  const dir = path3.join(outputDir, fragment.type);
  await fs4.mkdir(dir, { recursive: true });
  const outPath = path3.join(dir, fragment.filename);
  await fs4.writeFile(outPath, fragment.content, "utf-8");
}
async function writeOutput(outputDir, mergeResult) {
  await fs4.mkdir(outputDir, { recursive: true });
  const claudeMdContent = mergeResult.claudeMdSections.join("\n");
  await fs4.writeFile(path3.join(outputDir, "CLAUDE.md"), claudeMdContent, "utf-8");
  const fragmentValues = Object.values(mergeResult.fragments);
  await Promise.all(fragmentValues.map((f) => writeFragment(outputDir, f)));
}

// src/core/engine.ts
async function generate(configPath, options = {}) {
  const configDir = path4.dirname(path4.resolve(configPath));
  const outputDir = options.outputDir ?? path4.join(configDir, ".claude");
  const modulePaths = options.modulePaths ?? [
    path4.join(configDir, "modules"),
    path4.join(__dirname, "../modules"),
    // installed package: dist/ → ../modules
    path4.join(__dirname, "../../modules")
    // ts-node dev: src/core/ → ../../modules
  ];
  const config = await parseConfig(configPath);
  const resolved = await resolveModules(config, modulePaths);
  const sorted = topologicalSort(resolved);
  const mergeResult = await buildMergeResult(
    sorted,
    config.project.name,
    config.project.description
  );
  await cleanOutput(outputDir);
  await writeOutput(outputDir, mergeResult);
  console.log(`Generated .claude/ at ${outputDir}`);
  console.log(`  Modules: ${sorted.map((m) => m.manifest.name).join(", ")}`);
  const fragmentCount = Object.keys(mergeResult.fragments).length;
  console.log(`  Fragments: ${fragmentCount} file(s)`);
}

// src/cli/generate.ts
var generateCommand = new import_commander.Command("generate").description("Generate .claude/ directory from .stackweave.yaml").option("-c, --config <path>", "Path to .stackweave.yaml", ".stackweave.yaml").option("-o, --output <path>", "Output directory (default: .claude/ next to config)").action(async (options) => {
  const configPath = path5.resolve(options.config);
  const outputDir = options.output ? path5.resolve(options.output) : void 0;
  try {
    await generate(configPath, { outputDir });
  } catch (err) {
    console.error("Error:", err instanceof Error ? err.message : String(err));
    process.exit(1);
  }
});

// src/cli/init.ts
var import_commander2 = require("commander");
var initCommand = new import_commander2.Command("init").description("Initialize a new .stackweave.yaml (not yet implemented)").action(() => {
  console.log("init not yet implemented");
});

// src/cli/index.ts
var program = new import_commander3.Command();
program.name("stackweave").description("Compose .claude/ directories from reusable modules").version("2.0.0");
program.addCommand(generateCommand);
program.addCommand(initCommand);
program.parse();
