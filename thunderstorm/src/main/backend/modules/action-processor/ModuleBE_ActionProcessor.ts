import {_values, ApiException, BadImplementationException, exists, isErrorOfType, Logger, LogLevel, Module, resolveContent, TypedMap} from '@nu-art/ts-common';
// import {ApiDefServer} from '../../utils/api-caller-types';
import {ApiDef_ActionProcessing, Request_ActionToProcess} from '../../../shared/action-processor';
import {createBodyServerApi, createQueryServerApi} from '../../core/typed-api';
import {addRoutes} from '../ModuleBE_APIs';
import {ActionDeclaration} from './types';
import {RAD_SetupProject} from './Action_SetupProject';
import {HttpCodes} from '@nu-art/ts-common/core/exceptions/http-codes';


type Action = {
	action: (data: any) => Promise<any>,
	declaration: ActionDeclaration
};

export class ModuleBE_ActionProcessor_Class
	extends Module {

	private readonly actions: TypedMap<Action> = {};

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
	}

	protected init() {
		super.init();
		addRoutes([
			createBodyServerApi(ApiDef_ActionProcessing.vv1.execute, this.refactor),
			createQueryServerApi(ApiDef_ActionProcessing.vv1.list, this.list)
		]);

		this.registerAction(RAD_SetupProject, this);
	}

	readonly registerAction = (rad: ActionDeclaration, logger: Logger) => {
		this.logInfo(`Registering action: ${rad.key}`);
		if (this.actions[rad.key])
			throw new BadImplementationException(`ActionProcessor with key ${rad.key} was registered twice!`);

		this.actions[rad.key] = {
			action: (data: any) => rad.processor(logger || this, data),
			declaration: rad
		};
	};

	private refactor = async (action: Request_ActionToProcess) => {
		this.logWarning(`RECEIVED ACTION: ${action.key}`);

		const actionObj = this.actions[action.key];
		if (exists(actionObj.declaration.visible) && !resolveContent(actionObj.declaration.visible))
			throw HttpCodes._4XX.FORBIDDEN('Action Forbidden for User');

		const refactoringAction = actionObj.action;
		if (!refactoringAction) {
			throw HttpCodes._4XX.NOT_FOUND(`NO SUCH ACTION: ${action.key}`);
		}

		try {
			this.logWarning(`ACTION '${action.key}' - EXECUTING`);
			await refactoringAction?.(action.data);
			this.logWarning(`ACTION '${action.key}' - SUCCESSFUL`);
		} catch (e: any) {
			this.logError(`ACTION '${action.key}' - FAILED`, e);
			if (isErrorOfType(e, ApiException))
				throw e;

			const message = `ACTION FAILED: ${actionObj.declaration.label}`;
			throw HttpCodes._5XX.INTERNAL_SERVER_ERROR(message, '', e);
		}
	};

	private list = async () => {
		return _values(this.actions)
			.filter(action => !exists(action.declaration.visible) || resolveContent(action.declaration.visible))
			.map(action => {
				const declaration = action.declaration;
				return {
					key: declaration.key,
					label: declaration.label ?? declaration.key,
					description: declaration.description,
					group: declaration.group,
				};
			});
	};

}

export const ModuleBE_ActionProcessor = new ModuleBE_ActionProcessor_Class();