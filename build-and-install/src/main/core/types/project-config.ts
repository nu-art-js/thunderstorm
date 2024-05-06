import {StringMap} from '@nu-art/ts-common';
import { Package, RuntimePackage } from './package';

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
