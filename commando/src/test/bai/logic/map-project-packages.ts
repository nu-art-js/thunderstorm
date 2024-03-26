import {BAI_Packages, PackageDetails, PackageJson, ProjectPackages} from '../core/types';
import {CONST_PackageJSONTemplate} from '../core/consts';
import {existsSync} from 'fs';
import {arrayToMap, convertToFullPath} from '../core/tools';


export function mapProjectPackages(pathToPackages: string): ProjectPackages {
	const loadedPackages = require(pathToPackages) as BAI_Packages;
	const packages = loadedPackages.packages
		.map(_package => {
			const absolutePathToPackageRoot = convertToFullPath(_package.path);
			let absolutePathToOutputFolder: string;
			if (_package.output)
				absolutePathToOutputFolder = convertToFullPath(_package.output, absolutePathToPackageRoot);
			const absolutePathToNodeModulesFolder = convertToFullPath(_package.nodeModulesFolder ?? 'node_modules', absolutePathToPackageRoot);
			return ({
				..._package,
				path: absolutePathToPackageRoot,
				output: absolutePathToOutputFolder,
				nodeModulesFolder: absolutePathToNodeModulesFolder,
			});
		})
		.map(_package => {
			if (!existsSync(_package.path))
				throw new Error(`package: ${_package.path} is missing the ${CONST_PackageJSONTemplate} files`);

			const packageJson = require(`${_package.path}/${CONST_PackageJSONTemplate}`) as PackageJson;
			return {
				..._package,
				packageJsonTemplate: packageJson,
			};
		});

	const packagesDependency = groupPackagesByDependencyLevel(packages);
	return {
		params: loadedPackages.params,
		packagesDependency,
		packages,
		packageMap: arrayToMap(packages, p => p.packageJsonTemplate.name)
	};
}

function groupPackagesByDependencyLevel(packages: PackageDetails[]): PackageDetails[][] {
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
	const groupedPackages = new Map<number, PackageDetails[]>();
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
