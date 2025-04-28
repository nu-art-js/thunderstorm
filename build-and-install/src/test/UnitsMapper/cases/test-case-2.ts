import {
	UnitMapper_NodeProject,
	UnitMapper_NodeLib,
	Unit_NodeLib,
	Unit_NodeProject
} from '../../_common';

export const TestCase2 = {
	description: 'Project with root and one ts lib',
	input: {
		pathToProject: `${__dirname}/test-case-2`,
		rules: [UnitMapper_NodeLib, UnitMapper_NodeProject]
	},
	result: [
		new Unit_NodeProject({
			key: 'test-case-2',
			label: 'Test case 2 - root ts',
			relativePath: '.',
			fullPath: `${__dirname}/test-case-2`,
			isRoot: true,
			dependencies: {}
		}),
		new Unit_NodeLib({
			key: 'test-case-2--lib-1',
			label: 'Test case 2 - lib-1 ts',
			relativePath: './lib-1',
			fullPath: `${__dirname}/test-case-2/lib-1`,
			output: 'dist',
			dependencies: {}
		})
	]
};