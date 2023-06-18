import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';
import {FIREBASE_DEFAULT_PROJECT_ID} from '../../../main/backend';
import {TestSuit_FirestoreV2_Insert} from './insert';


const config = {
	project_id: 'test',
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
};

ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});

describe('Firestore v2 - Insert', () => {
	testSuiteTester(TestSuit_FirestoreV2_Insert);
});
