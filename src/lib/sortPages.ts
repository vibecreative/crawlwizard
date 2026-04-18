/**
 * Hierarchical URL-path based ordering for project pages.
 * - Homepage first (path "" or "/")
 * - Then by path depth (shallower first)
 * - Then alphabetically by path
 */
export function urlSortKey(url: string): [number, number, string] {
  let path = url;
  try {
    path = new URL(url).pathname || "/";
  } catch {
    // ignore
  }
  const trimmed = path.replace(/^\/+|\/+$/g, "");
  const isHome = trimmed === "";
  const depth = isHome ? 0 : trimmed.split("/").length;
  return [isHome ? 0 : 1, depth, path.toLowerCase()];
}

export function sortByUrlHierarchy<T extends { url: string }>(items: T[]): T[] {
  return [...items].sort((a, b) => {
    const ka = urlSortKey(a.url);
    const kb = urlSortKey(b.url);
    if (ka[0] !== kb[0]) return ka[0] - kb[0];
    if (ka[1] !== kb[1]) return ka[1] - kb[1];
    return ka[2].localeCompare(kb[2]);
  });
}
