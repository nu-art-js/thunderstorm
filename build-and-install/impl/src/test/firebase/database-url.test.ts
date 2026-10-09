import {expect} from 'chai';
import {tsValidateResult} from '@nu-art/ts-common';
import {resolveDatabaseURL} from '../../main/units/implementations/firebase/common.js';
import {envConfigValidator} from '../../main/units/discovery/resolvers/UnitMapper_FirebaseFunction.js';

describe('Firebase function env databaseURL (FIREBASE_CONFIG on Cloud Run)', () => {
	it('falls back to the us-central1 default instance URL when databaseURL is unset', () => {
		expect(resolveDatabaseURL({projectId: 'my-project'})).to.equal('https://my-project-default-rtdb.firebaseio.com');
	});

	it('uses the env databaseURL when set (e.g. a europe-west1 instance)', () => {
		const databaseURL = 'https://my-project-default-rtdb.europe-west1.firebasedatabase.app';
		expect(resolveDatabaseURL({projectId: 'my-project', databaseURL})).to.equal(databaseURL);
	});

	it('validates an env with and without databaseURL', () => {
		expect(tsValidateResult({projectId: 'my-project'}, envConfigValidator)).to.be.undefined;
		expect(tsValidateResult({projectId: 'my-project', databaseURL: 'https://my-project-default-rtdb.europe-west1.firebasedatabase.app'}, envConfigValidator)).to.be.undefined;
	});

	it('rejects a non-string databaseURL', () => {
		expect(tsValidateResult({projectId: 'my-project', databaseURL: 42} as any, envConfigValidator)).to.not.be.undefined;
	});
});
