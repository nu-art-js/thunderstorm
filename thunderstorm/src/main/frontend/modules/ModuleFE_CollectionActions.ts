import {Module} from '@nu-art/ts-common';
import {ApiDefCaller} from '../shared';
import {ApiDef_CollectionActions, ApiStruct_CollectionActions} from '../../shared/collection-actions/api-def';
import {apiWithBody} from '../core/typed-api';

class ModuleFE_CollectionActions_Class
	extends Module {

	readonly upgrade: ApiDefCaller<ApiStruct_CollectionActions['upgrade']>;
	readonly check: ApiDefCaller<ApiStruct_CollectionActions['check']>;

	constructor() {
		super();
		this.upgrade = {
			collections: apiWithBody(ApiDef_CollectionActions.upgrade.collections),
			all: apiWithBody(ApiDef_CollectionActions.upgrade.all),
		};
		this.check = {
			usage: apiWithBody(ApiDef_CollectionActions.check.usage),
		};
	}

}

export const ModuleFE_CollectionActions = new ModuleFE_CollectionActions_Class();