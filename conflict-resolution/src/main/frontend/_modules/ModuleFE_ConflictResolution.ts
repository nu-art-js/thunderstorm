import {DBEntityDependencies, DBEntityDependencyErrorType} from '@nu-art/thunderstorm';
import {ModuleFE_XHR} from '@nu-art/thunderstorm/frontend';
import {BadImplementationException, Module} from '@nu-art/ts-common';
import {dispatch_ShowConflictResolution} from '../_dispatchers';
import {ConflictResolutionItem} from '../../shared/types';

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

	public registerConflictResolutionItem = (item: ConflictResolutionItem<any>) => {
		const existing = this.conflictResolutionItems.find(_item => item.dbKey === _item.dbKey);
		if (existing)
			throw new BadImplementationException(`Conflict resolution item for dbKey ${item.dbKey} already registered!`);

		this.conflictResolutionItems.push(item);
	};

	public getConflictResolutionItem = (dbKey: string) => {
		return this.conflictResolutionItems.find(item => item.dbKey === dbKey);
	};
}

export const ModuleFE_ConflictResolution = new ModuleFE_ConflictResolution_Class();