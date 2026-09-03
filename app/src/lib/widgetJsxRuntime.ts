/**
 * A stand-in for `react/jsx-runtime`, aliased in `vitest.config.mts` only.
 *
 * The widget extension has no React reconciler: `expo-widgets` evaluates the
 * stringified layout with a runtime that calls function components immediately
 * and keeps the plain `{ type, props }` result (see
 * `expo-widgets/bundle/jsx-runtime-stub.ts`). Tests need the same semantics to
 * see the tree the extension will actually render — under the real React runtime
 * they'd only get unevaluated elements. Mirrors that stub; keep it faithful.
 *
 * Not used by Metro or by the widget bundle, both of which have their own.
 */

export const Fragment = 'react.fragment';

type Node = { type: unknown; key: string | null; props: Record<string, any> };

export function jsx(type: unknown, config: any, maybeKey?: string | number): Node {
  const { key: configKey, ...props } = config ?? {};
  const key = maybeKey !== undefined ? String(maybeKey) : (configKey ?? null);

  // React flattens nested children arrays during reconciliation; there is no
  // reconciler here, and the native parsers expect a flat children list.
  if (Array.isArray(props.children)) {
    props.children = props.children.flat(Infinity);
  }

  if (typeof type === 'function') {
    return (type as (p: Record<string, any>) => Node)(props);
  }
  return { type, key: key === null ? null : String(key), props };
}

export const jsxs = jsx;
export const jsxDEV = jsx;
