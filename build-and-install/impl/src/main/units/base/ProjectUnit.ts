import {StringMap} from '@nu-art/ts-common';
import {BaseUnit, BaseUnit_Config, UnitRuntimeContext} from './BaseUnit.js';


export type Config_ProjectUnit = BaseUnit_Config & {
	relativePath: string;
	fullPath: string;
	dependencies: StringMap;
}

export type ProjectUnit_RuntimeContext = UnitRuntimeContext & {
	parentUnit: ProjectUnit<any>
	childUnits: ProjectUnit[]
}

/**
 * Abstract base class for project units (packages/apps in the workspace).
 *
 * **Project Units vs Base Units**:
 * - **Project Units**: Have file paths, dependencies, and participate in dependency resolution
 * - **Base Units**: Generic units without file system context
 *
 * **Key Properties**:
 * - `relativePath`: Path relative to project root
 * - `fullPath`: Absolute path to unit directory
 * - `dependencies`: Map of dependency keys (for dependency resolution)
 *
 * **Runtime Context**: ProjectUnits receive `ProjectUnit_RuntimeContext` which includes:
 * - `parentUnit`: Root NodeProject unit
 * - `childUnits`: All project units in workspace
 *
 * **Examples**: Unit_NodeProject, Unit_TypescriptLib, Unit_FirebaseHostingApp
 */
export abstract class ProjectUnit<C extends Config_ProjectUnit = Config_ProjectUnit>
	extends BaseUnit<C, ProjectUnit_RuntimeContext> {

	constructor(config: C) {
		super(config);
		this.addToClassStack(ProjectUnit);
	}
}
