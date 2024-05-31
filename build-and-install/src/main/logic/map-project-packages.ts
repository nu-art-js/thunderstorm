import {CONST_PackageJSONTemplate} from '../core/consts';
import {existsSync, readFileSync} from 'fs';
import {
	Package,
	Package_FirebaseFunctionsApp,
	Package_FirebaseHostingApp,
	Package_InfraLib,
	Package_ProjectLib,
	Package_Sourceless,
	PackageJson,
	PackageType_FirebaseFunctionsApp,
	PackageType_FirebaseHostingApp,
	PackageType_InfraLib,
	PackageType_ProjectLib,
	PackageType_Python,
	PackageType_Sourceless,
	ProjectConfig,
	RuntimePackage,
	RuntimeProjectConfig
} from '../core/types';
import {__stringify, arrayToMap, ImplementationMissingException} from '@nu-art/ts-common';
import {convertToFullPath} from '@nu-art/commando/core/tools';


function getRuntimePackageBaseDetails_Sourceless(basePackage: Package_Sourceless): Required<Package_Sourceless> {
	return {
		name: basePackage.name,
		path: convertToFullPath(basePackage.path),
		type: basePackage.type,
	};
}

function getRuntimePackageBaseDetails_Lib(basePackage: Package_InfraLib | Package_ProjectLib): Required<Package_InfraLib | Package_ProjectLib> {
	const packageRoot = convertToFullPath(basePackage.path);
	return {
		name: basePackage.name,
		path: packageRoot,
		type: basePackage.type,
		output: convertToFullPath(basePackage.output, packageRoot),
		customTsConfig: basePackage.customTsConfig ?? false,
		sources: basePackage.sources ?? []
	};
}

function getRuntimePackageBaseDetails_Firebase(basePackage: Package_FirebaseFunctionsApp | Package_FirebaseHostingApp): Required<Package_FirebaseFunctionsApp | Package_FirebaseHostingApp> {
	const packageRoot = convertToFullPath(basePackage.path);
	return {
		name: basePackage.name,
		path: packageRoot,
		type: basePackage.type,
		output: convertToFullPath(basePackage.output, packageRoot),
		customTsConfig: basePackage.customTsConfig ?? false,
		sources: basePackage.sources ?? [],
		envConfig: basePackage.envConfig ?? {},
	};
}

function getRuntimePackageBaseDetails(basePackage: Package): Required<Package> {
	switch (basePackage.type) {
		case PackageType_Sourceless:
			return getRuntimePackageBaseDetails_Sourceless(basePackage);
		case PackageType_ProjectLib:
		case PackageType_InfraLib:
			return getRuntimePackageBaseDetails_Lib(basePackage);

		case PackageType_FirebaseFunctionsApp:
		case PackageType_FirebaseHostingApp:
			return getRuntimePackageBaseDetails_Firebase(basePackage);

		default:
			throw new ImplementationMissingException(`Missin runtime package converter for package of type ${basePackage.type}`);
	}
}

export function convertPackageJSONTemplateToPackJSON_Value(template: PackageJson, value: (value: string, key?: string) => string): PackageJson {
	let workspacePackageJsonAsString = __stringify(template, true);
	let match = null;
	do {
		match = workspacePackageJsonAsString.match(/"(.*?)": ?"\$([A-Z_]+?)"/);
		if (match?.[0])
			workspacePackageJsonAsString = workspacePackageJsonAsString.replace(new RegExp(`\\$${match[2]}`), value(match[2], match[1]));
	} while (match);

	const packageJson = JSON.parse(workspacePackageJsonAsString) as PackageJson;

	return packageJson;
}

export function convertToRuntimePackage(basePackage: Package, project: ProjectConfig): RuntimePackage {
	const runtimePackage = getRuntimePackageBaseDetails(basePackage);

	//Get template package json
	if (!existsSync(runtimePackage.path))
		throw new Error(`package: ${runtimePackage.path} is missing the ${CONST_PackageJSONTemplate} files`);
	const pjTemplate = JSON.parse(readFileSync(`${runtimePackage.path}/${CONST_PackageJSONTemplate}`, 'utf-8')) as PackageJson;

	return {
		...runtimePackage,
		packageJsonTemplate: pjTemplate,
	};
}

export function mapProjectPackages(projectConfig: ProjectConfig): RuntimeProjectConfig {
	const packages = projectConfig.packages.filter(pkg=>pkg.type !== PackageType_Python).map(basePackage => convertToRuntimePackage(basePackage, projectConfig));
	const pythonPackages = projectConfig.packages.filter(pkg => pkg.type === PackageType_Python);

	const packagesDependency = groupPackagesByDependencyLevel(packages);
	packagesDependency.push(pythonPackages as RuntimePackage[])

	return {
		...projectConfig,
		packages: [...packages, ...pythonPackages],
		packagesDependency,
		packageMap: arrayToMap(packages, p => p.packageJsonTemplate.name)
	};
}

function groupPackagesByDependencyLevel(packages: RuntimePackage[]): RuntimePackage[][] {
	const packageNames = packages.map(p => p.packageJsonTemplate.name);
	const packagesConfigWithDependencies = packages
		.map(_package => {
			const packageDependencies = packageNames.filter(name => _package.packageJsonTemplate.dependencies?.[name]);
			return {
				packageDependencies,
				..._package,
			};
		});

	// Map to keep track of each package's level
	const levels = new Map<string, number>();

	// Function to recursively find the level of a package
	function findLevel(pkgName: string, visited: Set<string> = new Set()): number {
		if (visited.has(pkgName)) {
			throw new Error(`Circular dependency detected for package ${pkgName}`);
		}
		visited.add(pkgName);

		const pkg = packagesConfigWithDependencies.find(p => p.packageJsonTemplate.name === pkgName);
		if (!pkg) throw new Error(`Package ${pkgName} not found`);

		// A package with no dependencies is at level 0
		if (pkg.packageDependencies.length === 0) return 0;

		// Find the maximum level among dependencies
		const maxDependencyLevel = Math.max(...pkg.packageDependencies.map(dep => findLevel(dep, new Set(visited))));
		return 1 + maxDependencyLevel;
	}

	// Determine the level of each package
	packagesConfigWithDependencies.forEach(pkg => {
		const level = findLevel(pkg.packageJsonTemplate.name);
		levels.set(pkg.packageJsonTemplate.name, level);
	});

	// Group packages by their level
	const groupedPackages = new Map<number, RuntimePackage[]>();
	levels.forEach((level, pkgName) => {
		const pkg = packages.find(p => p.packageJsonTemplate.name === pkgName);
		if (pkg) {
			if (!groupedPackages.has(level)) {
				groupedPackages.set(level, []);
			}
			groupedPackages.get(level)!.push(pkg);
		}
	});

	// Sort and convert the grouped packages into a sorted array of arrays
	const sortedLevels = Array.from(groupedPackages.keys()).sort((a, b) => a - b);
	return sortedLevels.map(level => groupedPackages.get(level)!);
}
