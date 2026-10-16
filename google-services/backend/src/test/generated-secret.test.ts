/*
 * @nu-art/google-services-backend - GCP clients, including Secret Manager
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {ThisShouldNotHappenException, isErrorOfType} from '@nu-art/ts-common';
import {
	GeneratedSecret,
	ModuleBE_SecretManager_Class,
	SecretKey,
	type SecretManagerApi
} from '../main/modules/ModuleBE_SecretManager.js';

type Stored = {payload?: string};

class FakeSecretManager implements SecretManagerApi {
	readonly secrets = new Map<string, Stored>();
	readonly created: string[] = [];
	readonly added: string[] = [];
	accesses = 0;
	/** When set, accessSecretVersion throws this gRPC status instead of reading. */
	accessStatus?: number;
	/** createSecret throws ALREADY_EXISTS even when the name is new. */
	createAlreadyExists = false;

	accessSecretVersion = async (request: {name: string}) => {
		this.accesses++;
		if (this.accessStatus !== undefined)
			throw {code: this.accessStatus};

		const id = request.name.replace(/\/versions\/.*$/, '');
		const stored = this.secrets.get(id);
		if (!stored?.payload)
			throw {code: 5};

		return [{payload: {data: Buffer.from(stored.payload)}}];
	};

	getSecret = async () => {
		throw {code: 5};
	};

	createSecret = async (request: {parent: string; secretId: string}) => {
		const name = `${request.parent}/secrets/${request.secretId}`;
		if (this.createAlreadyExists || this.secrets.has(name))
			throw {code: 6};

		this.secrets.set(name, {});
		this.created.push(name);
		return [{name}];
	};

	addSecretVersion = async (request: {parent: string; payload: {data: Buffer}}) => {
		this.secrets.set(request.parent, {payload: request.payload.data.toString('utf8')});
		this.added.push(request.parent);
		return [];
	};

	listSecretVersions = async () => {
		return [[]];
	};

	getSecretVersion = async () => {
		return [{}];
	};

	deleteSecret = async () => {
		return [];
	};
}

const projectId = 'proj';
const secretName = (key: string) => `projects/${projectId}/secrets/${key}`;

function managerWith(fake: FakeSecretManager) {
	const manager = new ModuleBE_SecretManager_Class();
	manager.useClient(fake);
	return manager;
}

describe('GeneratedSecret', () => {
	const previousProject = process.env.GCP_PROJECT_ID;

	afterEach(() => {
		if (previousProject === undefined)
			delete process.env.GCP_PROJECT_ID;
		else
			process.env.GCP_PROJECT_ID = previousProject;
	});

	it('does not call Secret Manager when it is constructed', () => {
		const fake = new FakeSecretManager();
		const manager = managerWith(fake);
		new GeneratedSecret('embed-signing-key', projectId, manager);
		expect(fake.accesses).to.equal(0);
		expect(fake.created).to.deep.equal([]);
	});

	it('creates a random value on first use and caches it', async () => {
		const fake = new FakeSecretManager();
		const manager = managerWith(fake);
		const secret = new GeneratedSecret('embed-signing-key', projectId, manager);

		const first = await secret.get();
		const second = await secret.get();

		expect(first).to.match(/^[0-9a-f]{64}$/);
		expect(second).to.equal(first);
		expect(fake.created).to.deep.equal([secretName('embed-signing-key')]);
		expect(fake.added).to.deep.equal([secretName('embed-signing-key')]);
		expect(fake.secrets.get(secretName('embed-signing-key'))?.payload).to.equal(first);
		expect(fake.accesses).to.equal(2);
	});

	it('reads an existing raw signing key and does not create', async () => {
		const fake = new FakeSecretManager();
		const raw = 'a'.repeat(40);
		fake.secrets.set(secretName('embed-signing-key'), {payload: raw});
		const manager = managerWith(fake);

		const value = await new GeneratedSecret('embed-signing-key', projectId, manager).get();

		expect(value).to.equal(raw);
		expect(fake.created).to.deep.equal([]);
		expect(fake.added).to.deep.equal([]);
	});

	it('reads an existing JSON-string pepper and does not create', async () => {
		const fake = new FakeSecretManager();
		fake.secrets.set(secretName('rate-limit--pepper'), {payload: JSON.stringify('pepper-value')});
		const manager = managerWith(fake);

		const value = await new GeneratedSecret('rate-limit--pepper', projectId, manager).get();

		expect(value).to.equal('pepper-value');
		expect(fake.created).to.deep.equal([]);
	});

	it('reads the value another instance already created', async () => {
		const fake = new FakeSecretManager();
		fake.createAlreadyExists = true;
		let reads = 0;
		const existing = 'b'.repeat(64);
		const original = fake.accessSecretVersion;
		fake.accessSecretVersion = async request => {
			reads++;
			if (reads === 1)
				throw {code: 5};

			fake.secrets.set(request.name.replace(/\/versions\/.*$/, ''), {payload: existing});
			return original(request);
		};
		const manager = managerWith(fake);

		const value = await new GeneratedSecret('booking-link-signing', projectId, manager).get();

		expect(value).to.equal(existing);
		expect(fake.created).to.deep.equal([]);
		expect(fake.added).to.deep.equal([]);
	});

	it('one process creates the secret once when two callers race', async () => {
		const fake = new FakeSecretManager();
		const manager = managerWith(fake);
		const spec = {projectId, key: 'embed-signing-key'};

		const [a, b] = await Promise.all([
			manager.getOrCreateGenerated(spec),
			manager.getOrCreateGenerated(spec),
		]);

		expect(a).to.equal(b);
		expect(a).to.match(/^[0-9a-f]{64}$/);
		expect(fake.created).to.have.length(1);
		expect(fake.added).to.have.length(1);
	});

	it('does not create when Secret Manager refuses the read', async () => {
		const fake = new FakeSecretManager();
		fake.accessStatus = 7;
		const manager = managerWith(fake);

		try {
			await new GeneratedSecret('embed-signing-key', projectId, manager).get();
			expect.fail('expected the read to fail');
		} catch (err: unknown) {
			expect(isErrorOfType(err, ThisShouldNotHappenException), String(err)).to.not.equal(undefined);
		}

		expect(fake.created).to.deep.equal([]);
		expect(fake.added).to.deep.equal([]);
	});

	it('leaves an external secret missing', async () => {
		process.env.GCP_PROJECT_ID = projectId;
		const fake = new FakeSecretManager();
		const {ModuleBE_SecretManager} = await import('../main/modules/ModuleBE_SecretManager.js');
		ModuleBE_SecretManager.useClient(fake);

		const value = await new SecretKey<string>('resend-api-key').get();

		expect(value).to.equal(undefined);
		expect(fake.created).to.deep.equal([]);
		expect(fake.added).to.deep.equal([]);
	});
});
