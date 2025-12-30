import {_keys, arrayToMap, Constructor, flatArray, Logger, TypedMap} from '@nu-art/ts-common';
import {BaiParams} from '../core/params.js';
import {UnitsMapper} from '../units/discovery/UnitsMapper.js';
import {UnitDependentNode, UnitsDependencyMapper} from '../dependencies/UnitsDependencyMapper.js';
import {BaseUnit, ProjectUnit, Unit_NodeProject} from '../units/index.js';

/**
 * Central workspace manager for all units in the build system.
 * 
 * **Unit Categories**:
 * - **Scanned Units**: All units discovered from workspace file system scan
 * - **Active Units**: Units selected for execution (compile/test/lint) based on runtime params
 * - **Project Units**: Active units + their transitive dependencies (needed for prepare/install)
 * 
 * **Key Responsibilities**:
 * - Unit discovery and storage
 * - Dependency resolution and tree building
 * - Unit lookup by key/type
 * - Active/project unit derivation based on runtime params
 * 
 * **Dependency Management**:
 * - Uses `UnitsDependencyMapper` to resolve transitive dependencies
 * - Builds dependency tree in layers (dependencies first, dependents last)
 * - Filters dependencies to only include units that exist in workspace
 * 
 * **Runtime Params Impact**:
 * - `--use-package`: Filters active units to match regex patterns
 * - `--build-tree`: Includes transitive dependencies in active units
 * - Without flags: All units are active and project units
 */
