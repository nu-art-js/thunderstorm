import {Module} from '@nu-art/ts-common';
import {ApiDefServer, ApiModule} from '../utils/api-caller-types';
import {createQueryServerApi} from '../core/typed-api';
import {Storm} from '../core/Storm';
import {ApiDef_ServerInfo, ApiStruct_ServerInfo, Response_ServerInfo} from '../../shared';

type Config = {};

export class ModuleBE_ServerInfo_Class
	extends Module<Config>
	implements ApiDefServer<ApiStruct_ServerInfo>, ApiModule {
	readonly v1: ApiDefServer<ApiStruct_ServerInfo>['v1'];

	constructor() {
		super();
		this.v1 = {
			getServerInfo: createQueryServerApi(ApiDef_ServerInfo.v1.getServerInfo, this.getServerInfo),
		};
	}

	useRoutes() {
		return this.v1;
	}

	private getServerInfo = async (): Promise<Response_ServerInfo> => ({
		environment: Storm.getInstance().getEnvironment(),
		version: ''
	});
}

export const ModuleBE_ServerInfo = new ModuleBE_ServerInfo_Class();
