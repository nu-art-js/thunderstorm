import {StringMap, TypedMap} from '@nu-art/ts-common';
import {Package, RuntimePackage} from './package';

export type ProjectConfig = {
	params: StringMap;
	packages: Package[]
}

export type RuntimeProjectConfig = {
	packages: Package[];
	params: StringMap;
	packagesDependency: RuntimePackage[][];
	packageMap?: { [packageName: string]: RuntimePackage };
};

export type Constructor<T> = new (...args: any) => T

export type BAI_Config = {
	pathToProject: string
	dependenciesVersions?: TypedMap<string>
	files?: {
		firebase?: {
			databaseRules?: string
			storageRules?: string
			firestoreIndexesRules?: string
			firestoreRules?: string
		}
		typescript?: {
			tsConfig?: string
		}
	}
}