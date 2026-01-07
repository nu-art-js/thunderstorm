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


/**
 * Default template pattern for `{{variable}}` syntax.
 *
 * Matches `{{variableName}}` where variableName is any non-whitespace sequence.
 */
export const DEFAULT_TEMPLATE_PATTERN = new RegExp(`\{\{(\\S*?)\}\}`);

/**
 * Legacy template pattern for `$variable` syntax.
 *
 * Matches `$variableName` where variableName is 3+ alphanumeric characters, dashes, or underscores.
 * Uses negative lookbehind to avoid matching escaped `\$variable`.
 */
export const DEFAULT_OLD_TEMPLATE_PATTERN = new RegExp(`(?<!\\\\)\\$([a-zA-Z][\\w-_]{2,})`);

/**
 * File system utility object providing async file and folder operations.
 *
 * Provides a structured API for file system operations with:
 * - File operations: read, write, copy, delete, template processing
 * - Folder operations: create, delete, empty, list, iterate
 * - Symlink operations: create, read, delete
 * - Automatic folder creation for file operations
 * - Template variable substitution
 * - JSON read/write helpers
 *
 * **Error handling**: Most operations throw `BadImplementationException` on errors.
 * Some operations have `mustExist` parameters to control error behavior.
 */
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
		write: Object.assign(async (pathToFile: string, content: string) => {
			await FileSystemUtils.folder.create(resolve(pathToFile, '..'));
			return _fs.writeFile(pathToFile, content, 'utf-8');
		}, {
			json: async <T>(pathToFile: string, value: T) => {
				return await FileSystemUtils.file.write(pathToFile, JSON.stringify(value, null, 2));
			}
		}),
		read: Object.assign(async (pathToFile: string) => {
			await assertFile(pathToFile);
			return _fs.readFile(pathToFile, 'utf-8');
		}, {
			json: async <T>(pathToFile: string, defaultValue?: T): Promise<T> => {
				try {
					return JSON.parse(await FileSystemUtils.file.read(pathToFile));
				} catch (e) {
					if (!exists(defaultValue))
						throw e;

					return defaultValue;
				}
			}
		}),
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
			transform: (input: string, params: StringMap, _pattern = DEFAULT_TEMPLATE_PATTERN) => {
				const flags = _pattern.flags.includes('g') ? _pattern.flags : _pattern.flags + 'g';
				const pattern = new RegExp(_pattern.source, flags);

				return input.replace(pattern, (match, param) => {
					if (!Object.hasOwn(params, param))
						throw new BadImplementationException(`Missing template param: ${param}`);

					const value = params[param];
					if (!exists(value))
						throw new BadImplementationException(`Template param value is empty: ${param}`);

					return value;
				});

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
	/**
	 * Folder/directory operations.
	 */
	folder: {
		/**
		 * Checks if a path is a folder.
		 *
		 * @param pathToFile - Path to check
		 * @returns true if path is a folder, false otherwise
		 */
		isFolder: async (pathToFile: string) => {
			return isFolder(pathToFile);
		},

		/**
		 * Deletes a folder and all its contents recursively.
		 *
		 * Uses `force: true` to handle read-only files and other edge cases.
		 *
		 * @param pathToFolder - Path to folder to delete
		 * @param mustExist - If true, throws if folder doesn't exist. If false, silently returns (default: false)
		 */
		delete: async (pathToFolder: string, mustExist = false) => {
			if (!await assertExists(pathToFolder, mustExist, 'Folder'))
				return;
			await assertFolder(pathToFolder);
			return _fs.rm(pathToFolder, {recursive: true, force: true});
		},

		/**
		 * Empties a folder by deleting all its contents.
		 *
		 * Removes all files and subdirectories but keeps the folder itself.
		 *
		 * @param pathToFolder - Path to folder to empty
		 * @param mustExist - If true, throws if folder doesn't exist. If false, silently returns (default: true)
		 */
		empty: async (pathToFolder: string, mustExist = true) => {
			if (!await assertExists(pathToFolder, mustExist, 'Folder'))
				return;
			await assertFolder(pathToFolder);
			const entries = await _fs.readdir(pathToFolder);
			await Promise.all(entries.map(entry =>
				_fs.rm(resolve(pathToFolder, entry), {recursive: true, force: true})
			));
		},

		/**
		 * Creates a folder and all necessary parent directories.
		 *
		 * If the folder already exists, verifies it's actually a folder (throws if it's a file).
		 * Uses `recursive: true` to create parent directories as needed.
		 *
		 * @param pathToFolder - Path to folder to create
		 */
		create: async (pathToFolder: string) => {
			if (await fileExists(pathToFolder))
				return assertFolder(pathToFolder);
			return _fs.mkdir(pathToFolder, {recursive: true});
		},

		/**
		 * Copies a folder and all its contents recursively.
		 *
		 * Uses Node.js built-in `fs.promises.cp` for efficient recursive copying.
		 * Creates the target folder if it doesn't exist.
		 *
		 * @param sourcePath - Path to source folder
		 * @param targetPath - Path to target folder
		 * @param mustExist - If true, throws if source folder doesn't exist. If false, silently returns (default: true)
		 */
		copy: async (sourcePath: string, targetPath: string, mustExist = true) => {
			if (!await assertExists(sourcePath, mustExist, 'Folder'))
				return;
			await assertFolder(sourcePath);

			// Create target folder parent directory
			await FileSystemUtils.folder.create(resolve(targetPath, '..'));

			// Use Node.js built-in recursive copy (available in Node.js 16.7.0+)
			return _fs.cp(sourcePath, targetPath, {recursive: true});
		},
		/**
		 * Folder listing operations.
		 */
		list: Object.assign(async (pathToFolder: string) => {
			/**
			 * Lists all entries in a folder.
			 *
			 * @param pathToFolder - Path to folder
			 * @returns Array of entry names (files and folders)
			 */
			return await _fs.readdir(pathToFolder);
		}, {
			/**
			 * Iterates over all entries in a folder and calls a callback for each.
			 *
			 * Processes entries in parallel. The callback receives the full resolved path.
			 *
			 * @param pathToFolder - Path to folder
			 * @param callback - Async function called for each entry
			 */
			forEach: Object.assign(async (pathToFolder: string, callback: (path: string) => Promise<any>) => {
				const entries = await _fs.readdir(pathToFolder);
				return Promise.all(entries.map(entry => callback(resolve(pathToFolder, entry))));
			}, {
				/**
				 * Iterates over files only in a folder.
				 *
				 * Filters out directories and calls the callback only for files.
				 *
				 * @param pathToFolder - Path to folder
				 * @param callback - Async function called for each file
				 */
				file: async (pathToFolder: string, callback: (path: string) => Promise<any>) => {
					await FileSystemUtils.folder.list.forEach(pathToFolder, async entry => {
						if (!await isFile(entry))
							return;

						await callback(entry);
					});
				},
				/**
				 * Iterates over folders only in a directory.
				 *
				 * Filters out files and calls the callback only for folders.
				 *
				 * @param pathToFolder - Path to folder
				 * @param callback - Async function called for each subfolder
				 */
				folder: async (pathToFolder: string, callback: (path: string) => Promise<any>) => {
					await FileSystemUtils.folder.list.forEach(pathToFolder, async entry => {
						if (!await isFolder(entry))
							return;

						await callback(entry);
					});
				}
			})
		}),
		/**
		 * Recursively iterates over files and folders with filtering.
		 *
		 * Traverses the directory tree recursively. For each entry:
		 * 1. Calls `filter()` - if it returns false, skips the entry
		 * 2. If it's a file, calls `processor()`
		 * 3. If it's a folder, recursively processes its contents
		 *
		 * **Note**: The filter is called for each entry before processing. If filter
		 * returns false for a folder, its contents are not processed.
		 *
		 * @param pathToDir - Path to directory to iterate
		 * @param options - Iterator options with filter and processor functions
		 * @throws BadImplementationException if path is neither file nor folder
		 */
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
	/**
	 * Symbolic link operations.
	 */
	symlink: {
		/**
		 * Creates a symbolic link.
		 *
		 * @param targetPath - Path that the symlink points to
		 * @param linkPath - Path where the symlink will be created
		 */
		create: async (targetPath: string, linkPath: string) => {
			return _fs.symlink(targetPath, linkPath);
		},

		/**
		 * Deletes a symbolic link.
		 *
		 * Uses `lstat()` to check if the path is actually a symlink (not following it).
		 *
		 * @param pathToLink - Path to symlink to delete
		 * @param mustExist - If true, throws if symlink doesn't exist. If false, silently returns (default: false)
		 * @throws BadImplementationException if path exists but is not a symlink
		 */
		delete: async (pathToLink: string, mustExist = false) => {
			if (!await assertExists(pathToLink, mustExist, 'Symlink'))
				return;
			const stat = await _fs.lstat(pathToLink);
			if (!stat.isSymbolicLink())
				throw new BadImplementationException(`Expected symlink but found something else: ${pathToLink}`);
			return _fs.unlink(pathToLink);
		},

		/**
		 * Reads the target path of a symbolic link.
		 *
		 * @param pathToLink - Path to symlink
		 * @returns Target path that the symlink points to
		 */
		read: async (pathToLink: string) => {
			return _fs.readlink(pathToLink);
		}
	}
};

/**
 * Options for recursive file/folder iteration.
 */
type FileIteratorOptions = {
	/** Filter function - returns true to process entry, false to skip */
	filter: (path: string) => Promise<boolean>
	/** Processor function - called for each entry that passes the filter */
	processor: (path: string) => Promise<any>
	/** Whether to follow symbolic links (not currently implemented) */
	followSymlinks?: boolean
}
