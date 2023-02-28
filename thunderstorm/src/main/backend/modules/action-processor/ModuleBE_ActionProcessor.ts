import {_keys, _logger_logException, dispatch_onServerError, Logger, LogLevel, Module, ServerErrorSeverity, TypedMap} from '@nu-art/ts-common';
// import {ApiDefServer} from '../../utils/api-caller-types';
import {ApiDef_ActionProcessing, Request_ActionToProcess} from '../../../shared/action-processor';
import {createBodyServerApi, createQueryServerApi} from '../../core/typed-api';
import {addRoutes} from '../ApiModule';
import {ActionDeclaration} from './types';

export class ModuleBE_ActionProcessor_Class
	extends Module {

	private readonly actionMap: TypedMap<(data: any) => Promise<any>> = {};

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);

		addRoutes([createBodyServerApi(ApiDef_ActionProcessing.vv1.execute, this.refactor), createQueryServerApi(ApiDef_ActionProcessing.vv1.list, this.list)]);
	}

	readonly registerAction = (rad: ActionDeclaration, logger: Logger) => {
		this.actionMap[rad.key] = (data: any) => rad.processor(logger || this, data);
	};

	private refactor = async (action: Request_ActionToProcess) => {
		this.logWarning(`RECEIVED ACTION: ${action.key}`);

		const refactoringAction = this.actionMap[action.key];
		if (!refactoringAction) {
			dispatch_onServerError.dispatchModuleAsync(ServerErrorSeverity.Error, this, `NO SUCH ACTION: ${action.key}`);
			return;
		}

		try {
			this.logWarning(`ACTION '${action.key}' - EXECUTING`);
			await refactoringAction?.(action.data);
			this.logWarning(`ACTION '${action.key}' - SUCCESSFUL`);
		} catch (e: any) {
			this.logError(`ACTION '${action.key}' - FAILED`, e);
			const message = `ACTION FAILED: ${action.key}\n${_logger_logException(e)}`;
			dispatch_onServerError.dispatchModuleAsync(ServerErrorSeverity.Error, this, message);
		}
	};

	private list = async () => {
		return {items: _keys(this.actionMap) as string[]};
	};

}

export const ModuleBE_ActionProcessor = new ModuleBE_ActionProcessor_Class();