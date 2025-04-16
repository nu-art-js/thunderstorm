import {Unit_TypescriptLib} from '../../../unit/core';
import {UnitMapper_Node, UnitMapper_NodeContext} from './core';
import {BadImplementationException, tsValidateValue} from '@nu-art/ts-common';


export class UnitMapper_NodeLib_Class
	extends UnitMapper_Node<Unit_TypescriptLib> {

	static tsValidator_NodeProject = {
		type: tsValidateValue(['typescript-lib']),
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_NodeLib_Class.tsValidator_NodeProject);
	}

	protected async resolveNodeUnit(context: UnitMapper_NodeContext) {
		const outputDir = context.packageJson.publishConfig?.directory;
		if (!outputDir)
			throw new BadImplementationException('package.json MUST specify \'publishConfig.directory\'');

		return new Unit_TypescriptLib({
			...context.baseConfig,
			output: outputDir,
		});
	}
}

export const UnitMapper_NodeLib = new UnitMapper_NodeLib_Class();
