/*
 * @nu-art/google-services-backend - in-memory Secret Manager client
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {GeneratedSecret, ModuleBE_SecretManager_Class, SecretKey} from '../main/modules/ModuleBE_SecretManager.js';
import {MemorySecretManager} from '../main/modules/MemorySecretManager.js';

const projectId = 'mem-proj';

function managerWithMemory() {
	const manager = new ModuleBE_SecretManager_Class();
	manager.useClient(new MemorySecretManager());
	return manager;
}

describe('MemorySecretManager', () => {
	const previousProject = process.env.GCP_PROJECT_ID;

	afterEach(() => {
		if (previousProject === undefined)
			delete process.env.GCP_PROJECT_ID;
		else
			process.env.GCP_PROJECT_ID = previousProject;
	});

	it('returns undefined for a missing external secret and does not create one', async () => {
		process.env.GCP_PROJECT_ID = projectId;
		const {ModuleBE_SecretManager} = await import('../main/modules/ModuleBE_SecretManager.js');
		ModuleBE_SecretManager.useClient(new MemorySecretManager());

		const value = await new SecretKey<string>('resend-api-key').get();

		expect(value).to.equal(undefined);
	});

	it('stores a SecretKey fallback and reads that value back', async () => {
		process.env.GCP_PROJECT_ID = projectId;
		const {ModuleBE_SecretManager} = await import('../main/modules/ModuleBE_SecretManager.js');
		ModuleBE_SecretManager.useClient(new MemorySecretManager());
		const key = new SecretKey<string[]>('jwt-signer--account-session');

		const created = await key.get(['fallback-hex']);
		const read = await key.get(['other-fallback']);

		expect(created).to.deep.equal(['fallback-hex']);
		expect(read).to.deep.equal(['fallback-hex']);
	});

	it('keeps versions newest first', async () => {
		const manager = managerWithMemory();
		const spec = {projectId, key: 'jwt-signer--account-session'};

		await manager.updateSecret(spec, JSON.stringify(['one']));
		await manager.updateSecret(spec, JSON.stringify(['one', 'two']));

		const latest = await manager.getSecretValue({...spec, version: 'latest'});
		const first = await manager.getSecretValue({...spec, version: '1'});
		const versions = await manager.listEnabledVersions(spec);

		expect(JSON.parse(latest!)).to.deep.equal(['one', 'two']);
		expect(JSON.parse(first!)).to.deep.equal(['one']);
		expect(versions.map(version => version.name)).to.deep.equal([
			`projects/${projectId}/secrets/${spec.key}/versions/2`,
			`projects/${projectId}/secrets/${spec.key}/versions/1`,
		]);
	});

	it('creates a generated secret once and reads it back', async () => {
		const manager = managerWithMemory();
		const secret = new GeneratedSecret('embed-signing-key', projectId, manager);

		const first = await secret.get();
		const second = await secret.get();

		expect(first).to.match(/^[0-9a-f]{64}$/);
		expect(second).to.equal(first);
	});
});