export class Workspace
	extends Logger {

	private _scannedUnits: BaseUnit<any>[] = [];
	private _projectUnits: ProjectUnit[] = [];
	private _activeUnits: string[] = [];
	private _projectUnitKeys: string[] = [];
	private unitsDependencyMapper?: UnitsDependencyMapper;
	private unitKeyToUnitMap: TypedMap<BaseUnit<any>> = {};

	/**
	 * All units discovered from the workspace scan
	 */
	get scannedUnits(): ReadonlyArray<BaseUnit<any>> {
		return this._scannedUnits;
	}

	/**
	 * All project units (subset of scanned units that are ProjectUnits)
	 */
	get projectUnits(): ReadonlyArray<ProjectUnit> {
		return this._projectUnits;
	}

	/**
	 * Keys of units selected for execution
	 */
	get activeUnits(): ReadonlyArray<string> {
		return this._activeUnits;
	}

	/**
	 * Keys of project units (active units + their transitive dependencies)
	 */
	get projectUnitKeys(): ReadonlyArray<string> {
		return this._projectUnitKeys;
	}

	/**
	 * Scan units from the workspace using the provided UnitsMapper
	 */
	async scanUnits(path: string, unitsMapper: UnitsMapper): Promise<void> {
		this.logDebug(`Resolving units from: ${path}`);
		this._scannedUnits = await unitsMapper.resolveUnits(path);
		Object.freeze(this._scannedUnits);

		this.unitKeyToUnitMap = arrayToMap(this._scannedUnits, unit => unit.config.key);

		this._projectUnits = this._scannedUnits.filter(unit => unit.isInstanceOf(ProjectUnit)) as ProjectUnit[];
		Object.freeze(this._projectUnits);
	}

	/**
	 * Add additional project units (e.g., from applicative configuration)
	 */
	addProjectUnits(projectUnits: ProjectUnit[]): void {
		// Check for duplicates
		const existingKeys = new Set(this._projectUnits.map(u => u.config.key));
		const newUnits = projectUnits.filter(unit => !existingKeys.has(unit.config.key));
		
		if (newUnits.length > 0) {
			// Unfreeze, add, then refreeze
			const current = [...this._projectUnits, ...newUnits];
			this._projectUnits = current;
			Object.freeze(this._projectUnits);
			
			// Update lookup map
			for (const unit of newUnits) {
				this.unitKeyToUnitMap[unit.config.key] = unit;
			}
		}
	}

	/**
	 * Initialize the dependency mapper with project units
	 */
	initializeDependencyMapper(globalOutputFolder: string): void {
		const unitsDependencies: UnitDependentNode[] = this._projectUnits.map(unit => ({
			key: unit.config.key,
			dependsOn: _keys(unit.config.dependencies).filter(key => !!this.unitKeyToUnitMap[key]) as string[]
		}));

		this.unitsDependencyMapper = new UnitsDependencyMapper(unitsDependencies, globalOutputFolder);
	}

	/**
	 * Derive active and project units based on runtime parameters
	 * This must be called after initializeDependencyMapper()
	 */
	deriveActiveAndProjectUnits(runtimeParams: BaiParams): { activeUnits: string[], projectUnits: string[] } {
		if (!this.unitsDependencyMapper) {
			throw new Error('Dependency mapper must be initialized before deriving units. Call initializeDependencyMapper() first.');
		}

		const unitKeySet = new Set<string>();
		const allUnits: BaseUnit[] = [];

		for (const unit of flatArray(this._scannedUnits)) {
			if (unitKeySet.has(unit.config.key))
				throw new Error(`Multiple units with same key: ${unit.config.key}`);
			unitKeySet.add(unit.config.key);
			allUnits.push(unit);
		}

		let activeUnits: string[] = [];
		let projectUnits: string[] = [];

		// 1. Handle usePackage: "Work on these units only" (Option A)
		//    - Matched units → active (compile/test/lint these)
		//    - Matched + transitive → project (prepare dependencies, but don't compile them)
		//    - If buildTree flag is set, transitive dependencies also become active
		const usePackageKeys = runtimeParams.usePackage;
		if (usePackageKeys?.length) {
			const regexMatchers = usePackageKeys.map(filter => new RegExp(`.*?${filter}.*?`, 'i'));
			const matched = allUnits.filter(unit => regexMatchers.some(matcher => matcher.test(unit.config.key))).map(unit => unit.config.key);
			const transitive = this.unitsDependencyMapper.getTransitiveDependencies(matched);
			
			activeUnits.push(...matched);
			projectUnits.push(...matched, ...transitive);
			
			// If buildTree flag is set, make transitive dependencies active too
			if (runtimeParams.buildTree) {
				activeUnits.push(...transitive);
			}
		} else {

			const allKeys = allUnits.map(unit => unit.config.key);
			activeUnits = allKeys;
			projectUnits = allKeys;
		}

		this._activeUnits = [...new Set(activeUnits)];
		this._projectUnitKeys = [...new Set(projectUnits)];

		this.logDebug(`Active units: ${this._activeUnits.join(', ')}`);
		this.logDebug(`Project units: ${this._projectUnitKeys.join(', ')}`);

		return {
			activeUnits: this._activeUnits,
			projectUnits: this._projectUnitKeys
		};
	}

	/**
	 * Get a unit by its key
	 */
	getUnitByKey<T extends BaseUnit>(key: string): T | undefined {
		return this.unitKeyToUnitMap[key] as T | undefined;
	}

	/**
	 * Get multiple units by their keys, optionally filtered by class type
	 */
	getUnitsByKeys<T extends BaseUnit>(keys: string[], className?: Constructor<T>): T[] {
		const units = keys.map(key => this.unitKeyToUnitMap[key]).filter(Boolean) as BaseUnit[];
		
		if (className) {
			return units.filter(unit => unit.isInstanceOf(className)) as T[];
		}
		
		return units as T[];
	}

	/**
	 * Get the root NodeProject unit
	 */
	getNodeProjectUnit(): Unit_NodeProject | undefined {
		return this._projectUnits.find(unit => unit.isInstanceOf(Unit_NodeProject)) as Unit_NodeProject | undefined;
	}

	/**
	 * Build dependency tree for the given project unit keys
	 * Returns layers of units ordered from bottom (no dependencies) to top
	 */
	async buildDependencyTree(projectUnitKeys: string[]): Promise<ProjectUnit[][]> {
		if (!this.unitsDependencyMapper) {
			throw new Error('Dependency mapper must be initialized. Call initializeDependencyMapper() first.');
		}

		const unitKeyLayers = await this.unitsDependencyMapper.buildDependencyTree(projectUnitKeys);
		return unitKeyLayers.map(keys => keys.map(key => this.getUnitByKey<ProjectUnit>(key)!).filter(Boolean));
	}

	/**
	 * Get transitive dependencies for given unit keys
	 */
	getTransitiveDependencies(keys: string[]): string[] {
		if (!this.unitsDependencyMapper) {
			throw new Error('Dependency mapper must be initialized. Call initializeDependencyMapper() first.');
		}
		return this.unitsDependencyMapper.getTransitiveDependencies(keys);
	}

	/**
	 * Get the dependency mapper (for runtime context)
	 */
	getDependencyMapper(): UnitsDependencyMapper {
		if (!this.unitsDependencyMapper) {
			throw new Error('Dependency mapper must be initialized. Call initializeDependencyMapper() first.');
		}
		return this.unitsDependencyMapper;
	}
}
