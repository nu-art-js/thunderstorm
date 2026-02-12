import {Module} from '@nu-art/ts-common';
import {ApiDef_CollectionActions, ApiStruct_CollectionActions} from '@nu-art/storm-shared';
import type {ApiDefCaller} from '@nu-art/storm-shared';
import {HttpClient} from '@nu-art/http-client';

/** Body-API caller using http-client (replaces legacy apiWithBody). */
function bodyCaller<API extends { R: unknown; B: unknown }>(apiDef: API): (body: API['B']) => Promise<API['R']> {
	return (body: API['B']) =>
		HttpClient.default.createRequest(apiDef as any).setBodyAsJson(body).execute();
}

class ModuleFE_CollectionActions_Class
	extends Module {
	readonly upgrade: ApiDefCaller<ApiStruct_CollectionActions['upgrade']>;
	readonly check: ApiDefCaller<ApiStruct_CollectionActions['check']>;

	constructor() {
		super();
		this.upgrade = {
			collections: bodyCaller(ApiDef_CollectionActions.upgrade.collections),
			all: bodyCaller(ApiDef_CollectionActions.upgrade.all),
		};
		this.check = {
			usage: bodyCaller(ApiDef_CollectionActions.check.usage),
		};
	}
}

export const ModuleFE_CollectionActions = new ModuleFE_CollectionActions_Class();
