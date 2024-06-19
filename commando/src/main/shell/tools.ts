import {AbsolutePath} from '@nu-art/ts-common';
import * as  path from 'path';


export function removeAnsiCodes(text: string) {
	// This regular expression matches the escape codes and removes them
	return text.replace(/\x1B\[\d+;?\d*m/g, '');
}

export function convertToFullPath(pathToFile: string, assetParentPath = process.cwd()): AbsolutePath {
	if (!pathToFile)
		throw new Error('Path not provided');

	if (pathToFile === '')
		throw new Error('Empty path not allowed');

	while (pathToFile.startsWith('/'))
		pathToFile = pathToFile.substring(1);

	const absolutePath = path.resolve(assetParentPath, pathToFile);
	// if (!absolutePath.startsWith(assetParentPath))
	// 	throw new Error(`Found path: '${absolutePath}' which is out of the scope of the assert directory: '${assetParentPath}'`);

	return absolutePath as AbsolutePath;
}