import {promises as _fs} from 'fs';
import {resolve} from 'path';
import {_keys, BadImplementationException, StringMap} from '@nu-art/ts-common';

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

async function exists(path: string): Promise<boolean> {
	try {
		await _fs.access(path);
		return true;
	} catch {
		return false;
	}
}

async function assertExists(path: string, mustExist: boolean, type: 'File' | 'Folder' | 'Symlink') {
	const doesExist = await exists(path);
	if (!doesExist) {
		if (mustExist)
			throw new BadImplementationException(`${type} does not exist: ${path}`);
		return false;
	}
	return true;
}

const DEFAULT_TEMPLATE_PATTERN = (key: string | number) => new RegExp(`\{\{${key}\}\}`, 'g');
export const FileSystemUtils = {
	file: {
		exists: async (pathToFile: string) => {
			return await exists(pathToFile);
		},
		delete: async (pathToFile: string, mustExist = false) => {
			if (!await assertExists(pathToFile, mustExist, 'File'))
				return;
			await assertFile(pathToFile);
			return _fs.rm(pathToFile);
		},
		write: async (pathToFile: string, content: string) => {
			return _fs.writeFile(pathToFile, content, 'utf-8');
		},
		read: async (pathToFile: string) => {
			await assertFile(pathToFile);
			return _fs.readFile(pathToFile, 'utf-8');
		},
		copy: async (sourcePath: string, targetPath: string) => {
			await assertExists(targetPath, false, 'File');
			await assertFile(sourcePath);
			await FileSystemUtils.folder.create(resolve(targetPath, '..'));
			return _fs.copyFile(sourcePath, targetPath);
		},
		template: {
			read: async (pathToFile: string, params: StringMap, pattern = DEFAULT_TEMPLATE_PATTERN) => {
				const content = await FileSystemUtils.file.read(pathToFile);
				return FileSystemUtils.file.template.transform(content, params, pattern);
			},
			transform: (input: string, params: StringMap, pattern = DEFAULT_TEMPLATE_PATTERN) => {
				return _keys(params).reduce((_input: string, key) => {
					return _input.replace(pattern(key), params[key]);
				}, input);
			},
			write: async (pathToFile: string, content: string, params: StringMap, pattern = DEFAULT_TEMPLATE_PATTERN) => {
				const transformedContent = FileSystemUtils.file.template.transform(content, params, pattern);
				return FileSystemUtils.file.write(pathToFile, transformedContent);
			},
			copy: async (sourcePath: string, targetPath: string, params: StringMap, pattern = DEFAULT_TEMPLATE_PATTERN) => {
				const content = await FileSystemUtils.file.read(sourcePath);
				const transformedContent = FileSystemUtils.file.template.transform(content, params, pattern);
				return FileSystemUtils.file.write(targetPath, transformedContent);
			}
		},
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
		},

		create: async (pathToFolder: string) => {
			if (await exists(pathToFolder))
				return assertFolder(pathToFolder);
			return _fs.mkdir(pathToFolder, {recursive: true});
		}
	},
	symlink: {
		create: async (targetPath: string, linkPath: string) => {
			return _fs.symlink(targetPath, linkPath);
		},

		delete: async (pathToLink: string, mustExist = false) => {
			if (!await assertExists(pathToLink, mustExist, 'Symlink'))
				return;
			const stat = await _fs.lstat(pathToLink);
			if (!stat.isSymbolicLink())
				throw new BadImplementationException(`Expected symlink but found something else: ${pathToLink}`);
			return _fs.unlink(pathToLink);
		},

		read: async (pathToLink: string) => {
			return _fs.readlink(pathToLink);
		}
	}
};