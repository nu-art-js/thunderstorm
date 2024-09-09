import {Module, RuntimeVersion} from '@nu-art/ts-common';
import {createQueryServerApi} from '../core/typed-api';
import {addRoutes} from './ModuleBE_APIs';
import {Storm} from '../core/Storm';
import {DatabaseWrapperBE, FirebaseRef, ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {ApiDef_ServerInfo, Default_ServerInfoNodePath, Response_ServerInfo, ServerInfoFirebaseState} from '../../shared';


type Config = Response_ServerInfo

export class ModuleBE_ServerInfo_Class
	extends Module<Config> {

	private database!: DatabaseWrapperBE;
	private serverInfoData!: FirebaseRef<ServerInfoFirebaseState>;

	constructor() {
		super();
	}

	async init() {
		super.init();

		ModuleBE_Firebase.createAdminSession().getStorage().getMainBucket().then(async bucket => {
			this.setDefaultConfig({
				environment: Storm.getInstance().getEnvironment(),
				version: RuntimeVersion(),
				bucketName: bucket.getBucketName()
			});
		});

		addRoutes([
			createQueryServerApi(ApiDef_ServerInfo.v1.getServerInfo, async () => this.config),
			createQueryServerApi(ApiDef_ServerInfo.v1.updateServerInfo, async () => this.writeServerInfo())
		]);

		this.database = ModuleBE_Firebase.createAdminSession().getDatabase();
		this.serverInfoData = this.database.ref<ServerInfoFirebaseState>(Default_ServerInfoNodePath);
	}

	private writeServerInfo = async () => {
		await this.serverInfoData.set({
			environment: this.config.environment!,
			version: this.config.version!,
			bucketName: this.config.bucketName!,
		});
	};
}

export const ModuleBE_ServerInfo = new ModuleBE_ServerInfo_Class();
