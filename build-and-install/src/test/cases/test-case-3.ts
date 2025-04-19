import {
	UnitMapper_NodeLib,
	UnitMapper_NodeProject,
	Unit_TypescriptLib,
	Unit_TypescriptProject
} from '../_common';

export const TestCase3 = {
	description: 'Project with root and two ts lib',
	input: {
		pathToProject: `${__dirname}/test-case-3`,
		rules: [UnitMapper_NodeLib, UnitMapper_NodeProject]
	},
	result: [
		new Unit_TypescriptProject({
			key: 'test-case-3',
			label: 'Test case 3 - root ts',
			relativePath: '.',
			fullPath: `${__dirname}/test-case-3`,
			isRoot: true,
		}),
		new Unit_TypescriptLib({
			key: 'test-case-3--lib-1',
			label: 'Test case 3 - lib-1 ts',
			relativePath: './lib-1',
			fullPath: `${__dirname}/test-case-3/lib-1`,
			output: 'dist'
		}),
		new Unit_TypescriptLib({
			key: 'test-case-3--lib-2',
			label: 'Test case 3 - lib-2 ts',
			relativePath: './lib-2',
			fullPath: `${__dirname}/test-case-3/lib-2`,
			output: 'dist'
		})
	]
};