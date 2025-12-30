import {BaseUnit, ProjectUnit} from '../index.js';
import {promises as fs} from 'fs';
import {BadImplementationException, Logger, TypedMap} from '@nu-art/ts-common';
import {UnitMapper_Base} from './resolvers/UnitMapper_Base.js';
import {BaiParams} from '../../core/params.js';

/**
 * Recursively scans workspace and discovers units using resolution rules.
 * 
 * **Discovery Process**:
 * 1. Starts at project root path
 * 2. Applies resolution rules in order (first match wins)
 * 3. If unit found and not root, stops recursion (unit is a leaf)
 * 4. If unit is root, continues scanning subdirectories
 * 5. Skips `node_modules` and hidden directories (`.git`, `.vscode`, etc.)
 * 
 * **Resolution Rules**:
 * - Rules are added via `addRules()` (e.g., UnitMapper_NodeLib, UnitMapper_FirebaseFunction)
 * - Each rule checks if a path matches its criteria (package.json, firebase.json, etc.)
 * - Rules can be configured with runtime params
 * 
 * **Unit Types**:
 * - **Root Units**: Continue scanning subdirectories (e.g., monorepo root)
 * - **Leaf Units**: Stop recursion (e.g., individual packages)
 * 
 * **Filtering**: Automatically skips:
 * - `node_modules` directories
 * - Hidden directories (starting with `.`)
 * 
 * **Usage**: Called by `Workspace.scanUnits()` to discover all units in workspace.
 */
export class UnitsMapper
	extends Logger {

	private rules: UnitMapper_Base<BaseUnit<any>>[] = [];

	/**
	 * @param path - will always be a directory
	 * @param projectRoot - The path to the project root
	 * @param units - The project units derived from the file system
	 */
	async resolveUnits(path: string, projectRoot = path, units = [] as BaseUnit<any>[]) {
		if (path.endsWith('/node_modules') || path.match(/\/\.[\w -_]+$/))
			return units;

		let unit;
		for (const rule of this.rules) {
			unit = await rule.resolveUnit(path, projectRoot);
			if (!unit)
				continue;

			this.logDebug(`Found unit ${unit.config.key} at path ${path}`);
			units.push(unit);
			if (!unit.config.isRoot)
				return units;

			break;
		}

		this.logVerbose(`Iterating on path: ${path}`);
		if (!(await fs.stat(path)).isDirectory())
			throw new BadImplementationException(`Provided path '${path}' is not a directory`);

		// filter out all the folders in the provided path
		const paths = (await fs.readdir(path, {withFileTypes: true}))
			.filter(dirent => dirent.isDirectory())
			.map(dirent => `${path}/${dirent.name}`);

		for (const path of paths) {
			await this.resolveUnits(path, projectRoot, units);
		}

		return units;
	}

	/**
	 * Adds unit resolution rules.
	 * 
	 * Rules are tried in order (first match wins). Common rules:
	 * - `UnitMapper_NodeProject`: Root project unit
	 * - `UnitMapper_NodeLib`: TypeScript libraries
	 * - `UnitMapper_FirebaseHosting`: Firebase hosting apps
	 * - `UnitMapper_FirebaseFunction`: Firebase functions
	 * 
	 * @param rules - Unit mapper rules to add
	 * @returns This instance for chaining
	 */
	addRules<T extends BaseUnit<any>>(...rules: UnitMapper_Base<T>[]) {
		this.rules.push(...rules);
		return this;
	}

	/**
	 * Sets runtime params on all rules.
	 * 
	 * Rules can use runtime params to filter or configure resolution behavior.
	 * 
	 * @param runtimeParams - Runtime parameters
	 * @returns This instance for chaining
	 */
	setRuntimeParams(runtimeParams: BaiParams) {
		this.rules.forEach(rule => rule.setRuntimeParams(runtimeParams));
		return this;
	}

	/**
	 * Validates that all units have unique keys.
	 * 
	 * Throws `BadImplementationException` if duplicate keys found.
	 * 
	 * @param units - Units to validate
	 * @throws BadImplementationException if duplicate keys found
	 */
	assertUniqueKeys(units: ProjectUnit[]) {
		const keyToUnit: TypedMap<ProjectUnit> = {};

		for (const unit of units) {
			const config = unit.config;
			const existing = keyToUnit[config.key]?.config;
			if (existing)
				throw new BadImplementationException(`Duplicate unit key "${config.key}" found:\n- ${existing.relativePath}\n- ${config.relativePath}`);

			keyToUnit[config.key] = unit;
		}
	}
}