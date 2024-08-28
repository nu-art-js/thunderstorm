import {StringMap} from '@thunder-storm/common';
import {JSONVersion} from '../core';

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
	'_moduleAliases'?: StringMap
}