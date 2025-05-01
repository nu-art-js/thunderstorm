import {Unit_NodeProject} from '../../units';
import {tsValidateValue} from '@nu-art/ts-common';
import {UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node';


export class UnitMapper_NodeProject_Class
	extends UnitMapper_Node<Unit_NodeProject> {

	static tsValidator_NodeProject = {
		type: tsValidateValue(['node-project']),
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_NodeProject_Class.tsValidator_NodeProject);
	}

	protected async resolveNodeUnit(context: UnitMapper_NodeContext) {
		return new Unit_NodeProject({
			...context.baseConfig,
			customESLintConfig: context.customESLintConfig,
			isRoot: true,
		});
	}
}

export const UnitMapper_NodeProject = new UnitMapper_NodeProject_Class();