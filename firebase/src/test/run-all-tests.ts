import {ModuleBE_Auth} from '@nu-art/google-services/backend';
import {firestoreTests} from './firestore/tests';
import {FIREBASE_DEFAULT_PROJECT_ID} from './_main';


const config = {
	project_id: 'test',
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
};

ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});

firestoreTests.insert();

