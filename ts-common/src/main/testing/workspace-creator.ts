import {mkdirSync, readFileSync, writeFileSync, rmSync} from 'fs';
import {dirname, resolve} from 'path';
import {Logger} from '../core/logger/Logger';

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

	setupWorkspace(fixtures: string[], relativePath = '', clean = true) {
		for (const fixture of fixtures) {
			this.extractFixture(resolve(this.pathToFixtures, fixture), relativePath, fixture === fixtures[0] && clean && relativePath === '');
		}
	}

	extractFixture(pathToFixture: string, relativePathInWorkspace = '', clean = true) {
		const content = readFileSync(pathToFixture, 'utf8');

		if (clean) {
			const path = resolve(this.pathToWorkspace, relativePathInWorkspace);
			this.logWarning(`Deleting folder: ${path}`);
			rmSync(path, {recursive: true, force: true});
		}

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

			mkdirSync(dirname(targetPath), {recursive: true});
			writeFileSync(targetPath, fileContent);
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
