import {ModuleBE_Auth} from '@thunder-storm/google-services/backend';
import {FIREBASE_DEFAULT_PROJECT_ID} from './_main';


const config = {
	project_id: 'test',
	databaseURL: 'http://localhost:8102/?ns=quai-md-dev',
};

ModuleBE_Auth.setDefaultConfig({auth: {[FIREBASE_DEFAULT_PROJECT_ID]: config}});

