import {ImplementationMissingException, TypedMap} from '@nu-art/ts-common';
import {promises as fs} from 'fs';

const cachedFiles: TypedMap<any> = {};

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


export const FilesCache = {
	load: {
		json: async <T>(pathToFile: string): Promise<T> => {
			const json = cachedFiles[pathToFile];
			if (!json)
				cachedFiles[pathToFile] = Object.freeze(JSON.parse(await readFile(pathToFile)));

			return cachedFiles[pathToFile];
		},
		text: async (pathToFile: string): Promise<string> => {
			const fileContent = cachedFiles[pathToFile];
			if (!fileContent)
				cachedFiles[pathToFile] = await readFile(pathToFile);

			return cachedFiles[pathToFile];
		}
	}
};