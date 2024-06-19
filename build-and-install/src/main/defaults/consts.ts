import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';

const CONST_FirebaseConfig = `${__dirname}/.firebase_config`;
const CONST_BackendProxy = `${__dirname}/backend-proxy`;

export const Const_FirebaseConfigKeys = [
	'databaseRules',
	'firestoreIndexesRules',
	'firestoreRules',
	'storageRules',
] as const;

export type ProjectConfig_DefaultFileRoutes = {
	firebaseConfig?: {[k in typeof Const_FirebaseConfigKeys[number]]?:string};
	backend?: {
		proxy?: string;
	}
}

export const Const_FirebaseDefaultsKeyToFile: { [k in typeof Const_FirebaseConfigKeys[number]]: string } = {
	databaseRules: 'database.rules.json',
	firestoreIndexesRules: 'firestore.indexes.json',
	firestoreRules: 'firestore.rules',
	storageRules: 'storage.rules',
};

export const Default_Files: ProjectConfig_DefaultFileRoutes = {
	firebaseConfig: {
		databaseRules: `${CONST_FirebaseConfig}/database.rules.json`,
		firestoreIndexesRules: `${CONST_FirebaseConfig}/firestore.indexes.json`,
		firestoreRules: `${CONST_FirebaseConfig}/firestore.rules`,
		storageRules: `${CONST_FirebaseConfig}/storage.rules`,
	},
	backend: {
		proxy: `${CONST_BackendProxy}/proxy._ts`
	}
};

const Default_OutputPath = './.trash';
export const Default_OutputFiles = {
	output: Default_OutputPath,
	outputLogs: `${Default_OutputPath}/logs`,
	runningStatus: `${Default_OutputPath}/running-status.json`
};

export const MemKey_DefaultFiles = new MemKey<typeof Default_Files>('default-files');

export type RunningStatus = {
	phaseKey: string,
	packageDependencyIndex?: number
};

export const MemKey_RunningStatus = new MemKey<RunningStatus>('running-status');