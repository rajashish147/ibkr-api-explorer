'use client';

import { useMemo } from 'react';
import { useEnvironmentStore } from '@/stores/useEnvironmentStore';
import { resolveVariables, findVariableReferences, hasUnresolvedVariables } from '@/lib/variable-resolver';

export function useVariableResolver() {
  const { getActiveVariables } = useEnvironmentStore();
  const variables = getActiveVariables();

  const resolve = useMemo(
    () => (input: string) => resolveVariables(input, variables),
    [variables]
  );

  const findRefs = useMemo(
    () => (input: string) => findVariableReferences(input),
    []
  );

  const hasUnresolved = useMemo(
    () => (input: string) => hasUnresolvedVariables(input, variables),
    [variables]
  );

  return { resolve, findRefs, hasUnresolved, variables };
}
