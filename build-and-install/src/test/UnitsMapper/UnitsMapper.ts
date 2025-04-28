import {expect} from 'chai';
import {UnitsMapper, BaseUnit} from '../_common';
import {Input, Result, TestSuite_UnitsMapper} from './types';
import {sortArray} from '@nu-art/ts-common';
import {TestCase1} from './cases/test-case-1';
import {TestCase2} from './cases/test-case-2';
import {TestCase3} from './cases/test-case-3';
import {TestCase4} from './cases/test-case-4';
import {TestCase5} from './cases/test-case-5';
import {TestCase6} from './cases/test-case-6';


const TestCase_UnitsMapper: TestSuite_UnitsMapper['testcases'] = [
	TestCase1,
	TestCase2,
	TestCase3,
	TestCase4,
	TestCase5,
	TestCase6
];

const test = async (input: Input): Promise<Result> => {
	return await new UnitsMapper()
		.addRules(...input.rules)
		.resolveUnits(input.pathToProject);
};

export const Tests_UnitsMapper: TestSuite_UnitsMapper = {
	label: 'UnitsMapper',
	testcases: TestCase_UnitsMapper,
	processor: async (testCase) => {
		const input = testCase.input;

		// since base unit is a class there is a need to check and compare the class instance type and the config of the BaseUnit
		const compareBaseUnits = (result: BaseUnit<any>[], expected: BaseUnit<any>[]) => {
			result = sortArray(result, unit => unit.config.relativePath);
			expected = sortArray(expected, unit => unit.config.relativePath);
			for (let i = 0; i < expected.length; i++) {
				const expectedUnit = expected[i];
				const resultUnit = result[i];

				expect(resultUnit).to.not.be.undefined;

				// Check if both are instances of the same class
				expect(resultUnit.constructor.name).to.equal(expectedUnit.constructor.name);

				// Check if their configurations match (assuming `config` is a property of BaseUnit)
				expect(resultUnit['config']).to.deep.equal(expectedUnit['config']);
			}
		};

// Call the comparison helper function
		const output = await test(input);
		if ('result' in testCase)
			compareBaseUnits(output, testCase.result);
	}
};