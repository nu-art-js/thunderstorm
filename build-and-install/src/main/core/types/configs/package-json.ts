import {StringMap} from '@nu-art/ts-common';
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
	'main'?: 'index.js' | string,
	'types'?: 'index.d.ts' | string,
	'scripts'?: StringMap,
	'dependencies'?: StringMap,
	'_moduleAliases'?: StringMap
}