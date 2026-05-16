import {tsValidateResult} from '@nu-art/ts-common';
import {runSingleTestCase, TestModel} from '@nu-art/testalot';
import {DBDef_Topic} from '../../main/topic/db-def.js';

type TopicModifiableInput = {
	anchor: { dbKey: string; id: string };
};

type ValidResult = boolean;
type TestCase_TopicValidator = TestModel<TopicModifiableInput, ValidResult>;

const testModifiable = async (input: TopicModifiableInput): Promise<ValidResult> => {
	const result = tsValidateResult(input, DBDef_Topic.modifiablePropsValidator);
	return !result;
};

const runTestCase = (testCase: TestCase_TopicValidator) => {
	return () => runSingleTestCase(testModifiable, testCase);
};

const validId = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4';

describe('DBDef_Topic — modifiable props validator', () => {
	it('Accepts valid anchor', runTestCase({
		input: {anchor: {dbKey: 'tasks', id: validId}},
		result: true,
	}));

	it('Accepts empty dbKey (tsValidateString allows any length by default)', runTestCase({
		input: {anchor: {dbKey: '', id: validId}},
		result: true,
	}));

	it('Rejects empty id', runTestCase({
		input: {anchor: {dbKey: 'tasks', id: ''}},
		result: false,
	}));

	it('Accepts long dbKey', runTestCase({
		input: {anchor: {dbKey: 'my-very-long-collection-name', id: validId}},
		result: true,
	}));
});

describe('DBDef_Topic — structure', () => {
	it('Has correct dbKey', () => {
		if (DBDef_Topic.dbKey !== 'topics')
			throw new Error(`Expected dbKey "topics", got "${DBDef_Topic.dbKey}"`);
	});

	it('Has version 1.0.0', () => {
		if (!DBDef_Topic.versions.includes('1.0.0'))
			throw new Error(`Expected versions to include "1.0.0", got ${JSON.stringify(DBDef_Topic.versions)}`);
	});

	it('Has uniqueKeys for anchor.dbKey and anchor.id', () => {
		const keys = DBDef_Topic.uniqueKeys as string[];
		if (!keys.includes('anchor.dbKey'))
			throw new Error('Missing uniqueKey: anchor.dbKey');

		if (!keys.includes('anchor.id'))
			throw new Error('Missing uniqueKey: anchor.id');
	});

	it('Has empty generatedPropsValidator', () => {
		const genValidator = DBDef_Topic.generatedPropsValidator;
		if (typeof genValidator !== 'object')
			throw new Error(`Expected generatedPropsValidator to be an object, got ${typeof genValidator}`);

		if (Object.keys(genValidator).length > 0)
			throw new Error(`Expected empty generatedPropsValidator, got keys: ${Object.keys(genValidator).join(', ')}`);
	});

	it('Has correct entityName', () => {
		if (DBDef_Topic.entityName !== 'Topic')
			throw new Error(`Expected entityName "Topic", got "${DBDef_Topic.entityName}"`);
	});
});
