import {AbsolutePath, Logger, RelativePath, StringMap, TypeValidator} from '@nu-art/ts-common';
import {BaseUnit} from '../../units';
import {BAI_Config} from '../../../core/types';


export type BaseUnitConfig = {
	fullPath: AbsolutePath;
	relativePath: RelativePath;
	label: string;
	key: string
	dependencies: StringMap,
};

export type UnitConfigJSON_Base = { type: string };

export abstract class UnitMapper_Base<
	T extends BaseUnit<any>,
	ConfigJSON extends UnitConfigJSON_Base = UnitConfigJSON_Base>
	extends Logger {

	protected validator: TypeValidator<ConfigJSON>;
	protected baiConfig!: BAI_Config;

	protected constructor(validator: TypeValidator<ConfigJSON>) {
		super();
		this.validator = validator;
	}

	setConfig(config: BAI_Config) {
		this.baiConfig = config;
	}

	public abstract resolveUnit(path: string, root: string): Promise<T | undefined>;
}


