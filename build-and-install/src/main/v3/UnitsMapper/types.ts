import {StringMap, TS_Object} from '@nu-art/ts-common';

export type TS_UnitConfig = TS_Object & {
	type: string,
	key: string,
	label: string,
};

export type TS_PackageJSON<T = any> = {
	'name': string,
	'description': string,
	'publishConfig'?: {
		'directory': string,
		'linkDirectory': boolean
	},
	'license'?: 'Apache-2.0' | string,
	'author'?: string,
	'main': string,
	'types': string,
	'scripts'?: StringMap,
	'dependencies'?: StringMap,
	'devDependencies'?: StringMap,
	'_moduleAliases'?: StringMap,
	unitConfig: T
}
