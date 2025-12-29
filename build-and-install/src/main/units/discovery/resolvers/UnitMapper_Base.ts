import {AbsolutePath, Logger, RelativePath, StringMap, TypeValidator} from '@nu-art/ts-common';
import {BaseUnit} from '../../index.js';
import {BAI_Config} from '../../../config/types/index.js';
import {BaiParams} from '../../../core/params.js';


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
	protected runtimeParams!: BaiParams;

	protected constructor(validator: TypeValidator<ConfigJSON>) {
		super();
		this.validator = validator;
	}

	setRuntimeParams(runtimeParams: BaiParams) {
		this.runtimeParams = runtimeParams;
	}

	setConfig(config: BAI_Config) {
		this.baiConfig = config;
	}

	public abstract resolveUnit(path: string, root: string): Promise<T | undefined>;
}


