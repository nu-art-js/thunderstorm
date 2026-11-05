/*
 * @nu-art/google-services-backend - GCP clients, including Cloud KMS
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ImplementationMissingException} from '@nu-art/ts-common';
import {KmsClient, ModuleBE_KMS} from '../main/modules/ModuleBE_KMS.js';

const context = {projectId: 'kms-test', locationId: 'global'};

function grpcError(code: number): Error {
	const error = new Error(`grpc ${code}`);
	return Object.assign(error, {code});
}

function client(overrides: Partial<KmsClient> = {}): KmsClient & { created: string[] } {
	const created: string[] = [];
	const base: KmsClient = {
		locationPath: (projectId, locationId) => `projects/${projectId}/locations/${locationId}`,
		keyRingPath: (projectId, locationId, keyRingId) => `projects/${projectId}/locations/${locationId}/keyRings/${keyRingId}`,
		cryptoKeyPath: (projectId, locationId, keyRingId, keyId) => `projects/${projectId}/locations/${locationId}/keyRings/${keyRingId}/cryptoKeys/${keyId}`,
		cryptoKeyVersionPath: (projectId, locationId, keyRingId, keyId, versionId) => `projects/${projectId}/locations/${locationId}/keyRings/${keyRingId}/cryptoKeys/${keyId}/cryptoKeyVersions/${versionId}`,
		getKeyRing: async () => {
			throw grpcError(5);
		},
		createKeyRing: async () => {
			created.push('keyRing');
			throw grpcError(6);
		},
		getCryptoKey: async () => {
			throw grpcError(5);
		},
		listCryptoKeyVersions: async () => [[]],
		createCryptoKeyVersion: async () => {
			created.push('version');
			return [{name: 'cryptoKeyVersions/1'}];
		},
		createCryptoKey: async () => {
			created.push('cryptoKey');
			throw grpcError(6);
		},
		getPublicKey: async () => [{pem: 'pem'}],
		asymmetricSign: async () => [{signature: Buffer.from('sig')}],
	};
	const fake = {...base, ...overrides, created};
	return fake;
}

describe('ModuleBE_KMS', () => {
	const previousProject = process.env.GCP_PROJECT_ID;
	const previousCloud = process.env.GCLOUD_PROJECT;

	afterEach(() => {
		if (previousProject === undefined)
			delete process.env.GCP_PROJECT_ID;
		else
			process.env.GCP_PROJECT_ID = previousProject;
		if (previousCloud === undefined)
			delete process.env.GCLOUD_PROJECT;
		else
			process.env.GCLOUD_PROJECT = previousCloud;
	});

	it('rejects a key ring when no project id is available', async () => {
		delete process.env.GCP_PROJECT_ID;
		delete process.env.GCLOUD_PROJECT;
		ModuleBE_KMS.useClient(client());

		try {
			await ModuleBE_KMS.ensureKeyRing('ring');
			expect.fail('ensureKeyRing resolved without a project id');
		} catch (err) {
			expect(err).to.be.instanceOf(ImplementationMissingException);
		}
	});

	it('treats a create race as a key ring that exists', async () => {
		const fake = client();
		ModuleBE_KMS.useClient(fake);

		await ModuleBE_KMS.ensureKeyRing('ring', context);

		expect(fake.created).to.deep.equal(['keyRing']);
	});

	it('does not create a key ring that already exists', async () => {
		const fake = client({
			getKeyRing: async () => [{}],
		});
		ModuleBE_KMS.useClient(fake);

		await ModuleBE_KMS.ensureKeyRing('ring', context);

		expect(fake.created).to.deep.equal([]);
	});
});
