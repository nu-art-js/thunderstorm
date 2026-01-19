import {ImplementationMissingException, TypedMap} from '@nu-art/ts-common';
import {promises as fs} from 'fs';

let cachedFiles: TypedMap<any> = {};

const readFile = async (path: string): Promise<string> => {
	try {
		const fileStat = await fs.stat(path);
		if (fileStat.isFile())
			return await fs.readFile(path, 'utf-8');

	} catch (error: any) {
		if (error.code === 'ENOENT')
			throw new ImplementationMissingException(`file does not exist: ${path}`);

		throw error; // rethrow other errors
	}

	throw new ImplementationMissingException(`expected a file at: ${path}`);
};


/**
 * File cache for loading and caching file contents.
 * 
 * **Purpose**: Avoids re-reading files multiple times during build process.
 * 
 * **Caching Strategy**:
 * - Files are cached in memory after first read
 * - JSON files are parsed and frozen (immutable)
 * - Text files are cached as strings
 * - Cache persists for entire build session
 * 
 * **Usage**: Used to load config files (bai-config.json, package.json, etc.)
 * that are read multiple times during workspace scanning and unit initialization.
 * 
 * **Clear Cache**: Call `FilesCache.clear()` to reset cache (useful for tests).
 */
export const FilesCache = {
	/**
	 * Clears the file cache.
	 * 
	 * Useful for tests or when files may have changed.
	 */
	clear: () => cachedFiles = {},
	load: {
		/**
		 * Loads and caches a JSON file.
		 * 
		 * **Behavior**:
		 * - Returns cached value if already loaded
		 * - Parses JSON and freezes result (immutable)
		 * - Throws `ImplementationMissingException` if file doesn't exist or is not a file
		 * 
		 * @param pathToFile - Path to JSON file
		 * @returns Promise resolving to parsed and frozen JSON object
		 */
		json: async <T>(pathToFile: string): Promise<T> => {
			const json = cachedFiles[pathToFile];
			if (!json)
				cachedFiles[pathToFile] = Object.freeze(JSON.parse(await readFile(pathToFile)));

			return cachedFiles[pathToFile];
		},
		/**
		 * Loads and caches a text file.
		 * 
		 * **Behavior**:
		 * - Returns cached value if already loaded
		 * - Reads file as UTF-8 text
		 * - Throws `ImplementationMissingException` if file doesn't exist or is not a file
		 * 
		 * @param pathToFile - Path to text file
		 * @returns Promise resolving to file content as string
		 */
		text: async (pathToFile: string): Promise<string> => {
			const fileContent = cachedFiles[pathToFile];
			if (!fileContent)
				cachedFiles[pathToFile] = await readFile(pathToFile);

			return cachedFiles[pathToFile];
		}
	}
};