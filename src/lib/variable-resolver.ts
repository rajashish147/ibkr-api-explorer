import { EnvironmentVariable } from '@/types/environment';

const VARIABLE_PATTERN = /\{\{([^}]+)\}\}/g;

export function resolveVariables(
  input: string,
  variables: EnvironmentVariable[]
): string {
  const activeVars = variables.filter((v) => v.enabled);
  const varMap = new Map(activeVars.map((v) => [v.key, v.value]));

  return input.replace(VARIABLE_PATTERN, (match, key) => {
    const trimmedKey = key.trim();
    return varMap.has(trimmedKey) ? varMap.get(trimmedKey)! : match;
  });
}

export function resolveVariablesInObject(
  obj: Record<string, string>,
  variables: EnvironmentVariable[]
): Record<string, string> {
  const resolved: Record<string, string> = {};
  for (const [key, value] of Object.entries(obj)) {
    resolved[key] = resolveVariables(value, variables);
  }
  return resolved;
}

export function findVariableReferences(input: string): string[] {
  const refs: string[] = [];
  const matches = input.matchAll(VARIABLE_PATTERN);
  for (const match of matches) {
    refs.push(match[1].trim());
  }
  return refs;
}

export function hasUnresolvedVariables(
  input: string,
  variables: EnvironmentVariable[]
): boolean {
  const activeVars = new Set(variables.filter((v) => v.enabled).map((v) => v.key));
  const refs = findVariableReferences(input);
  return refs.some((ref) => !activeVars.has(ref));
}

export function wrapVariable(key: string): string {
  return `{{${key}}}`;
}
