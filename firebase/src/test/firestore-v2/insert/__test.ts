import {testSuiteTester} from '@nu-art/ts-common/testing/consts';
import {ModuleBE_Auth} from '@nu-art/google-services/backend';
import {FIREBASE_DEFAULT_PROJECT_ID, ModuleBE_Firebase} from '../../../main/backend';
import {TestSuit_FirestoreV2_Insert} from './insert';
import {generateHex} from "@nu-art/ts-common";


const config = {
	project_id: generateHex(4),
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
};

ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});
export const firestore = ModuleBE_Firebase.createAdminSession().getFirestoreV2();

describe('Firestore v2 - Insert', () => {
	testSuiteTester(TestSuit_FirestoreV2_Insert);
});
