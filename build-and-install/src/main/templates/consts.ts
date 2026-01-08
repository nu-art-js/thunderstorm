import {fileURLToPath} from 'node:url';
import {dirname} from 'node:path';

// ESM-safe replacements for __filename/__dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const CONST_FirebaseConfig = `${__dirname}/firebase/config`;
const CONST_FirebaseFunctions = `${__dirname}/firebase/functions`;
const CONST_BackendProxy = `${__dirname}/backend/proxy`;

export const Const_FirebaseConfigKeys = [
	'databaseRules',
	'firestoreIndexesRules',
	'firestoreRules',
	'storageRules',
] as const;

export type ProjectConfig_DefaultFileRoutes = {
	firebaseConfig?: { [k in typeof Const_FirebaseConfigKeys[number]]?: string };
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

/**
 * Template file paths for Firebase Functions container builds.
 * These are used when no custom templates are specified in baiConfig.
 */
export const FunctionBuildTemplateFiles = {
	dockerfile: `${CONST_FirebaseFunctions}/dockerfile`,
	cloudbuildYaml: `${CONST_FirebaseFunctions}/cloudbuild.yaml`,
	serviceYaml: `${CONST_FirebaseFunctions}/service.yaml`,
};

const Default_OutputPath = './.trash';
export const Default_OutputFiles = {
	output: Default_OutputPath,
	outputLogs: `${Default_OutputPath}/logs`,
	runningStatus: `${Default_OutputPath}/running-status.json`
};
