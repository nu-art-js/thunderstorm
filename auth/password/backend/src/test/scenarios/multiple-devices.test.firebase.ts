import {md5} from '@nu-art/ts-common';
import {ModuleBE_PasswordAuth} from '../_main.js';
import {stormTester, StormTestInput} from '@nu-art/storm-testalot';
import {DefaultStormTestConfig_PasswordAuth, TestHelper_InterceptJwtHeader} from '../utils/helpers.js';
import {runScenario} from '@nu-art/testalot';
import {MemKey_HttpResponse} from '@nu-art/http-server';
import {expect} from 'chai';


const DefaultStormTest: StormTestInput = {
	...DefaultStormTestConfig_PasswordAuth,
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

				const promiseRegister = ModuleBE_PasswordAuth.registerAccount({email, password, passwordCheck: password, deviceId: deviceA});
				const jwt1 = await TestHelper_InterceptJwtHeader(promiseRegister);

				const promiseLogin = ModuleBE_PasswordAuth.handleLogin({email, password, deviceId: deviceB});
				const jwt2 = await TestHelper_InterceptJwtHeader(promiseLogin);

				expect(jwt1).to.not.equal(jwt2);
			}));
	});
});
