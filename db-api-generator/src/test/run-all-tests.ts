import {FIREBASE_DEFAULT_PROJECT_ID} from '@nu-art/firebase/backend';
import {firestoreTests} from './tests/tests';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';


const config = {
	project_id: 'test',
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
};

ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});

firestoreTests.query();
firestoreTests.insert();
firestoreTests.queryUnique();

