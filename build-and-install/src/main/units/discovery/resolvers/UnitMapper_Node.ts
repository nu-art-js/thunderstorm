import {TS_PackageJSON} from '../types.js';
import {
	AbsolutePath,
	RelativePath,
	tsValidateBoolean,
	tsValidateOptionalAnyString,
	tsValidateResult,
	TypeValidator,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {BaseUnit} from '../../index.js';
import {FilesCache} from '../../../core/FilesCache.js';
import {BaseUnitConfig, UnitConfigJSON_Base, UnitMapper_Base} from './UnitMapper_Base.js';
import {FileSystemUtils} from '@nu-art/ts-common/utils/FileSystemUtils';
import {Unit_PackageJson} from '../../implementations/Unit_PackageJson.js';


export type UnitConfigJSON_Node = UnitConfigJSON_Base & {
	label: string
	customESLintConfig?: boolean
	customTSConfig?: boolean
	hasSelfHotReload?: boolean
};

export type UnitMapper_NodeContext<ConfigJSON extends UnitConfigJSON_Node = UnitConfigJSON_Node> = {
	path: string,
	root: string,
	packageJson: TS_PackageJSON<ConfigJSON>,
	baseConfig: BaseUnitConfig
	customESLintConfig: boolean
	customTSConfig: boolean
}

export abstract class UnitMapper_Node<
	T extends BaseUnit<any>,
	ConfigJSON extends UnitConfigJSON_Node = UnitConfigJSON_Node>
	extends UnitMapper_Base<T, ConfigJSON> {

	private static invalidPaths: string[] = [];
	static tsValidator_Node = {
		label: tsValidateOptionalAnyString,
		customESLintConfig: tsValidateBoolean(false),
		customTSConfig: tsValidateBoolean(false),
		hasSelfHotReload: tsValidateBoolean(false),
	};

	protected constructor(validator: TypeValidator<ConfigJSON>) {
		super(validator);
	}

	public async resolveUnit(path: string, root: string): Promise<T | undefined> {
		if (UnitMapper_Node.invalidPaths.includes(path))
			return;

		const pathToFile = `${path}/__package.json`;
		if (!await FileSystemUtils.file.exists(pathToFile))
			return;

		let packageJson: TS_PackageJSON<ConfigJSON>;
		try {
			packageJson = await FilesCache.load.json<TS_PackageJSON<ConfigJSON>>(pathToFile);

			if (!packageJson)
				return;

			if (!packageJson.unitConfig) {
				this.logWarning(`Found a package.json without unitConfig at: ${pathToFile}`);
				UnitMapper_Node.invalidPaths.push(path);
				return;
			}


			if (tsValidateResult(packageJson.unitConfig.type, this.validator.type))
				return; // not the expected type for this mapper

			packageJson = Unit_PackageJson.transformDependencyPlaceholders(packageJson);
			const configValidationResult = tsValidateResult(packageJson.unitConfig, this.validator as ValidatorTypeResolver<ConfigJSON>, undefined, false);

			const dependencies = packageJson.dependencies;
			Object.freeze(packageJson);

			const baseConfig: BaseUnitConfig = {
				key: packageJson.name,
				fullPath: path as AbsolutePath,
				relativePath: path.replace(root, '.') as RelativePath,
				label: packageJson.unitConfig.label ?? packageJson.name,
				dependencies: {...dependencies, ...packageJson.devDependencies},
			};

			const customESLintConfig = packageJson.unitConfig.customESLintConfig ?? false;
			const customTSConfig = packageJson.unitConfig.customTSConfig ?? false;
			const unit = await this.resolveNodeUnit({path, root, packageJson, baseConfig, customESLintConfig, customTSConfig});
			if (unit instanceof Unit_PackageJson)
				unit.configValidationResult = configValidationResult;

			return unit;
		} catch (e: any) {
			this.logError(`Failed to load package.json at: ${pathToFile}`, e);
			throw e;
		}
	}

	protected abstract resolveNodeUnit(nodeContext: UnitMapper_NodeContext<ConfigJSON>): Promise<T | undefined> ;
}

