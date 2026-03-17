import {fileURLToPath} from 'node:url';
import path from 'node:path';

/**
 * Gets the directory name from an ES module import.meta.url.
 *
 * Equivalent to `__dirname` in CommonJS, but for ES modules.
 * Converts the `import.meta.url` to a file path, then gets its directory.
 *
 * @param metaUrl - The `import.meta.url` value from the calling module
 * @returns Directory path of the module
 *
 * @example
 * ```typescript
 * const dir = ___dirname(import.meta.url);
 * // Returns the directory containing the current module
 * ```
 */
export const ___dirname = (metaUrl: string) =>
	path.dirname(fileURLToPath(metaUrl));

