import {StringMap} from '@nu-art/ts-common';
import {BaseUnit, BaseUnit_Config} from './BaseUnit';

export type ProjectDependency = {
	key: string;
	version: string;
}

export type Config_ProjectUnit = BaseUnit_Config & {
	relativePath: string
	fullPath: string
	dependencies: StringMap
}

export type RuntimeConfig_ProjectUnit = {}

export abstract class ProjectUnit<C extends Config_ProjectUnit = Config_ProjectUnit>
	extends BaseUnit<C> {

	constructor(config: C) {
		super(config);
		this.addToClassStack(ProjectUnit);
	}
}

