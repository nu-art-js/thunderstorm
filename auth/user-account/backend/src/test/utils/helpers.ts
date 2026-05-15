import {Day, Module, TEST_JwtTools, TypedKeyValue} from '@nu-art/ts-common';
import {TimeProxy} from '@nu-art/ts-common/utils/time-proxy';
import {BaseSessionClaims, CollectSessionData, ModuleBE_AccountDB, ModuleBE_SessionDB} from '../_main.js';

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

function generalBefore() {
	secretGet = ModuleBE_SessionDB['jwtHandler']['secret'].get;
	ModuleBE_SessionDB['jwtHandler']['secret'].get = async () => ['secret'];
	TimeProxy.reset();
	TEST_JwtTools.beforeAll();
}


function generalAfter() {
	TEST_JwtTools.afterAll();
	TimeProxy.reset();
	ModuleBE_SessionDB['jwtHandler']['secret'].get = secretGet;
}

let secretGet: any;
export const DefaultStormTestConfig_Session = Object.freeze({
	modules: [
		ModuleBE_SessionDB,
	],
	config: {
		ModuleBE_SessionDB: {
			sessionTTLms: Day,
			rotationFactor: 0.5,
			jwtSigner: {secretKey: 'secret'}
		},
	},
	before: async () => {
		generalBefore();
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	},
	after: async () => {
		await ModuleBE_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		generalAfter();
	}
});

export const DefaultStormTestConfig_SessionAndAccount = Object.freeze({
	modules: [
		...DefaultStormTestConfig_Session.modules,
		ModuleBE_AccountDB,
	],
	config: {
		...DefaultStormTestConfig_Session.config,
	},
	before: async () => {
		generalBefore();
		await ModuleBE_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	},
	after: async () => {
		await ModuleBE_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		generalAfter();
	}
});
