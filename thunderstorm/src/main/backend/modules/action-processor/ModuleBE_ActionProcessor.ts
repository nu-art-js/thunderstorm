import {
	_values,
	ApiException,
	BadImplementationException,
	isErrorOfType,
	Logger,
	LogLevel,
	Module,
	TypedMap
} from '@nu-art/ts-common';
// import {ApiDefServer} from '../../utils/api-caller-types';
import {ActionMetaData, ApiDef_ActionProcessing, Request_ActionToProcess} from '../../../shared/action-processor';
import {createBodyServerApi, createQueryServerApi} from '../../core/typed-api';
import {addRoutes} from '../ApiModule';
import {ActionDeclaration} from './types';

export class ModuleBE_ActionProcessor_Class
	extends Module {

	private readonly actionMap: TypedMap<(data: any) => Promise<any>> = {};
	private readonly actionMetaData: TypedMap<ActionMetaData> = {};

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);

		addRoutes([createBodyServerApi(ApiDef_ActionProcessing.vv1.execute, this.refactor), createQueryServerApi(ApiDef_ActionProcessing.vv1.list, this.list)]);
	}

	readonly registerAction = (rad: ActionDeclaration, logger: Logger) => {
		if (this.actionMap[rad.key])
			throw new BadImplementationException(`ActionProcessor with key ${rad.key} was registered twice!`);

		this.actionMap[rad.key] = (data: any) => rad.processor(logger || this, data);
		this.actionMetaData[rad.key] = {key: rad.key, description: rad.description, group: rad.group};
	};

	private refactor = async (action: Request_ActionToProcess) => {
		this.logWarning(`RECEIVED ACTION: ${action.key}`);

		const refactoringAction = this.actionMap[action.key];
		if (!refactoringAction) {
			throw new ApiException(404, `NO SUCH ACTION: ${action.key}`);
		}

		try {
			this.logWarning(`ACTION '${action.key}' - EXECUTING`);
			await refactoringAction?.(action.data);
			this.logWarning(`ACTION '${action.key}' - SUCCESSFUL`);
		} catch (e: any) {
			this.logError(`ACTION '${action.key}' - FAILED`, e);
			const message = `ACTION FAILED: ${action.key}`;
			if (isErrorOfType(e, ApiException))
				throw e;
			throw new ApiException(500, message, e);
		}
	};

	private list = async () => {
		return _values(this.actionMetaData);
	};

}

export const ModuleBE_ActionProcessor = new ModuleBE_ActionProcessor_Class();