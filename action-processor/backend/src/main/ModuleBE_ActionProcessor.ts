/*
 * @nu-art/action-processor-backend - Action processor backend module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {_values, ApiException, BadImplementationException, exists, isErrorOfType, Logger, LogLevel, Module, resolveContent, TypedMap,} from '@nu-art/ts-common';
import {ApiDef_ActionProcessing, type ApiStruct_ActionProcessing} from '@nu-art/action-processor-shared';
import {ApiHandler} from '@nu-art/http-server';
import {ActionDeclaration} from './types.js';
import {RAD_SetupProject} from './Action_SetupProject.js';

type Action = {
	action: (data: any) => Promise<any>;
	declaration: ActionDeclaration;
};

export class ModuleBE_ActionProcessor_Class
	extends Module {

	private readonly actions: TypedMap<Action> = {};

	constructor() {
		super();
		this.setMinLevel(LogLevel.Verbose);
		this.registerAction(RAD_SetupProject, this);
	}

	readonly registerAction = (rad: ActionDeclaration, logger: Logger) => {
		this.logInfo(`Registering action: ${rad.key}`);
		if (this.actions[rad.key])
			throw new BadImplementationException(`ActionProcessor with key ${rad.key} was registered twice!`);

		this.actions[rad.key] = {
			action: (data: any) => rad.processor(logger || this, data),
			declaration: rad,
		};
	};

	@ApiHandler(ApiDef_ActionProcessing.vv1.execute)
	async execute(action: ApiStruct_ActionProcessing['vv1']['execute']['Body']): Promise<ApiStruct_ActionProcessing['vv1']['execute']['Response']> {
		this.logWarning(`RECEIVED ACTION: ${action.key}`);

		const actionObj = this.actions[action.key];
		if (!actionObj)
			throw new ApiException(404, `NO SUCH ACTION: ${action.key}`);

		if (exists(actionObj.declaration.visible) && !resolveContent(actionObj.declaration.visible))
			throw new ApiException(403, 'Action Forbidden for User');

		const refactoringAction = actionObj.action;
		try {
			this.logWarning(`ACTION '${action.key}' - EXECUTING`);
			await refactoringAction?.(action.data);
			this.logWarning(`ACTION '${action.key}' - SUCCESSFUL`);
		} catch (e: unknown) {
			this.logError(`ACTION '${action.key}' - FAILED`, e as Error);
			if (isErrorOfType(e, ApiException))
				throw e;

			const message = `ACTION FAILED: ${actionObj.declaration.label ?? actionObj.declaration.key}`;
			throw new ApiException(500, message, e as Error);
		}
	}

	@ApiHandler(ApiDef_ActionProcessing.vv1.list)
	async list(_query?: ApiStruct_ActionProcessing['vv1']['list']['Params']): Promise<ApiStruct_ActionProcessing['vv1']['list']['Response']> {
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
	}
}

export const ModuleBE_ActionProcessor = new ModuleBE_ActionProcessor_Class();
