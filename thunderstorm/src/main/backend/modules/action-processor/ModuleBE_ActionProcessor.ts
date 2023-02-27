import {dispatch_onServerError, Logger, LogLevel, Module, ServerErrorSeverity, TypedMap, _keys, _logger_logException} from '@nu-art/ts-common';
import {ApiDefServer, ApiModule} from '../../utils/api-caller-types';
import {ApiDef_ActionProcessing, ApiStruct_ActionProcessing, Request_ActionToProcess} from '../../../shared/action-processor';
import {createBodyServerApi, createQueryServerApi} from '../../core/typed-api';
import {ActionDeclaration} from './types';


export class ModuleBE_ActionProcessor_Class
	extends Module
	implements ApiDefServer<ApiStruct_ActionProcessing>, ApiModule {
	readonly vv1;

	private readonly actionMap: TypedMap<(data: any) => Promise<any>> = {};

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);

		this.vv1 = {
			execute: createBodyServerApi(ApiDef_ActionProcessing.vv1.execute, this.refactor),
			list: createQueryServerApi(ApiDef_ActionProcessing.vv1.list, this.list),
		};
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

	useRoutes() {
		return [this.vv1.execute, this.vv1.list];
	}
}

export const ModuleBE_ActionProcessor = new ModuleBE_ActionProcessor_Class();

