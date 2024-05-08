import {FirebasePackageConfig} from '../types';


export type DefaultType_ProjectEnvs = 'local' | 'dev' | 'staging' | 'prod';

const EnvName_local = 'local' as const;
const EnvName_dev = 'dev' as const;
const EnvName_staging = 'staging' as const;
const EnvName_prod = 'prod' as const;

const Default_ProjectEnvs = [
	EnvName_local,
	EnvName_dev,
	EnvName_staging,
	EnvName_prod,
];

export const Default_FunctionsIgnoreFiles = [
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
];

export const Default_ListOfFirebaseConfigFiles = [
	'database.rules.json',
	'firestore.indexes.json',
	'firestore.rules',
	'storage.rules',
];
export const Default_HostingConfig = {
	public: 'dist',
	rewrites: [
		{
			source: '**',
			destination: '/index.html'
		}
	]
};

export const Default_FirebaseProjectConfig: Omit<FirebasePackageConfig<DefaultType_ProjectEnvs>, 'projectIds' | 'basePort' | 'debugPort'> = {
	envs: Default_ProjectEnvs,
	pathToFirebaseConfig: '.firebase_config',
	functions: {
		ignore: Default_FunctionsIgnoreFiles,
	},
	hosting: Default_HostingConfig
};
