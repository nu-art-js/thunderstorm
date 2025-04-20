import {UnitMapper_NodeProject, Unit_NodeProject} from '../_common';

export const TestCase1 = {
	description: 'Project with root',
	input: {
		pathToProject: `${__dirname}/test-case-1`,
		rules: [UnitMapper_NodeProject]
	},
	result: [new Unit_NodeProject({
		key: 'test-case-1',
		label: 'Test case 1 - root ts',
		relativePath: '.',
		fullPath: `${__dirname}/test-case-1`,
		isRoot: true,
	})]
};