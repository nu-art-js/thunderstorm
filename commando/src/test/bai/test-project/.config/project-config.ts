import {
	PackageType_FirebaseFunctionsApp,
	PackageType_FirebaseHostingApp,
	PackageType_InfraLib,
	PackageType_ProjectLib,
	PackageType_Sourceless,
	ProjectConfig
} from '../../core/types';

const config: ProjectConfig = {
	packages: [
		{
			type: PackageType_Sourceless,
			path: '.',
		},
		{
			type: PackageType_InfraLib,
			path: './pack1',
			sources: ['main', 'sw', 'test'],
			output: '/dist'
		},
		{
			type: PackageType_ProjectLib,
			path: './pack2',
			output: 'pack2/../dist',
			customTsConfig: true,
		},
		{
			type: PackageType_ProjectLib,
			path: './pack3',
			output: 'dist'
		},
		{
			type: PackageType_ProjectLib,
			path: './pack4',
			output: './dist'
		},
		{
			type: PackageType_FirebaseHostingApp,
			path: './pack5',
			output: '../pack5/dist',
			config: {
				rc: {
					dev: {
						projects: {
							default: 'quai-md-dev',
						},
						targets: {
							'quai-md-dev': {
								hosting: {
									'advisor': ['quai-advisor-dev'],
									'knowledge-manager': ['quai-md-dev'],
								}
							}
						}
					},
					staging: 'quai-md-staging',
					prod: 'quai-md'
				},
				json: {
					hosting: [
						{
							public: 'app-frontend/dist',
							target: 'knowledge-manager',
							rewrites: [
								{
									source: '**',
									destination: '/index.html',
								}
							]
						},
						{
							public: 'app-advisor/dist',
							target: 'advisor',
							rewrites: [
								{
									source: '**',
									destination: 'index.html',
								}
							],
							headers: [],
						}
					]
				}
			}
		},
		{
			type: PackageType_FirebaseFunctionsApp,
			path: './pack6',
			output: 'dist',
			config: {
				rc: {
					dev: {
						projects: {
							default: 'quai-md-dev',
						}
					},
					staging: 'quai-md-staging',
					prod: 'quai-md',
				},
				projectId: '',
				json: {
					ignore: [
						'src',
						'.config',
						'dist-test',
						'deploy.js',
						'node_modules',
						'firebase-export-*',
						'launch-server.sh',
						'ports-release.sh',
						'ui-debug.log',
						'database-debug.log',
						'firestore-debug.log',
						'firebase-debug.log'
					]
				}
			}
		}
	],
	params: {
		'MOMENT_PKG_VERSION': '^2.29.4',
		'FIREBASE_PKG_VERSION': '^10.7.1',
		'FIREBASE_AUTH_PKG_VERSION': '0.21.5',
		'FIREBASE_ADMIN_PKG_VERSION': '11.9.0',
		'FIREBASE_FUNCTIONS_PKG_VERSION': '4.4.1',
		'REACT_PKG_VERSION': '^18.2.0',
		'REACT_DOM_PKG_VERSION': '^18.2.0',
		'REACT_ROUTER_DOM_PKG_VERSION': '^6.9.0',
		'REACT_TYPES_VERSION': '^18.0.29',
		'REACT_DOM_TYPES_VERSION': '^18.0.11',
		'REACT_ROUTER_TYPES_VERSION': '^5.1.20',
		'REACT_ROUTER_DOM_TYPES_VERSION': '^5.3.3',
		'QS_TYPES_VERSION': '^6.5.2',
		'NODE_TYPES_VERSION': '^18.15.0',
		'EXPRESS_PKG_VERSION': '^4.18.2',
		'EXPRESS_TYPES_VERSION': '^4.17.17',
		'EXPRESS_SERVE_STATIC_CORE_TYPES_VERSION': '^4.17.0',
		'REACT_KONVA_PKG_VERSION': '^18.2.10',
		'TYPESCRIPT_PKG_VERSION': '5.0.4',
		'ANTLR_PKG_VERSION': '0.5.0-alpha.4',
		'BUILD_MAIN_COMMAND': 'tsc -p \\\\"./src/main/tsconfig.json\\\\" --rootDir \\\\".\\\\" --outDir \\\\"./dist\\\\"',
		'BUILD_CLEAN_MAIN_COMMAND': 'rm -rf ./dist',
		'LINT_MAIN_COMMAND': 'lint'
	},
};

export default config;