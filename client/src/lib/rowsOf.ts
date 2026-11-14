export type RowsSource<T> = { rows?: T[] | null } | T[] | null | undefined;

/**
 * Converts either a table hook result or a raw array into a safe array.
 * Invalid/missing rows are treated as an empty collection so read-only UI
 * modules cannot crash while data is loading or after a failed query.
 */
export function rowsOf<T>(source: RowsSource<T>): T[] {
  if (Array.isArray(source)) return source;
  return Array.isArray(source?.rows) ? source.rows : [];
}
