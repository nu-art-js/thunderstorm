import {TS_PackageJSON} from '../types';
import {
	AbsolutePath,
	RelativePath,
	tsValidate,
	tsValidateAnyString,
	tsValidateBoolean,
	tsValidateResult,
	TypeValidator,
	ValidatorTypeResolver
} from '@nu-art/ts-common';
import {BaseUnit} from '../../units';
import {FilesCache} from '../../core/FilesCache';
import {BaseUnitConfig, UnitConfigJSON_Base, UnitMapper_Base} from './UnitMapper_Base';
import {FileSystemUtils} from '../../core/FileSystemUtils';


export type UnitConfigJSON_Node = UnitConfigJSON_Base & {
	label: string
	customESLintConfig?: boolean
	customTSConfig?: boolean
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

	static tsValidator_Node = {
		label: tsValidateAnyString,
		customESLintConfig: tsValidateBoolean(false),
		customTSConfig: tsValidateBoolean(false),
	};

	protected constructor(validator: TypeValidator<ConfigJSON>) {
		super(validator);
	}

	public async resolveUnit(path: string, root: string): Promise<T | undefined> {
		const pathToFile = `${path}/__package.json`;
		if (!await FileSystemUtils.file.exists(pathToFile))
			return;

		const packageJson = await FilesCache.load.json<TS_PackageJSON<ConfigJSON>>(pathToFile);
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

		const customESLintConfig = packageJson.unitConfig.customESLintConfig ?? false;
		const customTSConfig = packageJson.unitConfig.customTSConfig ?? false;
		return this.resolveNodeUnit({path, root, packageJson, baseConfig, customESLintConfig, customTSConfig});
	}

	protected abstract resolveNodeUnit(nodeContext: UnitMapper_NodeContext<ConfigJSON>): Promise<T | undefined> ;
}

