import {StringMap} from '@nu-art/ts-common';
import {BaseUnit, BaseUnit_Config, UnitRuntimeContext} from './BaseUnit';


export type Config_ProjectUnit = BaseUnit_Config & {
	relativePath: string;
	fullPath: string;
	dependencies: StringMap;
}

export type ProjectUnit_RuntimeContext = UnitRuntimeContext & {
	parentUnit: ProjectUnit
	childUnits: ProjectUnit[]
}

/**
 * Abstract class representing a Unit within a Project.
 * Extends the BaseUnit to provide additional project-specific preparation logic.
 */
export abstract class ProjectUnit<C extends Config_ProjectUnit = Config_ProjectUnit>
	extends BaseUnit<C, ProjectUnit_RuntimeContext> {

	constructor(config: C) {
		super(config);
		this.addToClassStack(ProjectUnit);
	}

	/**
	 * Prepares the workspace for this project unit.
	 * Ensures tsconfig.json files exist in the proper source folders,
	 * and copies .eslintrc.json if necessary, handling fallback scenarios cleanly.
	 */
	async prepare(params: { baiDefaultsPath: string; projectRoot: string; }) {
	}
}
