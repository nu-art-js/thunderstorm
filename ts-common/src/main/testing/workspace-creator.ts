import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {Logger} from '../core/logger/index.js';
import {StringMap} from '../utils/types.js';
import {FileSystemUtils} from '../utils/FileSystemUtils.js';

/** Regex for matching file header comments: `// file: path/to/file` */
const FILE_HEADER_REGEX = /^\/\/ file: (.+)$/gm;
/** Regex for matching nested file headers (to escape them) */
const INNER_FILE_HEADER_REGEX = /^(\/\/)*?\/\/\/\/ file:/gm;

/**
 * Creates test workspaces from fixture files.
 *
 * Parses fixture files that contain multiple file definitions using the
 * `// file: path/to/file` syntax. Extracts each file and writes it to
 * the workspace directory, optionally applying template variable substitution.
 *
 * **Fixture format**:
 * ```
 * // file: ./path/to/file1.ts
 * content of file1
 *
 * // file: ./path/to/file2.ts
 * content of file2
 * ```
 */
export class TestWorkspaceCreator
	extends Logger {

	/** Path to directory containing fixture files */
	private readonly pathToFixtures: string;
	/** Path to workspace directory where files will be created */
	private readonly pathToWorkspace: string;

	/**
	 * Creates a TestWorkspaceCreator instance.
	 *
	 * @param pathToFixtures - Path to fixtures directory
	 * @param pathToWorkspace - Path to workspace directory
	 */
	constructor(pathToFixtures: string, pathToWorkspace: string) {
		super();
		this.pathToFixtures = pathToFixtures;
		this.pathToWorkspace = pathToWorkspace;
	}

	/**
	 * Sets up a test workspace from fixture files.
	 *
	 * **Overloads**:
	 * - `setupWorkspace(fixtures, relativePath?, clean?)` - No template params
	 * - `setupWorkspace(fixtures, params, relativePath?, clean?)` - With template params
	 *
	 * **Behavior**:
	 * - Optionally cleans the workspace before setup
	 * - Reads fixture files and extracts multiple files from each
	 * - Applies template variable substitution if params provided
	 * - Writes files to workspace (optionally under a relative path)
	 *
	 * @param fixtures - Array of fixture file names (relative to pathToFixtures)
	 * @param params - Optional template parameters or relative path (overloaded)
	 * @param relativePath - Optional relative path in workspace or clean flag (overloaded)
	 * @param clean - Whether to clean workspace before setup (default: true)
	 */
	async setupWorkspace(fixtures: string[], relativePath?: string, clean?: boolean): Promise<void>;
	async setupWorkspace(fixtures: string[], params: StringMap, relativePath?: string, clean?: boolean): Promise<void>;
	async setupWorkspace(fixtures: string[], params?: StringMap | string, relativePath?: boolean | string, clean?: boolean) {
		let _clean = clean;
		let _relativePath;
		let _params;

		if (typeof relativePath === 'boolean') {
			_clean = relativePath;
		} else if (typeof relativePath === 'string') {
			_relativePath = relativePath;
		}

		if (typeof params === 'string') {
			_relativePath = params;
			_params = {};
		} else {
			_params = params;
		}

		_relativePath = _relativePath ?? '';
		_clean = _clean ?? true;

		if (_clean)
			await this.clearWorkspace(_relativePath);

		for (const fixture of fixtures) {
			await this.extractFixture(resolve(this.pathToFixtures, fixture), _relativePath, _params);
		}
	}

	/**
	 * Clears (deletes) the workspace or a subdirectory.
	 *
	 * @param relativePathInWorkspace - Optional relative path within workspace to clear
	 */
	async clearWorkspace(relativePathInWorkspace = '') {
		const path = resolve(this.pathToWorkspace, relativePathInWorkspace);
		this.logWarning(`Deleting folder: ${path}`);
		await FileSystemUtils.folder.delete(path);
	}

	/**
	 * Extracts files from a fixture file and writes them to the workspace.
	 *
	 * Parses the fixture file for `// file: path` headers and extracts each
	 * file section. Applies template variable substitution and writes files.
	 *
	 * **File format**: Files are separated by `// file: ./path/to/file` headers.
	 * Nested file headers (with extra slashes) are escaped to prevent conflicts.
	 *
	 * @param pathToFixture - Path to fixture file
	 * @param relativePathInWorkspace - Optional relative path in workspace
	 * @param params - Template parameters for variable substitution
	 */
	async extractFixture(pathToFixture: string, relativePathInWorkspace = '', params: StringMap = {}) {
		const content = await FileSystemUtils.file.template.read(pathToFixture, params);


		const matches = [...content.matchAll(FILE_HEADER_REGEX)];
		if (matches.length === 0) {
			this.logError('No matching file headers found. Aborting.');
			return;
		}

		for (let i = 0; i < matches.length; i++) {
			const currentMatch = matches[i];
			const startIndex = currentMatch.index!;
			const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;

			const rawPath = currentMatch[1].trim();
			if (!rawPath.startsWith('./'))
				throw new Error(`Path must be relative and start with './' => received: "${rawPath}"`);

			const relativePath = rawPath.slice(2);
			const targetPath = resolve(this.pathToWorkspace, relativePathInWorkspace, relativePath);

			let fileContent = content
				.slice(startIndex + currentMatch[0].length, endIndex)
				.trimStart();

			fileContent = fileContent.replace(INNER_FILE_HEADER_REGEX, '\$1// file:');

			await FileSystemUtils.file.write(targetPath, fileContent);
			this.logVerbose(`Wrote: ${targetPath}`);
		}
	}
}

/**
 * Standalone function to set up a workspace from a single fixture file.
 *
 * Synchronous version that reads a fixture file and extracts all files defined
 * within it. Does not support template variable substitution.
 *
 * @param pathToWorkspaceFile - Path to fixture file
 * @param outputRootDir - Root directory for output files
 * @param clean - Whether to clean output directory first (default: true)
 */
export function setupWorkspace(pathToWorkspaceFile: string, outputRootDir: string, clean = true) {
	const content = readFileSync(pathToWorkspaceFile, 'utf8');

	if (clean)
		rmSync(outputRootDir, {recursive: true, force: true});

	const matches = [...content.matchAll(FILE_HEADER_REGEX)];
	if (matches.length === 0) {
		console.error('No matching file headers found. Aborting.');
		return;
	}

	for (let i = 0; i < matches.length; i++) {
		const currentMatch = matches[i];
		const startIndex = currentMatch.index!;
		const endIndex = i < matches.length - 1 ? matches[i + 1].index! : content.length;

		const rawPath = currentMatch[1].trim();
		if (!rawPath.startsWith('./'))
			throw new Error(`Path must be relative and start with './' => received: "${rawPath}"`);

		const relativePath = rawPath.slice(2);
		const targetPath = resolve(outputRootDir, relativePath);

		let fileContent = content
			.slice(startIndex + currentMatch[0].length, endIndex)
			.trimStart();

		fileContent = fileContent.replace(INNER_FILE_HEADER_REGEX, '// file:');

		mkdirSync(dirname(targetPath), {recursive: true});
		writeFileSync(targetPath, fileContent);
		console.log(`Wrote: ${targetPath}`);
	}
}
