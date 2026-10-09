import {expect} from 'chai';
import {resolveCloudRunRegion, resolveDatabaseURL} from '../../main/units/implementations/firebase/common.js';

const artifactRegistry = {region: 'us-central1', repository: 'web-apps', projectId: 'images-project'};

describe('FIREBASE_CONFIG databaseURL from the Cloud Run region', () => {
	it('us-central1 uses the firebaseio.com default instance URL', () => {
		expect(resolveDatabaseURL('my-project', 'us-central1')).to.equal('https://my-project-default-rtdb.firebaseio.com');
	});

	it('any other region uses the regional firebasedatabase.app URL', () => {
		expect(resolveDatabaseURL('my-project', 'europe-west1')).to.equal('https://my-project-default-rtdb.europe-west1.firebasedatabase.app');
		expect(resolveDatabaseURL('my-project', 'asia-southeast1')).to.equal('https://my-project-default-rtdb.asia-southeast1.firebasedatabase.app');
	});

	it('follows runRegion, not the image region', () => {
		const region = resolveCloudRunRegion({artifactRegistry, runRegion: 'europe-west1'});
		expect(resolveDatabaseURL('my-project', region)).to.equal('https://my-project-default-rtdb.europe-west1.firebasedatabase.app');
	});

	it('falls back to the image region when runRegion is unset', () => {
		const region = resolveCloudRunRegion({artifactRegistry});
		expect(resolveDatabaseURL('my-project', region)).to.equal('https://my-project-default-rtdb.firebaseio.com');
	});
});
