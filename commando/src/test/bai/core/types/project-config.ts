import {StringMap} from './core';
import {BasePackage, RuntimePackage} from './package-details';

export type BAI_Packages = {
	params: StringMap;
	packages: BasePackage[]
}

export type ProjectConfig = {
	packages: BasePackage[];
	params: StringMap;
	packagesDependency?: RuntimePackage[][];
	packageMap?: { [packageName: string]: RuntimePackage };
};

export type Constructor<T> = new (...args: any) => T
