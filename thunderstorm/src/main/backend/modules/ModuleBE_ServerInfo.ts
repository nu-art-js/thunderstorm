import {Module} from '@nu-art/ts-common';
import {createQueryServerApi} from '../core/typed-api';
import {Storm} from '../core/Storm';
import {ApiDef_ServerInfo, Response_ServerInfo} from '../../shared';
import {addRoutes} from './ApiModule';

type Config = {};

export class ModuleBE_ServerInfo_Class
	extends Module<Config> {

	constructor() {
		super();
		addRoutes([createQueryServerApi(ApiDef_ServerInfo.v1.getServerInfo, this.getServerInfo)]);
	}

	private getServerInfo = async (): Promise<Response_ServerInfo> => ({
		environment: Storm.getInstance().getEnvironment(),
		version: Storm.getInstance().getVersion(),
	});
}

export const ModuleBE_ServerInfo = new ModuleBE_ServerInfo_Class();
