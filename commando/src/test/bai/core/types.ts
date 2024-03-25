export type StringMap = { [s: string]: string };
export type TypedMap<ValueType> = { [s: string]: ValueType };

export type BAI_Packages = {
	params: StringMap;
	packages: BasePackageDetails[]
}
export type JSONVersion = {
	'version': string,

}
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

export type BasePackageDetails = {
	path: string;
	type: 'lib' | 'app';
	output: string,
	nodeModulesFolder?: string,
}

export type PackageDetails = Required<BasePackageDetails> & {
	packageJsonTemplate: PackageJson
	packageJson?: PackageJson
};

export type ProjectPackages = {
	params: StringMap;
	packagesDependency: PackageDetails[][];
	packages: PackageDetails[]
	packageMap: { [packageName: string]: PackageDetails }
};

export type Constructor<T> = new (...args: any) => T
