import * as path from 'path';
import {TypedMap} from './types';


const CONST_PrefixRelativeToPWD = './';

export function exists<T = any>(item: T | undefined | null): item is T {
	return item !== undefined && item !== null;
}

export function filterInstances<T>(array?: (T | undefined | null | void)[]): T[] {
	return (array?.filter(item => exists(item)) || []) as T[];
}

export function convertToFullPath(pathToFile: string, assetParentPath = process.cwd()) {
	if (!pathToFile)
		throw new Error('Path not provided');

	if (pathToFile === '')
		throw new Error('Empty path not allowed');

	while (pathToFile.startsWith('/'))
		pathToFile = pathToFile.substring(1);

	const absolutePath = path.resolve(assetParentPath, pathToFile);
	if (!absolutePath.startsWith(assetParentPath))
		throw new Error(`Found path: '${absolutePath}' which is out of the scope of the assert directory: '${assetParentPath}'`);

	return absolutePath;
}

export function _keys<T extends { [k: string]: any }, K extends keyof T>(instance: T): K[] {
	return Object.keys(instance) as K[];
}

export function arrayToMap<T>(array: T[] | Readonly<T[]>, getKey: (item: T, index: number, map: {
	[k: string]: T
}) => string | number, map: {
	[k: string]: T
} = {}): { [k: string]: T } {
	return reduceToMap<T, T>(array, getKey, item => item, map);
}

type KeyResolver<Input, Output = Input> = (item: Input, index: number, map: {
	[k: string]: Output
}) => string | number;

type Mapper<Input, Output = Input> = (item: Input, index: number, map: { [k: string]: Output }) => Output;

/**
 * turns array into object that is similar to hashmap
 *
 */
export function reduceToMap<Input, Output = Input>(array: (Input[] | Readonly<Input[]>), keyResolver: KeyResolver<Input, Output>, mapper: Mapper<Input, Output>, map: TypedMap<Output> = {}): TypedMap<Output> {
	return (array as (Input[])).reduce((toRet, element, index) => {
		toRet[keyResolver(element, index, toRet)] = mapper(element, index, toRet);
		return toRet;
	}, map);
}

export function removeAnsiCodes(text: string) {
	// This regular expression matches the escape codes and removes them
	return text.replace(/\x1B\[\d+;?\d*m/g, '');
}

const defaultMapper: <T>(item: T) => any = (item) => item;

export function filterDuplicates<T>(source: T[], mapper: (item: T) => any = defaultMapper): T[] {
	if (defaultMapper === mapper)
		return Array.from(new Set(source));

	const uniqueKeys = new Set(source.map(mapper));
	return source.filter(item => uniqueKeys.delete(mapper(item)));
}
