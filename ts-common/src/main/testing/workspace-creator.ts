import {mkdirSync, readFileSync, rmSync, writeFileSync} from 'fs';
import {dirname, resolve} from 'path';
import {Logger} from '../core/logger/Logger.js';
import {StringMap} from '../utils/index.js';
import {FileSystemUtils} from '../utils/FileSystemUtils.js';

const FILE_HEADER_REGEX = /^\/\/ file: (.+)$/gm;
const INNER_FILE_HEADER_REGEX = /^(\/\/)*?\/\/\/\/ file:/gm;

export class TestWorkspaceCreator
	extends Logger {

	private readonly pathToFixtures: string;
	private readonly pathToWorkspace: string;

	constructor(pathToFixtures: string, pathToWorkspace: string) {
		super();
		this.pathToFixtures = pathToFixtures;
		this.pathToWorkspace = pathToWorkspace;
	}

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

	async clearWorkspace(relativePathInWorkspace = '') {
		const path = resolve(this.pathToWorkspace, relativePathInWorkspace);
		this.logWarning(`Deleting folder: ${path}`);
		await FileSystemUtils.folder.delete(path);
	}

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
