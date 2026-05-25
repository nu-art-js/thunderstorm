import {AbsolutePath, Logger, RelativePath, StringMap, TypeValidator} from '@nu-art/ts-common';
import {BaseUnit} from '../../base/BaseUnit.js';
import {BAI_Config} from '../../../config/types/project-config.js';
import {BaiParams} from '../../../core/params.js';


export type BaseUnitConfig = {
	fullPath: AbsolutePath;
	relativePath: RelativePath;
	label: string;
	key: string
	dependencies: StringMap,
};

export type UnitConfigJSON_Base = { type: string };

/**
 * Base class for unit mapper resolvers.
 *
 * **Purpose**: Each mapper resolver checks if a directory path matches its unit type
 * and creates the appropriate unit instance if it matches.
 *
 * **Resolution Process**:
 * 1. `resolveUnit()` is called for each directory during workspace scan
 * 2. Mapper checks if path matches its criteria (package.json type, file presence, etc.)
 * 3. If match, creates and returns unit instance
 * 4. If no match, returns undefined (next mapper tries)
 *
 * **Configuration**:
 * - `validator`: Validates unit config JSON (e.g., package.json.unitConfig.type)
 * - `baiConfig`: BAI configuration (set by UnitsMapper)
 * - `runtimeParams`: Runtime parameters (set by UnitsMapper)
 *
 * **Usage**: Extended by specific mappers (UnitMapper_NodeLib, UnitMapper_FirebaseFunction, etc.)
 * to implement unit-specific discovery logic.
 */
export abstract class UnitMapper_Base<
	T extends BaseUnit<any>,
	ConfigJSON extends UnitConfigJSON_Base = UnitConfigJSON_Base>
	extends Logger {

	protected validator: TypeValidator<ConfigJSON>;
	protected baiConfig!: BAI_Config;
	protected runtimeParams!: BaiParams;

	protected constructor(validator: TypeValidator<ConfigJSON>) {
		super();
		this.validator = validator;
	}

	/**
	 * Sets runtime parameters for the mapper.
	 *
	 * Called by UnitsMapper to provide runtime context.
	 */
	setRuntimeParams(runtimeParams: BaiParams) {
		this.runtimeParams = runtimeParams;
	}

	/**
	 * Sets BAI configuration for the mapper.
	 *
	 * Called by UnitsMapper to provide configuration context.
	 */
	setConfig(config: BAI_Config) {
		this.baiConfig = config;
	}

	/**
	 * Resolves a unit from a directory path.
	 *
	 * **Behavior**:
	 * - Checks if path matches this mapper's criteria
	 * - If match, creates and returns unit instance
	 * - If no match, returns undefined
	 *
	 * @param path - Directory path to check
	 * @param root - Project root path
	 * @returns Promise resolving to unit instance or undefined
	 */
	public abstract resolveUnit(path: string, root: string): Promise<T | undefined>;
}


