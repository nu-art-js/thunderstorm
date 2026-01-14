import {AbsolutePath} from '@nu-art/ts-common';
import * as  path from 'path';

/**
 * Removes ANSI escape codes from a string.
 * 
 * Strips color codes and formatting sequences (e.g., `\x1B[31m` for red text)
 * from shell command output. Useful for processing command output that
 * contains terminal formatting.
 * 
 * **Regex**: Matches ANSI escape sequences starting with `\x1B[` followed by
 * digits, optional semicolon, more digits, and ending with `m`.
 * 
 * @param text - Text containing ANSI escape codes
 * @returns Text with all ANSI codes removed
 */
export function removeAnsiCodes(text: string) {
	// This regular expression matches the escape codes and removes them
	return text.replace(/\x1B\[\d+;?\d*m/g, '');
}

/**
 * Converts a relative or absolute path to a full absolute path.
 * 
 * **Behavior**:
 * - Removes leading slashes (normalizes paths like `/path/to/file`)
 * - Resolves relative to `assetParentPath` (defaults to `process.cwd()`)
 * - Returns a branded `AbsolutePath` type
 * 
 * **Note**: The commented-out validation that checks if the resolved path
 * is within `assetParentPath` is disabled. This could be a security concern
 * if used with user-provided paths.
 * 
 * @param pathToFile - Path to convert (relative or absolute)
 * @param assetParentPath - Base path for resolution (default: `process.cwd()`)
 * @returns Absolute path as branded type
 * @throws Error if path is not provided or is empty
 */
export function convertToFullPath(pathToFile: string, assetParentPath = process.cwd()): AbsolutePath {
	if (!pathToFile)
		throw new Error('Path not provided');

	if (pathToFile === '')
		throw new Error('Empty path not allowed');

	while (pathToFile.startsWith('/'))
		pathToFile = pathToFile.substring(1);

	const absolutePath = path.resolve(assetParentPath, pathToFile);
	// if (!absolutePath.startsWith(assetParentPath))
	// 	throw new Error(`Found path: '${absolutePath}' which is out of the scope of the assert directory: '${assetParentPath}'`);

	return absolutePath as AbsolutePath;
}