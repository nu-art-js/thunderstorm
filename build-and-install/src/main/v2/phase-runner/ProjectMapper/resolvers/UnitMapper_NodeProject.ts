import {Unit_TypescriptProject} from '../../../unit/core';
import {UnitMapper_Node, UnitMapper_NodeContext} from './core';
import {tsValidateValue} from '@nu-art/ts-common';


export class UnitMapper_NodeProject_Class
	extends UnitMapper_Node<Unit_TypescriptProject> {

	static tsValidator_NodeProject = {
		type: tsValidateValue(['node-project']),
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_NodeProject_Class.tsValidator_NodeProject);
	}

	protected async resolveNodeUnit(context: UnitMapper_NodeContext) {
		return new Unit_TypescriptProject({
			...context.baseConfig,
			isRoot: true,
		});
	}
}

export const UnitMapper_NodeProject = new UnitMapper_NodeProject_Class();