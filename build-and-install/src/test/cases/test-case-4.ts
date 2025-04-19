import {
	UnitMapper_NodeLib,
	UnitMapper_NodeProject,
	Unit_TypescriptLib,
	Unit_TypescriptProject,
	UnitMapper_FirebaseFunction,
	Unit_FirebaseFunctionsApp,
	Unit_FirebaseFunctionsApp_Config
} from '../_common';

export const TestCase4 = {
	description: 'Project with root, function app and two ts lib',
	input: {
		pathToProject: `${__dirname}/test-case-4`,
		rules: [UnitMapper_NodeLib, UnitMapper_NodeProject, UnitMapper_FirebaseFunction]
	},
	result: [
		new Unit_TypescriptProject({
			key: 'test-case-4',
			label: 'Test case 4 - root ts',
			relativePath: '.',
			fullPath: `${__dirname}/test-case-4`,
			isRoot: true,
		}),
		new Unit_TypescriptLib({
			key: 'test-case-4--lib-1',
			label: 'Test case 4 - lib-1 ts',
			relativePath: './lib-1',
			fullPath: `${__dirname}/test-case-4/lib-1`,
			output: 'dist'
		}),
		new Unit_TypescriptLib({
			key: 'test-case-4--lib-2',
			label: 'Test case 4 - lib-2 ts',
			relativePath: './lib-2',
			fullPath: `${__dirname}/test-case-4/lib-2`,
			output: 'dist'
		}),
		new Unit_FirebaseFunctionsApp({
			basePort: 1,
			debugPort: 2,
			key: 'test-case-4--function-1',
			label: 'Test case 4 - function-1',
			relativePath: './func-app-1',
			fullPath: `${__dirname}/test-case-4/func-app-1`,
			output: 'dist',
			envs: {
				local: {
					defaultConfig: 'default',
					envConfig: 'local',
					isLocal: true,
					projectId: 'beamz-dev',
				}
			},
			pathToFirebaseConfig: '.firebase_config',
			sslCert: '.ssl/cert.pem',
			sslKey: '.ssl/key.pem',
		} as Unit_FirebaseFunctionsApp_Config)
	]
};