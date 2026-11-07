import {Day, Module, TEST_JwtTools, TypedKeyValue} from '@nu-art/ts-common';
import {TimeProxy} from '@nu-art/ts-common/utils/time-proxy';
import {ModuleBE_BaseDB} from '@nu-art/db-api-backend';
import {ModuleBE_Firebase} from '@nu-art/firebase-backend';
import {BaseSessionClaims, CollectSessionData, ModuleBE_AccountDB, ModuleBE_SessionDB} from '../_main.js';

/** Matches bai-config.json files.tests.firebase.mongoPort when BAI has not injected MONGODB_EMULATOR_HOST. */
const DEFAULT_MONGO_PORT = 27019;
const USER_ACCOUNT_TEST_MONGO_DB = 'user-account-test';

/** Bind this suite's Mongo DB before stormTester.init(). */
export function bindUserAccountMongoDb() {
	ModuleBE_BaseDB.setMongoDbName(USER_ACCOUNT_TEST_MONGO_DB);
}

function resolveMongoUrl(): string {
	const host = process.env.MONGODB_EMULATOR_HOST ?? `localhost:${DEFAULT_MONGO_PORT}`;
	process.env.MONGODB_EMULATOR_HOST ??= host;
	return `mongodb://${host}`;
}

export async function dropUserAccountTestDatabase() {
	const session = ModuleBE_Firebase.createAdminSession();
	const client = await session.getMongoClient();
	await client.db(USER_ACCOUNT_TEST_MONGO_DB).dropDatabase();
}

export const userAccountMongoConfig = {
	ModuleBE_Firebase: {
		mongo: {
			mongoUrl: resolveMongoUrl(),
			params: {
				directConnection: 'true',
				replicaSet: 'rs0',
			},
		},
	},
};

bindUserAccountMongoDb();

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
		ModuleBE_Firebase,
		ModuleBE_SessionDB,
	],
	config: {
		...userAccountMongoConfig,
		ModuleBE_SessionDB: {
			sessionTTLms: Day,
			rotationFactor: 0.5,
			jwtSigner: {secretKey: 'secret'}
		},
	},
	before: async () => {
		bindUserAccountMongoDb();
		generalBefore();
		await dropUserAccountTestDatabase();
	},
	after: async () => {
		await dropUserAccountTestDatabase();
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
	before: DefaultStormTestConfig_Session.before,
	after: DefaultStormTestConfig_Session.after,
});
