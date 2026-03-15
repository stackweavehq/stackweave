export type LayerName = 'base' | 'lang' | 'stack' | 'infra' | 'pattern' | 'project';

export interface VariableDef {
  type: 'string' | 'boolean' | 'number';
  default: string | boolean | number;
  description?: string;
}

export interface ModuleManifest {
  name: string;
  description: string;
  layer: LayerName;
  version: string;
  dependencies?: string[];
  variables?: Record<string, VariableDef>;
}

/**
 * How modules appear in .stackweave.yaml:
 *   - string form:  "base-conventions"
 *   - object form:  { "typescript-strict": { strict_mode: true } }
 */
export type ModuleConfig = string | Record<string, Record<string, unknown>>;

export interface StackweaveConfig {
  project: {
    name: string;
    description?: string;
  };
  modules: ModuleConfig[];
  overrides?: {
    rules?: string;
    'claude-md'?: string;
    commands?: string;
    guides?: string;
    agents?: string;
  };
}

export interface ResolvedModule {
  manifest: ModuleManifest;
  path: string;
  variables: Record<string, unknown>;
}

export interface Fragment {
  type: string;
  filename: string;
  content: string;
  layer: LayerName;
  moduleName: string;
}

export interface MergeResult {
  fragments: Record<string, Fragment>;
  claudeMdSections: string[];
}
