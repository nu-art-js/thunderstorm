import {generateHex, JwtTools, RecursiveObjectOfPrimitives, tsValidate, tsValidateMustExist, tsValidateValue} from '@nu-art/ts-common';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {BaseSessionClaims, ModuleBE_SessionDB} from '../../main/_entity/session/backend/index.js';
import {stormTester, StormTestInput} from '@nu-art/thunderstorm-backend/test/StormTest';
import {DB_Session} from '../../main/index.js';
import {expect} from 'chai';
import {DefaultStormTestConfig_Session, ModuleDummy_Claims} from '../utils/helpers.js';

type Input = {
	initialClaims: BaseSessionClaims
	claims: RecursiveObjectOfPrimitives
};

type Result = {
	claims: RecursiveObjectOfPrimitives;
	dbSession: DB_Session;
};

const test = async (input: Input): Promise<Result> => {
	const dbSession = await ModuleBE_SessionDB._session.create({initialClaims: input.initialClaims});
	const claims = await JwtTools.decode(dbSession.sessionIdJwt);
	return {claims, dbSession};
};

const initialClaims: BaseSessionClaims = {
	accountId: generateHex(32),
	label: 'label',
	deviceId: generateHex(32)
};

const DefaultTest: StormTestInput = {
	...DefaultStormTestConfig_Session,
	before: async () => {
		ModuleDummy_Claims.value = '8888';
		await DefaultStormTestConfig_Session.before?.();
	},
	after: async () => {
		await DefaultStormTestConfig_Session.after?.();
		ModuleDummy_Claims.value = '8888';
	},
};

describe('JWT Token - Claims', () => {
	it('Basic Session Claims', async () => {
		await stormTester(DefaultTest, () => runSingleTestCase(test, {
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
		));
	});

	it('Custom Claims', async () => {
		const stormTestInput = {
			...DefaultTest,
			modules: [...DefaultTest.modules, ModuleDummy_Claims]
		};
		await stormTester(stormTestInput, () => runSingleTestCase(test, {
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
		));
	});

	it('Create and get DB Session by JWT', async () => {
		await stormTester({
			...DefaultTest,
			modules: [...DefaultTest.modules, ModuleDummy_Claims],
		}, () => runSingleTestCase(test, {
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
		));
	});
});

