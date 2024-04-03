import {JSONVersion, StringMap} from './core';
import {FirebaseRC} from './firebaserc';
import {FirebaseJSON} from './firebasejson';


export const PackageType_InfraLib = 'infra-lib' as const;
export const PackageType_ProjectLib = 'project-lib' as const;
export const PackageType_FirebaseHostingApp = 'firebase-hosting-app' as const;
export const PackageType_FirebaseFunctionsApp = 'firebase-functions-app' as const;
export const PackageType_Sourceless = 'sourceless' as const;
export const PackageTypes = [PackageType_InfraLib, PackageType_ProjectLib, PackageType_FirebaseHostingApp, PackageType_FirebaseFunctionsApp, PackageType_Sourceless] as const;
export const PackageTypesWithOutput = [PackageType_InfraLib, PackageType_ProjectLib, PackageType_FirebaseHostingApp, PackageType_FirebaseFunctionsApp];
export type PackageType = typeof PackageTypes[number];

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

export type Package_Sourceless = {
	type: typeof PackageType_Sourceless;
	path: string;
};

export type Package_FirebaseHostingApp = {
	type: typeof PackageType_FirebaseHostingApp;
	path: string;
	output: string;
	customTsConfig?: boolean;
	sources?: string[];
	config?: {
		rc?: { local: string } & { [env: string]: FirebaseRC };
		json?: { [env: string]: FirebaseJSON };
		projectId?: string;
	};
};

export type Package_FirebaseFunctionsApp = {
	type: typeof PackageType_FirebaseFunctionsApp;
	path: string;
	output: string;
	customTsConfig?: boolean;
	sources?: string[];
	config?: {
		rc?: { [env: string]: FirebaseRC };
		json?: { [env: string]: FirebaseJSON };
		projectId?: string;
	};
};

export type Package_InfraLib = {
	type: typeof PackageType_InfraLib;
	path: string;
	output: string;
	customTsConfig?: boolean;
	sources?: string[];
}

export type Package_ProjectLib = {
	type: typeof PackageType_ProjectLib;
	path: string;
	output: string;
	customTsConfig?: boolean;
	sources?: string[];
}

export type BasePackage =
	Package_Sourceless
	| Package_FirebaseHostingApp
	| Package_FirebaseFunctionsApp
	| Package_InfraLib
	| Package_ProjectLib

export type RuntimePackage = Required<BasePackage> & {
	packageJsonTemplate: PackageJson
	packageJson?: PackageJson
};

export type RuntimePackage_WithOutput = Required<Exclude<BasePackage, Package_Sourceless>> & {
	packageJsonTemplate: PackageJson
	packageJson?: PackageJson
}