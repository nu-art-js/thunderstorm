import {Unit_NodeProject} from '../../units/index.js';
import {tsValidateValue} from '@nu-art/ts-common';
import {UnitMapper_Node, UnitMapper_NodeContext} from './UnitMapper_Node.js';


/**
 * Mapper for discovering root NodeProject unit.
 * 
 * **Discovery Criteria**:
 * - Must have `package.json` with `unitConfig.type === 'node-project'`
 * - Typically the monorepo root
 * 
 * **Unit Creation**:
 * - Creates `Unit_NodeProject` instance
 * - Marks as root and top-level app
 * - Enables hot reload
 * 
 * **Usage**: Automatically registered by `BuildAndInstall.prepareUnitsMapper()`.
 * There should typically be only one NodeProject unit per workspace.
 */
export class UnitMapper_NodeProject_Class
	extends UnitMapper_Node<Unit_NodeProject> {

	static tsValidator_NodeProject = {
		type: tsValidateValue(['node-project']),
		...UnitMapper_Node.tsValidator_Node,
	};

	constructor() {
		super(UnitMapper_NodeProject_Class.tsValidator_NodeProject);
	}

	/**
	 * Creates a Unit_NodeProject instance from resolved context.
	 * 
	 * @param context - Resolved node unit context
	 * @returns Unit_NodeProject instance
	 */
	protected async resolveNodeUnit(context: UnitMapper_NodeContext) {
		return new Unit_NodeProject({
			...context.baseConfig,
			isTopLevelApp: true,
			isRoot: true,
			hasSelfHotReload: true,
			packageJson: context.packageJson,
		});
	}
}

export const UnitMapper_NodeProject = new UnitMapper_NodeProject_Class();