import {Day, Module, TEST_JwtTools, TypedKeyValue} from '@nu-art/ts-common';
import {BaseSessionClaims, CollectSessionData, ModuleBE_SessionDB} from '../../main/_entity/session/backend';
import {StormTestInputDefault} from '@nu-art/thunderstorm/backend/test/StormTest';
import {ModuleBE_APIs, ModuleBE_SyncManager} from '@nu-art/thunderstorm/backend';
import {TimeProxy} from '@nu-art/ts-common/utils/time-proxy';

export class DummyAccountModule_Class
	extends Module
	implements CollectSessionData<TypedKeyValue<'account', { type: 'user' | 'service' }>> {

	private accountType;

	constructor(accountType: 'user' | 'service' = 'user') {
		super();
		this.accountType = accountType;
	}

	async __collectSessionData(data: BaseSessionClaims) {
		return {
			key: 'account' as const,
			value: {type: this.accountType}
		};
	}
}

export const ModuleDummy_AccountsUser = new DummyAccountModule_Class('user');
export const ModuleDummy_AccountsServiceAccount = new DummyAccountModule_Class('service');

export class DummyClaimsModules_Class
	extends Module
	implements CollectSessionData<TypedKeyValue<'custom', { value: string }>> {

	value: string = 'test';

	constructor() {
		super();
	}

	async __collectSessionData(data: BaseSessionClaims) {
		return {
			key: 'custom' as const,
			value: {value: this.value}
		};
	}
}

export const ModuleDummy_Claims = new DummyClaimsModules_Class();

export const DefaultStormTestConfig: StormTestInputDefault = {
	modules: [
		ModuleBE_APIs,
		ModuleBE_SyncManager,
		ModuleBE_SessionDB,
	],
	config: {
		ModuleBE_SessionDB: {
			sessionTTLms: Day,
			rotationFactor: 0.5,
			jwtSigner: {secretKey: 'secret'}
		}
	},
	before: async () => {
		TimeProxy.reset();
		TEST_JwtTools.beforeAll();
	},
	after: async () => {
		TEST_JwtTools.afterAll();
		TimeProxy.reset();
	},
	cleanup: async () => {
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		ModuleBE_SessionDB['jwtHandler']['secret'].get = async () => ['secret'];
	},
};
