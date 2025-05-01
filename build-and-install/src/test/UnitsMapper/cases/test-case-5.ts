import {
	Unit_FirebaseHostingApp,
	Unit_NodeLib,
	Unit_NodeProject,
	UnitMapper_FirebaseHosting,
	UnitMapper_NodeLib,
	UnitMapper_NodeProject
} from '../../_common';

export const TestCase5 = {
	description: 'Project with root, hosting app and two ts lib',
	input: {
		pathToProject: `${__dirname}/test-case-5`,
		rules: [UnitMapper_NodeLib, UnitMapper_NodeProject, UnitMapper_FirebaseHosting]
	},
	result: [
		new Unit_NodeProject({
			key: 'test-case-5',
			label: 'Test case 5 - root ts',
			relativePath: '.',
			fullPath: `${__dirname}/test-case-5`,
			isRoot: true,
			dependencies: {},
			customESLintConfig: false,
		}),
		new Unit_NodeLib({
			key: 'test-case-5--lib-1',
			label: 'Test case 5 - lib-1 ts',
			relativePath: './lib-1',
			fullPath: `${__dirname}/test-case-5/lib-1`,
			output: 'dist',
			dependencies: {},
			customESLintConfig: false,
		}),
		new Unit_NodeLib({
			key: 'test-case-5--lib-2',
			label: 'Test case 5 - lib-2 ts',
			relativePath: './lib-2',
			fullPath: `${__dirname}/test-case-5/lib-2`,
			output: 'dist',
			dependencies: {},
			customESLintConfig: false,
		}),
		new Unit_FirebaseHostingApp({
			servingPort: 1,
			key: 'test-case-5--hosting-1',
			label: 'Test case 5 - hosting-1',
			relativePath: './hosting-app-1',
			fullPath: `${__dirname}/test-case-5/hosting-app-1`,
			output: 'dist',
			envs: {
				local: {
					isLocal: true,
					configUrl: 'https://localhost:xxx:/path/to/config.json',
					projectId: 'beamz-dev',
				}
			},
			dependencies: {},
			customESLintConfig: false,
		})
	]
};