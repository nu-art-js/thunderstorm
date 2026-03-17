import {Module} from '@nu-art/ts-common';
import {ApiDef, GeneralApi, HttpClient} from '@nu-art/http-client';
import {ApiDefCaller, ApiDef_CollectionActions, API_CollectionActions} from '@nu-art/storm-shared';

/** Body-API caller using http-client (replaces legacy apiWithBody). */
function bodyCaller<API extends GeneralApi>(apiDef: ApiDef<API>): (body: API['Body']) => Promise<API['Response']> {
	return (body: API['Body']) =>
		HttpClient.default.createRequest(apiDef).setBodyAsJson(body).execute();
}

class ModuleFE_CollectionActions_Class
	extends Module {
	readonly upgrade: ApiDefCaller<API_CollectionActions['upgrade']>;
	readonly check: ApiDefCaller<API_CollectionActions['check']>;

	constructor() {
		super();
		this.upgrade = {
			collections: bodyCaller(ApiDef_CollectionActions.upgrade.collections),
			all: bodyCaller(ApiDef_CollectionActions.upgrade.all),
		} as ApiDefCaller<API_CollectionActions['upgrade']>;
		this.check = {
			usage: bodyCaller(ApiDef_CollectionActions.check.usage),
		} as ApiDefCaller<API_CollectionActions['check']>;
	}
}

export const ModuleFE_CollectionActions = new ModuleFE_CollectionActions_Class();
