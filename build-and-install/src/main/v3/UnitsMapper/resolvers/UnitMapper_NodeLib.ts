import {Unit_TypescriptLib} from '../../units';
import {BadImplementationException, tsValidateValue} from '@nu-art/ts-common';
import {UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node';


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
			customESLintConfig: context.customESLintConfig,
			customTSConfig: context.customTSConfig,
			output: outputDir,
			packageJson: context.packageJson,
		});
	}
}

export const UnitMapper_NodeLib = new UnitMapper_NodeLib_Class();
