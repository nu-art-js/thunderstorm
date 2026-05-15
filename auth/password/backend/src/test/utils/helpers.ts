import {Day, Module, TEST_JwtTools, TypedKeyValue} from '@nu-art/ts-common';
import {MemKey_HttpRequest, MemKey_HttpResponse} from '@nu-art/http-server';
import {BaseSessionClaims, CollectSessionData, ModuleBE_AccountDB, ModuleBE_SessionDB} from '@nu-art/user-account-backend';
import {ResponseHeaderKey_JWTToken} from '@nu-art/api-types';
import {ModuleBE_PasswordAuth, ModuleBE_PasswordCredentialDB} from '../_main.js';
import {ModulePackBE_LoginAttemptDB, ModulePackBE_FailedLoginAttemptDB} from '../_main.js';

export class DummyAccountModule_Class
	extends Module
	implements CollectSessionData<TypedKeyValue<'account', { type: 'user' | 'service' }>> {

	constructor() {
		super();
	}

	async __collectSessionData(data: BaseSessionClaims) {
		return {
			key: 'account' as const,
			value: {type: 'user' as const}
		};
	}
}

export const ModuleDummy_Accounts = new DummyAccountModule_Class();

let secretGet: any;

function generalBefore() {
	secretGet = ModuleBE_SessionDB['jwtHandler']['secret'].get;
	ModuleBE_SessionDB['jwtHandler']['secret'].get = async () => ['secret'];
	TEST_JwtTools.beforeAll();
}

function generalAfter() {
	TEST_JwtTools.afterAll();
	ModuleBE_SessionDB['jwtHandler']['secret'].get = secretGet;
}

export async function TestHelper_InterceptJwtHeader<T>(promise: Promise<T>): Promise<string> {
	let capturedJwt = '';
	MemKey_HttpResponse.set({
		setHeader: (key: string, value: string) => {
			if (key === ResponseHeaderKey_JWTToken)
				capturedJwt = value;
		}
	} as any);
	await promise;
	return capturedJwt;
}

export const DefaultStormTestConfig_PasswordAuth = Object.freeze({
	modules: [
		ModuleBE_SessionDB,
		ModuleBE_AccountDB,
		ModuleBE_PasswordAuth,
		ModuleBE_PasswordCredentialDB,
		...ModulePackBE_LoginAttemptDB,
		...ModulePackBE_FailedLoginAttemptDB,
		ModuleDummy_Accounts,
	],
	config: {
		ModuleBE_SessionDB: {
			sessionTTLms: Day,
			rotationFactor: 0.5,
			jwtSigner: {secretKey: 'secret'}
		},
		ModuleBE_PasswordAuth: {
			canRegister: true,
		},
	},
	before: async () => {
		generalBefore();
		MemKey_HttpRequest.set({
			headers: {},
			socket: {remoteAddress: '127.0.0.1'},
			body: {}
		} as any);
		MemKey_HttpResponse.set({
			setHeader: () => {}
		} as any);
		await ModuleBE_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_PasswordCredentialDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
	},
	after: async () => {
		await ModuleBE_AccountDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		await ModuleBE_PasswordCredentialDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		generalAfter();
	}
});
