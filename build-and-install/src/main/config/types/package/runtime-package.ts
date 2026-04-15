import {PackageJson} from '../configs/package-json.js';
import {Package, Package_Sourceless} from './package.js';


type WithPackageJson = {
	packageJsonTemplate: PackageJson
	packageJsonWorkspace?: PackageJson
	packageJsonOutput?: PackageJson
	packageJsonRuntime?: PackageJson
};

export type RuntimePackage = Required<Package> & WithPackageJson;
export type RuntimePackage_WithOutput = Required<Exclude<Package, Package_Sourceless>> & WithPackageJson