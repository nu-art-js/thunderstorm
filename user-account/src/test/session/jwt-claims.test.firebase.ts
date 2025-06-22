import {TestSuite} from '@nu-art/ts-common/testing/types';
import {Day, generateHex, JwtTools, RecursiveObjectOfPrimitives, TEST_JwtTools, tsValidate, tsValidateMustExist, tsValidateValue} from '@nu-art/ts-common';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {BaseSessionClaims, ModuleBE_SessionDB} from '../../main/_entity/session/backend';
import {ModuleBE_APIs, ModuleBE_SyncManager} from '@nu-art/thunderstorm/backend';
import {stormTester, StormTestInputDefault} from '@nu-art/thunderstorm/backend/test/StormTest';
import {DB_Session} from '../../main';
import {expect} from 'chai';
import {ModuleDummy_Claims} from './helpers';
import {TimeProxy} from '@nu-art/ts-common/utils/time-proxy';

type Input = {
	initialClaims: BaseSessionClaims
	claims: RecursiveObjectOfPrimitives
};

type Result = {
	claims: RecursiveObjectOfPrimitives;
	dbSession: DB_Session;
};

type EmailValidationSuite = TestSuite<Input, Result>;
type TestCase_EmailValidation = EmailValidationSuite['testcases'][number];

const test = async (input: Input): Promise<Result> => {
	const dbSession = await ModuleBE_SessionDB._session.create({initialClaims: input.initialClaims});
	const claims = await JwtTools.decode(dbSession.sessionIdJwt);
	return {claims, dbSession};
};

const runTestCase = (testCase: TestCase_EmailValidation) => runSingleTestCase(test, testCase);
const initialClaims: BaseSessionClaims = {
	accountId: generateHex(32),
	label: 'label',
	deviceId: generateHex(32)
};

const DefaultTest: StormTestInputDefault = {
	modules: [
		ModuleBE_APIs,
		ModuleBE_SyncManager,
		ModuleBE_SessionDB,
	],
	config: {
		ModuleBE_SessionDB: {
			sessionTTLms: Day,
			jwtSigner: {
				secretKey: 'secret'
			}
		}
	},
	before: async () => {
		ModuleDummy_Claims.value = '8888';
		TimeProxy.reset();
		TEST_JwtTools.beforeAll();
	},
	after: async () => {
		TEST_JwtTools.afterAll();
		TimeProxy.reset();
		ModuleDummy_Claims.value = '8888';
	},
	cleanup: async () => {
		await ModuleBE_SessionDB.collection.delete.yes.iam.sure.iwant.todelete.the.collection.delete();
		ModuleBE_SessionDB['jwtHandler']['secret'].get = async () => ['secret'];
	},
};

describe('JWT Token - Claims', () => {
	it('Basic Session Claims', async () => {
		await stormTester({
			...DefaultTest,
			testCase: {
				input: {
					initialClaims,
					claims: {}
				},
				result: async (result: Result) => {
					tsValidate(result.claims, {
						deviceId: tsValidateValue([initialClaims.deviceId]),
						accountId: tsValidateValue([initialClaims.accountId]),
						label: tsValidateValue([initialClaims.label]),
						session: {deviceId: tsValidateValue([initialClaims.deviceId])},
						iat: tsValidateMustExist,
						exp: tsValidateMustExist,
					});

					console.log(result);
				}
			}
		}, runTestCase);
	});

	it('Custom Claims', async () => {
		await stormTester({
			...DefaultTest,
			modules: [...DefaultTest.modules, ModuleDummy_Claims],
			testCase: {
				input: {
					initialClaims,
					claims: {}
				},
				result: async (result: Result) => {
					tsValidate(result.claims, {
						deviceId: tsValidateValue([initialClaims.deviceId]),
						accountId: tsValidateValue([initialClaims.accountId]),
						label: tsValidateValue([initialClaims.label]),
						session: {deviceId: tsValidateValue([initialClaims.deviceId])},
						custom: {value: tsValidateValue(['8888'])},
						iat: tsValidateMustExist,
						exp: tsValidateMustExist,
					});

					console.log(result);
				}
			}
		}, runTestCase);
	});

	it('Create and get DB Session by JWT', async () => {
		await stormTester({
			...DefaultTest,
			modules: [...DefaultTest.modules, ModuleDummy_Claims],
			testCase: {
				input: {
					initialClaims,
					claims: {}
				},
				result: async (result: Result) => {
					console.log(result.dbSession);
					const dbSession = await ModuleBE_SessionDB._session.query.byJwt(result.dbSession.sessionIdJwt);
					expect(dbSession).to.deep.equal(result.dbSession);
				}
			}
		}, runTestCase);
	});
});

