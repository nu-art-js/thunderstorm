import {md5} from '@nu-art/ts-common';
import {ModuleBE_AccountDB} from '../_main.js';
import {stormTester, StormTestInput} from '@nu-art/thunderstorm/backend/test/StormTest';
import {DefaultStormTestConfig_SessionAndAccount, TestHelper_InterceptJwtHeader, TestHelper_NoPasswordAssertion} from '../utils/helpers.js';
import {runScenario} from '@nu-art/ts-common/testing/consts';
import {MemKey_HttpResponse} from '@nu-art/thunderstorm/backend/modules/server/consts';
import {expect} from 'chai';


const DefaultStormTest: StormTestInput = {
	...DefaultStormTestConfig_SessionAndAccount,
	modules: [
		...DefaultStormTestConfig_SessionAndAccount.modules,
		ModuleBE_AccountDB
	],
	config: {
		...DefaultStormTestConfig_SessionAndAccount.config,
		ModuleBE_AccountDB: {
			...DefaultStormTestConfig_SessionAndAccount.config.ModuleBE_AccountDB,
			canRegister: true,
			...TestHelper_NoPasswordAssertion()
		}
	}
};

// @ts-ignore
MemKey_HttpResponse['unique'] = false;

describe('Multi-device login retains independent sessions', () => {
	it('Login from two devices should result in two independent sessions', async () => {
		await stormTester(DefaultStormTest,
			runScenario(async () => {
				const input = {
					email: 'multi-device-user@example.com',
					password: 'TestPassword1!',
					deviceA: md5('device-A-id'),
					deviceB: md5('device-B-id')
				};
				const {email, password, deviceA, deviceB} = input;


				// Login from Device A
				const promiseRegister = ModuleBE_AccountDB.account.register({email, password, passwordCheck: password, deviceId: deviceA});
				const jwt1 = await TestHelper_InterceptJwtHeader(promiseRegister);


				// Login from Device B
				const promiseLogin = ModuleBE_AccountDB.account.login({email, password, deviceId: deviceB});
				const jwt2 = await TestHelper_InterceptJwtHeader(promiseLogin);

				expect(jwt1).to.not.equal(jwt2);
			}));
	});
});
