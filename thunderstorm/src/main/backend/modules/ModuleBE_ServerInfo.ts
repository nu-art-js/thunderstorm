import {Module, RuntimeVersion} from '@nu-art/ts-common';
import {createQueryServerApi} from '../core/typed-api';
import {addRoutes} from './ModuleBE_APIs';
import {Storm} from '../core/Storm';
import {FirebaseRef, ModuleBE_Firebase} from '@nu-art/firebase/backend';
import {ApiDef_ServerInfo, BasicServerInfo, Const_ERROR, Const_OK, Default_ServerInfoNodePath, Response_ServerInfo, ServerInfoFirebaseState} from '../../shared';
import {ModuleBE_SyncManager} from './sync-manager/ModuleBE_SyncManager';


type Config = BasicServerInfo

export class ModuleBE_ServerInfo_Class
	extends Module<Config> {

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
			createQueryServerApi(ApiDef_ServerInfo.v1.getServerInfo, this.getServerInfo),
			createQueryServerApi(ApiDef_ServerInfo.v1.updateServerInfoState, async () => this.writeServerInfoState())
		]);

		this.serverInfoData = ModuleBE_Firebase.createAdminSession().getDatabase().ref<ServerInfoFirebaseState>(Default_ServerInfoNodePath);
	}

	private getServerInfo = async () => {
		const firestoreResponse = await this.pingFirestore();
		const firebaseRTDBResponse = await this.pingFirebaseRTDB();
		const response: Response_ServerInfo = {
			environment: this.config.environment,
			version: this.config.version,
			bucketName: this.config.bucketName,
			status: {
				firestore: firestoreResponse,
				firebase: firebaseRTDBResponse
			}
		};
		return response;
	};

	/**
	 * Perform a "ping" to the environment's default Firebase project's Firestore
	 */
	pingFirestore = async () => {
		try {
			await ModuleBE_SyncManager.collection.query.custom({where: {}, limit: 1});
			return Const_OK;
		} catch (e: any) {
			this.logError(e);
			return Const_ERROR;
		}
	};

	/**
	 * Perform a "ping" to the environment's default Firebase project's RTDB
	 */
	pingFirebaseRTDB = async () => {
		try {
			await this.serverInfoData.get();
			return Const_OK;
		} catch (e: any) {
			this.logError(e);
			return Const_ERROR;
		}
	};

	private writeServerInfoState = async () => {
		await this.serverInfoData.set({
			environment: this.config.environment!,
			version: this.config.version!,
			bucketName: this.config.bucketName!,
		});
	};
}

export const ModuleBE_ServerInfo = new ModuleBE_ServerInfo_Class();
