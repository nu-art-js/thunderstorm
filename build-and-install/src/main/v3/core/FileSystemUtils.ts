import {promises as _fs} from 'fs';
import {resolve} from 'path';
import {BadImplementationException} from '@nu-art/ts-common';

async function assertFile(path: string) {
	const stat = await _fs.stat(path);
	if (!stat.isFile())
		throw new BadImplementationException(`Expected file but found directory or non-file: ${path}`);
}

async function assertFolder(path: string) {
	const stat = await _fs.stat(path);
	if (!stat.isDirectory())
		throw new BadImplementationException(`Expected folder but found file or non-directory: ${path}`);
}


async function assertExists(path: string, mustExist: boolean, type: 'File' | 'Folder') {
	async function exists(path: string): Promise<boolean> {
		try {
			await _fs.access(path);
			return true;
		} catch {
			return false;
		}
	}

	const doesExist = await exists(path);
	if (!doesExist) {
		if (mustExist)
			throw new BadImplementationException(`${type} does not exist: ${path}`);
		return false;
	}
	return true;
}

export const FileSystemUtils = {
	file: {
		delete: async (pathToFile: string, mustExist = false) => {
			if (!await assertExists(pathToFile, mustExist, 'File'))
				return;
			await assertFile(pathToFile);
			return _fs.rm(pathToFile);
		}
	},
	folder: {
		delete: async (pathToFolder: string, mustExist = false) => {
			if (!await assertExists(pathToFolder, mustExist, 'Folder'))
				return;
			await assertFolder(pathToFolder);
			return _fs.rm(pathToFolder, {recursive: true, force: true});
		},

		empty: async (pathToFolder: string, mustExist = true) => {
			if (!await assertExists(pathToFolder, mustExist, 'Folder'))
				return;
			await assertFolder(pathToFolder);
			const entries = await _fs.readdir(pathToFolder);
			await Promise.all(entries.map(entry =>
				_fs.rm(resolve(pathToFolder, entry), {recursive: true, force: true})
			));
		}
	}
};
