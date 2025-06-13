import {TestSuite} from '@nu-art/ts-common/testing/types';
import {TS_Object} from '@nu-art/ts-common';
import {runSingleTestCase} from '@nu-art/ts-common/testing/consts';
import {ModuleBE_SessionDB} from '../main/_entity/session/backend';

type Input = {
	claims?: TS_Object
};

type EmailValidationSuite = TestSuite<Input, boolean>;
type TestCase_EmailValidation = EmailValidationSuite['testcases'][number];

const test = async (input: Input): Promise<boolean> => {
	const encode = await ModuleBE_SessionDB['sessionData'].encode(input.claims ?? {});
	const zipJWT = await ModuleBE_SessionDB['sessionData'].createJWT(encode, 1000);
	const rawJWT = await ModuleBE_SessionDB['sessionData'].createJWT(input.claims ?? {}, 1000);
	console.log(`zipJWT: ${zipJWT.length}`, `rawJWT: ${rawJWT.length}`);
	return true;
};

const runTestCase = (testCase: TestCase_EmailValidation) => () => runSingleTestCase(test, testCase);

describe('Session JWT', () => {

	before(async () => {
		ModuleBE_SessionDB['getPrivateKeyForSessionSigning'] = async () => 'secret';
		ModuleBE_SessionDB.setDefaultConfig({
			sessionTTLms: 1000,
			accountSessionIdSigner_SecretName: 'secret'
		});
	});

	beforeEach(async () => {
	});

	it('No Claims', runTestCase({
		description: 'Create With password',
		input: {
			claims: {}
		},
		result: true
	}));

	after(async () => {
	});
});
