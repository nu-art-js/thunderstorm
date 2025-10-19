import {promises as _fs} from 'fs';
import {resolve} from 'path';
import {BadImplementationException} from '../core/exceptions/exceptions.js';
import {StringMap} from './types.js';
import {exists} from './tools.js';


async function isFile(path: string) {
	return (await _fs.stat(path)).isFile();
}

async function isFolder(path: string) {
	return (await _fs.stat(path)).isDirectory();
}

async function assertFile(path: string) {
	if (!(await isFile(path)))
		throw new BadImplementationException(`Expected file but found directory or non-file: ${path}`);
}

async function assertFolder(path: string) {
	if (!(await isFolder(path)))
		throw new BadImplementationException(`Expected folder but found file or non-directory: ${path}`);
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await _fs.access(path);
		return true;
	} catch {
		return false;
	}
}

async function assertExists(path: string, mustExist: boolean, type: 'File' | 'Folder' | 'Symlink') {
	const doesExist = await fileExists(path);
	if (!doesExist) {
		if (mustExist)
			throw new BadImplementationException(`${type} does not exist: ${path}`);
		return false;
	}
	return true;
}


const escapeRegExp = (string: string) => string.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');

export const DEFAULT_TEMPLATE_PATTERN = new RegExp(`\{\{([a-zA-Z]\\w{2,}?)\}\}`);
export const DEFAULT_OLD_TEMPLATE_PATTERN = new RegExp(`(?<!\\\\)\\$([a-zA-Z]\\w{2,})`);

export const FileSystemUtils = {
	file: {
		exists: async (pathToFile: string) => {
			return await fileExists(pathToFile);
		},
		delete: async (pathToFile: string, mustExist = false) => {
			if (!await assertExists(pathToFile, mustExist, 'File'))
				return;
			await assertFile(pathToFile);
			return _fs.rm(pathToFile);
		},
		write: async (pathToFile: string, content: string) => {
			await FileSystemUtils.folder.create(resolve(pathToFile, '..'));
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
				let match;
				while (match = input.match(pattern)) {
					const value = params[match[1]];
					if (!exists(value))
						throw new BadImplementationException(`Missing template param: ${match[1]}`);

					const fullMatchRegex = new RegExp(escapeRegExp(match[0]), 'g');
					input = input.replace(fullMatchRegex, value);
				}

				return input;
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
			if (await fileExists(pathToFolder))
				return assertFolder(pathToFolder);
			return _fs.mkdir(pathToFolder, {recursive: true});
		},
		list: Object.assign(async (pathToFolder: string) => {
			return await _fs.readdir(pathToFolder);
		}, {
			forEach: Object.assign(async (pathToFolder: string, callback: (path: string) => Promise<any>) => {
				const entries = await _fs.readdir(pathToFolder);
				for (const entry of entries)
					await callback(resolve(pathToFolder, entry));
			}, {
				file: async (pathToFolder: string, callback: (path: string) => Promise<any>) => {
					await FileSystemUtils.folder.list.forEach(pathToFolder, async entry => {
						if (!await isFile(entry))
							return;

						await callback(entry);
					});
				},
				folder: async (pathToFolder: string, callback: (path: string) => Promise<any>) => {
					await FileSystemUtils.folder.list.forEach(pathToFolder, async entry => {
						if (!await isFolder(entry))
							return;

						await callback(entry);
					});
				}
			})
		})
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