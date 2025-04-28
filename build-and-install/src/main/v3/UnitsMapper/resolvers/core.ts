import {TS_PackageJSON} from '../types';
import {
	AbsolutePath,
	RelativePath,
	StringMap,
	tsValidate,
	tsValidateAnyString,
	tsValidateResult,
	TypeValidator,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {BaseUnit} from '../../units';
import {FilesCache} from '../../core/FilesCache';
import {BAI_Config} from '../../../core/types';


export type BaseUnitConfig = {
	fullPath: AbsolutePath;
	relativePath: RelativePath;
	label: string;
	key: string
	dependencies: StringMap,
};

export type UnitConfigJSON_Base = { type: string };

export abstract class UnitMapper<
	T extends BaseUnit<any>,
	ConfigJSON extends UnitConfigJSON_Base = UnitConfigJSON_Base> {

	protected validator: TypeValidator<ConfigJSON>;
	protected baiConfig!: BAI_Config;

	protected constructor(validator: TypeValidator<ConfigJSON>) {
		this.validator = validator;
	}

	setConfig(config: BAI_Config) {
		this.baiConfig = config;
	}

	public abstract resolveUnit(path: string, root: string): Promise<T | undefined>;
}

export type UnitConfigJSON_Node = UnitConfigJSON_Base & { label: string };
export type UnitMapper_NodeContext<ConfigJSON extends UnitConfigJSON_Node = UnitConfigJSON_Node> = {
	path: string,
	root: string,
	packageJson: TS_PackageJSON<ConfigJSON>,
	baseConfig: BaseUnitConfig
}

export abstract class UnitMapper_Node<
	T extends BaseUnit<any>,
	ConfigJSON extends UnitConfigJSON_Node = UnitConfigJSON_Node>
	extends UnitMapper<T, ConfigJSON> {

	static tsValidator_Node = {
		label: tsValidateAnyString,
	};

	protected constructor(validator: TypeValidator<ConfigJSON>) {
		super(validator);
	}

	public async resolveUnit(path: string, root: string): Promise<T | undefined> {
		const packageJson = await FilesCache.load.json<TS_PackageJSON<ConfigJSON>>(`${path}/__package.json`);
		if (!packageJson)
			return;

		if (tsValidateResult(packageJson.unitConfig.type, this.validator.type))
			return; // not the expected type for this mapper

		tsValidate(packageJson.unitConfig, this.validator as ValidatorTypeResolver<ConfigJSON>);
		const baseConfig: BaseUnitConfig = {
			key: packageJson.name,
			fullPath: path as AbsolutePath,
			relativePath: path.replace(root, '.') as RelativePath,
			label: packageJson.unitConfig.label,
			dependencies: {...packageJson.dependencies, ...packageJson.devDependencies},
		};

		return this.resolveNodeUnit({path, root, packageJson, baseConfig});
	}

	protected abstract resolveNodeUnit(nodeContext: UnitMapper_NodeContext<ConfigJSON>): Promise<T | undefined> ;
}

