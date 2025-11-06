import {promises as _fs} from 'fs';
import {resolve} from 'path';
import {BadImplementationException} from '../core/exceptions/exceptions.js';
import {StringMap} from './types.js';
import {exists} from './tools.js';
import path from 'node:path';


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


export const DEFAULT_TEMPLATE_PATTERN = new RegExp(`\{\{(\\S*?)\}\}`);
export const DEFAULT_OLD_TEMPLATE_PATTERN = new RegExp(`(?<!\\\\)\\$([a-zA-Z][\\w-_]{2,})`);

export const FileSystemUtils = {
	exists: async (pathToFile: string) => {
		return await fileExists(pathToFile);
	},
	file: {
		isFile: async (pathToFile: string) => {
			return isFile(pathToFile);
		},
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

					input = input.replace(match[0], value);
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
		isFolder: async (pathToFile: string) => {
			return isFolder(pathToFile);
		},

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
				return Promise.all(entries.map(entry => callback(resolve(pathToFolder, entry))));
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
		}),
		iterate: async (pathToDir: string, options: FileIteratorOptions) => {
			const pathToEntry = path.resolve(pathToDir);

			if (await FileSystemUtils.file.isFile(pathToEntry)) {
				(await options.filter(pathToEntry)) && (await options.processor(pathToEntry));
				return;
			}


			if (await FileSystemUtils.folder.isFolder(pathToEntry)) {
				await FileSystemUtils.folder.list.forEach(pathToEntry, async (entry): Promise<any> => {
					return (await options.filter(entry)) && (await FileSystemUtils.folder.iterate(entry, options));
				});
				return;
			}

			throw new BadImplementationException(`Expected file or folder but found something else: ${pathToEntry}`);
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

type FileIteratorOptions = {
	filter: (path: string) => Promise<boolean>
	processor: (path: string) => Promise<any>
	followSymlinks?: boolean
}
