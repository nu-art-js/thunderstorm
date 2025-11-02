import {Unit_TypescriptLib} from '../../units/index.js';
import {BadImplementationException, tsValidateValue} from '@nu-art/ts-common';
import {UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node.js';
import {resolve} from 'path';


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

		const unitConfig = context.packageJson.unitConfig;

		return new Unit_TypescriptLib({
			...context.baseConfig,
			hasSelfHotReload: unitConfig.hasSelfHotReload ?? false,
			customESLintConfig: context.customESLintConfig,
			customTSConfig: context.customTSConfig,
			output: resolve(context.baseConfig.fullPath, outputDir),
			packageJson: context.packageJson,
		});
	}
}

export const UnitMapper_NodeLib = new UnitMapper_NodeLib_Class();
