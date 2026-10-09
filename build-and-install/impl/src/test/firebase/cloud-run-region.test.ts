import {expect} from 'chai';
import {tsValidateResult} from '@nu-art/ts-common';
import {resolveCloudRunRegion} from '../../main/units/implementations/firebase/common.js';
import {containerDeploymentValidator} from '../../main/units/discovery/resolvers/UnitMapper_FirebaseFunction.js';

const artifactRegistry = {region: 'us-central1', repository: 'web-apps', projectId: 'images-project'};

describe('containerDeployment Cloud Run region', () => {
	it('falls back to the Artifact Registry (image) region when runRegion is unset', () => {
		expect(resolveCloudRunRegion({artifactRegistry})).to.equal('us-central1');
	});

	it('uses runRegion for Cloud Run when set, independent of the image region', () => {
		expect(resolveCloudRunRegion({artifactRegistry, runRegion: 'europe-west1'})).to.equal('europe-west1');
		expect(artifactRegistry.region).to.equal('us-central1');
	});

	it('validates containerDeployment with and without runRegion', () => {
		const base = {artifactRegistry, imageName: 'booking-backend'};
		expect(tsValidateResult(base, containerDeploymentValidator)).to.be.undefined;
		expect(tsValidateResult({...base, runRegion: 'europe-west1'}, containerDeploymentValidator)).to.be.undefined;
	});

	it('rejects a non-string runRegion', () => {
		const invalid = {artifactRegistry, imageName: 'booking-backend', runRegion: 42};
		expect(tsValidateResult(invalid as any, containerDeploymentValidator)).to.not.be.undefined;
	});
});
