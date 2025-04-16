import {promises as fs} from 'fs';
import {TS_PackageJSON} from '../types';
import {AbsolutePath, RelativePath, tsValidate, tsValidateAnyString, tsValidateResult, TypedMap, TypeValidator, ValidatorTypeResolver} from '@nu-art/ts-common';
import {BaseUnit} from '../../../unit/core';


export type BaseUnitConfig = {
	fullPath: AbsolutePath;
	relativePath: RelativePath;
	label: string;
	key: string
};

export type UnitConfigJSON_Base = { type: string };

export abstract class UnitMapper<
	T extends BaseUnit<any>,
	ConfigJSON extends UnitConfigJSON_Base = UnitConfigJSON_Base> {

	protected validator: TypeValidator<ConfigJSON>;

	protected constructor(validator: TypeValidator<ConfigJSON>) {
		this.validator = validator;
	}

	abstract resolveUnit(path: string, root: string): Promise<T | undefined>;
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

	private static loadedPackageJson: TypedMap<TS_PackageJSON> = {};

	static tsValidator_Node = {
		label: tsValidateAnyString,
	};

	protected constructor(validator: TypeValidator<ConfigJSON>) {
		super(validator);
	}

	private readPackageJson = async (path: string): Promise<string | undefined> => {
		try {
			const packageJsonPath = `${path}/__package.json`;
			const fileStat = await fs.stat(packageJsonPath);
			if (fileStat.isFile())
				return await fs.readFile(packageJsonPath, 'utf-8');

			return undefined; // package.json is not a file
		} catch (error: any) {
			if (error.code === 'ENOENT')
				return undefined; // package.json does not exist

			throw error; // rethrow other errors
		}
	};


	public async resolveUnit(path: string, root: string): Promise<T | undefined> {
		let packageJson: TS_PackageJSON<ConfigJSON> = UnitMapper_Node.loadedPackageJson[path];
		if (!packageJson) {
			const packageJsonAsString = await this.readPackageJson(path);
			if (!packageJsonAsString)
				return;

			UnitMapper_Node.loadedPackageJson[path] = packageJson = Object.freeze(JSON.parse(packageJsonAsString));
		}

		if (tsValidateResult(packageJson.unitConfig.type, this.validator.type))
			return; // not the expected type for this mapper

		tsValidate(packageJson.unitConfig, this.validator as ValidatorTypeResolver<ConfigJSON>);
		const baseConfig: BaseUnitConfig = {
			key: packageJson.name,
			fullPath: path as AbsolutePath,
			relativePath: path.replace(root, '.') as RelativePath,
			label: packageJson.unitConfig.label,
		};
		return this.resolveNodeUnit({path, root, packageJson, baseConfig});
	}

	protected abstract resolveNodeUnit(nodeContext: UnitMapper_NodeContext<ConfigJSON>): Promise<T | undefined> ;
}

