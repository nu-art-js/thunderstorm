import {tsValidateResult} from '@nu-art/ts-common';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {DBDef_Assets} from '../../main/db-def.js';
import {AssetStatus} from '../../main/types.js';


type ModifiableInput = {
	name: string
	ext: string
	mimeType: string
	key: string
};

type ValidResult = boolean;
type TestCase_Validator = TestModel<ModifiableInput, ValidResult>;

const testModifiable = async (input: ModifiableInput): Promise<ValidResult> => {
	const result = tsValidateResult(input, DBDef_Assets.modifiablePropsValidator);
	return !result;
};

const runModifiableTestCase = (testCase: TestCase_Validator) => {
	return () => runSingleTestCase(testModifiable, testCase);
};

describe('DBDef_Assets — modifiable props validator', () => {
	it('Accepts valid asset props', runModifiableTestCase({
		input: {name: 'test-file.jpg', ext: 'jpg', mimeType: 'image/jpeg', key: 'image'},
		result: true,
	}));

	it('Accepts name with exactly 3 chars', runModifiableTestCase({
		input: {name: 'abc', ext: 'txt', mimeType: 'text/plain', key: 'doc'},
		result: true,
	}));

	it('Rejects name shorter than 3 chars', runModifiableTestCase({
		input: {name: 'ab', ext: 'txt', mimeType: 'text/plain', key: 'doc'},
		result: false,
	}));

	it('Rejects empty name', runModifiableTestCase({
		input: {name: '', ext: 'txt', mimeType: 'text/plain', key: 'doc'},
		result: false,
	}));

	it('Accepts long file name', runModifiableTestCase({
		input: {name: 'my-very-long-file-name-with-special-chars_2026.pdf', ext: 'pdf', mimeType: 'application/pdf', key: 'document'},
		result: true,
	}));
});

type GeneratedInput = {
	md5Hash?: string
	path: string
	bucketName: string
	status: AssetStatus
	public?: boolean
	metadata?: Record<string, string>
	signedUrl?: { url: string; validUntil: number }
};

type TestCase_GeneratedValidator = TestModel<GeneratedInput, ValidResult>;

const testGenerated = async (input: GeneratedInput): Promise<ValidResult> => {
	const result = tsValidateResult(input, DBDef_Assets.generatedPropsValidator);
	return !result;
};

const runGeneratedTestCase = (testCase: TestCase_GeneratedValidator) => {
	return () => runSingleTestCase(testGenerated, testCase);
};

describe('DBDef_Assets — generated props validator', () => {
	it('Accepts valid generated props (minimal)', runGeneratedTestCase({
		input: {path: 'assets/abc123', bucketName: 'my-bucket', status: AssetStatus.Pending},
		result: true,
	}));

	it('Accepts valid generated props (all fields)', runGeneratedTestCase({
		input: {
			md5Hash: 'abc123def456',
			path: 'assets/abc123',
			bucketName: 'my-bucket',
			status: AssetStatus.Validated,
			public: true,
			metadata: {origin: 'upload'},
			signedUrl: {url: 'https://storage.example.com/file', validUntil: Date.now() + 60000},
		},
		result: true,
	}));

	it('Accepts optional md5Hash as undefined', runGeneratedTestCase({
		input: {md5Hash: undefined, path: 'assets/abc123', bucketName: 'my-bucket', status: AssetStatus.Pending},
		result: true,
	}));

	it('Accepts optional public as false', runGeneratedTestCase({
		input: {path: 'assets/abc123', bucketName: 'my-bucket', status: AssetStatus.Failed, public: false},
		result: true,
	}));
});

describe('DBDef_Assets — structure', () => {
	it('Has correct dbKey', () => {
		if (DBDef_Assets.dbKey !== 'assets')
			throw new Error(`Expected dbKey "assets", got "${DBDef_Assets.dbKey}"`);
	});

	it('Has version 1.0.0', () => {
		if (!DBDef_Assets.versions.includes('1.0.0'))
			throw new Error(`Expected versions to include "1.0.0", got ${JSON.stringify(DBDef_Assets.versions)}`);
	});

	it('Has generatedProps covering all generated fields', () => {
		const expected = ['signedUrl', 'md5Hash', 'path', 'bucketName', 'status', 'public', 'metadata'];
		const actual = DBDef_Assets.generatedProps as string[];
		for (const field of expected) {
			if (!actual.includes(field))
				throw new Error(`Missing generatedProp: ${field}`);
		}
	});
});
