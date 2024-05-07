import {MemKey} from '@nu-art/ts-common/mem-storage/MemStorage';

const CONST_FirebaseConfig = `${__dirname}/.firebase_config`;
const CONST_BackendProxy = `${__dirname}/backend-proxy`;

export const Const_FirebaseDefaultsKeyToFile: { [k in keyof typeof Default_Files['firebaseConfig']]: string } = {
	databaseRules: 'database.rules.json',
	firestoreIndexesRules: 'firestore.indexes.json',
	firestoreRules: 'firestore.rules',
	storageRules: 'storage.rules',
};

export const Default_Files = {
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

export const Const_FirebaseConfigKeys: (keyof typeof Default_Files['firebaseConfig'])[] = [
	'databaseRules',
	'firestoreIndexesRules',
	'firestoreRules',
	'storageRules',
];

export const MemKey_DefaultFiles = new MemKey<typeof Default_Files>('default-files');