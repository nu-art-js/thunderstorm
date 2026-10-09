import {Unit_TypescriptLib} from '../../implementations/Unit_TypescriptLib.js';
import {BadImplementationException, tsValidateValue} from '@nu-art/ts-common';
import {resolvePackageOutputDir, UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node.js';
import {resolve} from 'path';


/**
 * Mapper for discovering TypeScript library units.
 *
 * **Discovery Criteria**:
 * - Must have `package.json` with `unitConfig.type === 'typescript-lib'`
 * - Must have `unitConfig.output` (output directory)
 * - Must have TypeScript source files
 *
 * **Unit Creation**:
 * - Creates `Unit_TypescriptLib` instance
 * - Configures output directory from `unitConfig.output`
 * - Sets hot reload flag from `unitConfig.hasSelfHotReload`
 * - Detects custom ESLint/TSConfig files
 *
 * **Usage**: Automatically registered by `BuildAndInstall.prepareUnitsMapper()`.
 */
export class UnitMapper_NodeLib_Class
	extends UnitMapper_Node<Unit_TypescriptLib> {

	static tsValidator_NodeProject = {
		type: tsValidateValue(['typescript-lib']),
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_NodeLib_Class.tsValidator_NodeProject);
	}

	/**
	 * Creates a Unit_TypescriptLib instance from resolved context.
	 *
	 * @param context - Resolved node unit context
	 * @returns Unit_TypescriptLib instance
	 * @throws BadImplementationException if unitConfig.output is missing
	 */
	protected async resolveNodeUnit(context: UnitMapper_NodeContext) {
		const outputDir = resolvePackageOutputDir(context.packageJson);
		if (!outputDir)
			throw new BadImplementationException('package.json MUST specify \'unitConfig.output\'');

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
