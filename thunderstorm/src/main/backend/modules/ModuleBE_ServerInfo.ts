import {Module, RuntimeVersion} from '@nu-art/ts-common';
import {createQueryServerApi} from '../core/typed-api';
import {ApiDef_ServerInfo, Response_ServerInfo} from '../../shared';
import {addRoutes} from './ModuleBE_APIs';
import {Storm} from '../core/Storm';
import {ModuleBE_Firebase} from '@nu-art/firebase/backend';


type Config = Response_ServerInfo

export class ModuleBE_ServerInfo_Class
	extends Module<Config> {

	constructor() {
		super();
	}

	init() {
		super.init();

		ModuleBE_Firebase.createAdminSession().getStorage().getMainBucket().then(bucket => {
			this.setDefaultConfig({
				environment: Storm.getInstance().getEnvironment(),
				version: RuntimeVersion(),
				bucketName: bucket.getBucketName()
			});
		});

		addRoutes([createQueryServerApi(ApiDef_ServerInfo.v1.getServerInfo, async () => this.config)]);
	}

}

export const ModuleBE_ServerInfo = new ModuleBE_ServerInfo_Class();
