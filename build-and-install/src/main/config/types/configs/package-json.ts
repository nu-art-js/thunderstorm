import {StringMap} from '@nu-art/ts-common';
import {JSONVersion} from '../core.js';

export type PackageJson = JSONVersion & {
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
	'_moduleAliases'?: StringMap
}