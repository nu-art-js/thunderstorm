/*
 * @nu-art/conflict-resolution-frontend - Conflict resolution frontend module
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {DBEntityDependencies, DBEntityDependencyErrorType} from '@nu-art/thunderstorm-shared';
import {ModuleFE_XHR} from '@nu-art/thunderstorm-frontend/index';
import {BadImplementationException, Module, TypedMap, asArray} from '@nu-art/ts-common';
import {dispatch_ShowConflictResolution} from '../_dispatchers/index.js';
import {ConflictResolutionItem} from '@nu-art/conflict-resolution-shared';

class ModuleFE_ConflictResolution_Class
	extends Module {

	private readonly conflictResolutionItems: ConflictResolutionItem<any>[] = [];

	public initDefaultHasDependencyResponse = () => {
		ModuleFE_XHR.setDefaultOnError(async (errorResponse, input, request) => {
			if (errorResponse.errorResponse?.error?.type === DBEntityDependencyErrorType) {
				dispatch_ShowConflictResolution.dispatchUI(errorResponse.errorResponse.error.data);
			}
		});
	};

	public showDependencies = (dependencies: DBEntityDependencies) => {
		dispatch_ShowConflictResolution.dispatchUI(dependencies);
	};

	public registerConflictResolutionItem = (items: ConflictResolutionItem<any> | ConflictResolutionItem<any>[]) => {
		const toAdd = asArray(items);
		toAdd.forEach(item => {
			const existing = this.conflictResolutionItems.find(_item => item.dbKey === _item.dbKey);
			if (existing)
				throw new BadImplementationException(`Conflict resolution item for dbKey ${item.dbKey} already registered!`);

			this.conflictResolutionItems.push(item);
		});
	};

	public getConflictResolutionItem = (dbKey: string) => {
		return this.conflictResolutionItems.find(item => item.dbKey === dbKey);
	};

	public getConflictResolutionItemMap = () => {
		return this.conflictResolutionItems.reduce((map, item) => {
			map[item.dbKey] = item;
			return map;
		}, {} as TypedMap<ConflictResolutionItem<any>>);
	};
}

export const ModuleFE_ConflictResolution = new ModuleFE_ConflictResolution_Class();