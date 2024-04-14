import {Module} from '@nu-art/ts-common';
import {ApiCallerRouter, ApiDef_ServerInfo, ApiDefCaller, ApiStruct_ServerInfo, QueryApi, Response_ServerInfo} from '../../shared';
import {apiWithQuery} from '../core/typed-api';

class ModuleFE_ServerInfo_Class
	extends Module
	implements ApiDefCaller<ApiStruct_ServerInfo> {

	v1: ApiCallerRouter<{ getServerInfo: QueryApi<Response_ServerInfo>; }>;

	constructor() {
		super();
		this.v1 = {
			getServerInfo: apiWithQuery(ApiDef_ServerInfo.v1.getServerInfo)
		};
	}

}

export const ModuleFE_ServerInfo = new ModuleFE_ServerInfo_Class();