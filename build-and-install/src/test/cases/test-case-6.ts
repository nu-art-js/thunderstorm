import {
	Unit_FirebaseFunctionsApp, Unit_FirebaseFunctionsApp_Config,
	Unit_FirebaseHostingApp,
	Unit_TypescriptLib,
	Unit_TypescriptProject, UnitMapper_FirebaseFunction,
	UnitMapper_FirebaseHosting,
	UnitMapper_NodeLib,
	UnitMapper_NodeProject
} from '../_common';

export const TestCase6 = {
	description: 'Project with root, function app, hosting app and two ts lib',
	input: {
		pathToProject: `${__dirname}/test-case-6`,
		rules: [UnitMapper_NodeLib, UnitMapper_NodeProject, UnitMapper_FirebaseHosting, UnitMapper_FirebaseFunction]
	},
	result: [
		new Unit_TypescriptProject({
			key: 'test-case-6',
			label: 'Test case 6 - root ts',
			relativePath: '.',
			fullPath: `${__dirname}/test-case-6`,
			isRoot: true,
		}),
		new Unit_TypescriptLib({
			key: 'test-case-6--lib-1',
			label: 'Test case 6 - lib-1 ts',
			relativePath: './lib-1',
			fullPath: `${__dirname}/test-case-6/lib-1`,
			output: 'dist'
		}),
		new Unit_TypescriptLib({
			key: 'test-case-6--lib-2',
			label: 'Test case 6 - lib-2 ts',
			relativePath: './lib-2',
			fullPath: `${__dirname}/test-case-6/lib-2`,
			output: 'dist'
		}),
		new Unit_FirebaseFunctionsApp({
			basePort: 1,
			debugPort: 2,
			key: 'test-case-6--function-1',
			label: 'Test case 6 - function-1',
			relativePath: './func-app-1',
			fullPath: `${__dirname}/test-case-6/func-app-1`,
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
		} as Unit_FirebaseFunctionsApp_Config),
		new Unit_FirebaseHostingApp({
			servingPort: 1,
			key: 'test-case-6--hosting-1',
			label: 'Test case 6 - hosting-1',
			relativePath: './hosting-app-1',
			fullPath: `${__dirname}/test-case-6/hosting-app-1`,
			output: 'dist',
			envs: {
				local: {
					isLocal: true,
					configUrl: 'https://localhost:xxx:/path/to/config.json',
					projectId: 'beamz-dev',
				}
			},
		}),

	]
};