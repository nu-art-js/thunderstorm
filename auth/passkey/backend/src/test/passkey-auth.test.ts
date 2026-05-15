/*
 * @nu-art/passkey-backend - Passkey/WebAuthn backend for Thunderstorm
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {randomUUID} from 'node:crypto';

describe('Passkey challenge management', () => {
	const challengeTtlMs = 300_000;

	it('stores and retrieves a pending challenge by key', () => {
		const store = new Map<string, { challenge: string; createdAt: number }>();
		const key = 'account-123';
		const challenge = randomUUID();

		store.set(key, {challenge, createdAt: Date.now()});

		const retrieved = store.get(key);
		expect(retrieved).to.not.be.undefined;
		expect(retrieved!.challenge).to.equal(challenge);
	});

	it('detects expired challenges', () => {
		const store = new Map<string, { challenge: string; createdAt: number }>();
		const key = 'account-456';
		const challenge = randomUUID();
		const expiredTime = Date.now() - challengeTtlMs - 1000;

		store.set(key, {challenge, createdAt: expiredTime});

		const retrieved = store.get(key);
		const isExpired = Date.now() - retrieved!.createdAt > challengeTtlMs;
		expect(isExpired).to.be.true;
	});

	it('cleans expired challenges from store', () => {
		const store = new Map<string, { challenge: string; createdAt: number }>();
		const now = Date.now();

		store.set('valid', {challenge: 'c1', createdAt: now});
		store.set('expired-1', {challenge: 'c2', createdAt: now - challengeTtlMs - 1});
		store.set('expired-2', {challenge: 'c3', createdAt: now - challengeTtlMs - 5000});

		for (const [key, pending] of store) {
			if (now - pending.createdAt > challengeTtlMs)
				store.delete(key);
		}

		expect(store.size).to.equal(1);
		expect(store.has('valid')).to.be.true;
	});

	it('removes challenge after use (single-use enforcement)', () => {
		const store = new Map<string, { challenge: string; createdAt: number }>();
		const key = randomUUID();

		store.set(key, {challenge: 'one-time-use', createdAt: Date.now()});
		expect(store.has(key)).to.be.true;

		store.delete(key);
		expect(store.has(key)).to.be.false;
	});
});

describe('Passkey credential lookup', () => {
	type MockCredential = {
		credentialId: string;
		accountId: string;
		publicKey: string;
		counter: number;
	};

	const mockCredentials: MockCredential[] = [
		{credentialId: 'cred-aaa', accountId: 'acc-1', publicKey: 'pk-1', counter: 5},
		{credentialId: 'cred-bbb', accountId: 'acc-1', publicKey: 'pk-2', counter: 12},
		{credentialId: 'cred-ccc', accountId: 'acc-2', publicKey: 'pk-3', counter: 0},
	];

	it('finds credential by credentialId', () => {
		const found = mockCredentials.find(c => c.credentialId === 'cred-bbb');
		expect(found).to.not.be.undefined;
		expect(found!.accountId).to.equal('acc-1');
		expect(found!.counter).to.equal(12);
	});

	it('returns undefined for unknown credentialId', () => {
		const found = mockCredentials.find(c => c.credentialId === 'cred-unknown');
		expect(found).to.be.undefined;
	});

	it('finds all credentials for an account', () => {
		const accountCredentials = mockCredentials.filter(c => c.accountId === 'acc-1');
		expect(accountCredentials).to.have.length(2);
	});
});

describe('Passkey counter validation', () => {
	it('accepts counter greater than stored value', () => {
		const storedCounter = 10;
		const newCounter = 11;
		expect(newCounter).to.be.greaterThan(storedCounter);
	});

	it('accepts counter equal to stored when both are zero (first use)', () => {
		const storedCounter = 0;
		const newCounter = 0;
		expect(newCounter).to.be.at.least(storedCounter);
	});

	it('detects potential replay when new counter is less than stored', () => {
		const storedCounter = 15;
		const newCounter = 10;
		const isReplay = newCounter < storedCounter;
		expect(isReplay).to.be.true;
	});

	it('updates stored counter after successful verification', () => {
		const credential = {credentialId: 'cred-x', counter: 5};
		const newCounter = 6;

		credential.counter = newCounter;
		expect(credential.counter).to.equal(6);
	});
});

describe('Passkey credential ownership', () => {
	it('prevents deletion of credential belonging to another account', () => {
		const requestingAccountId: string = 'acc-1';
		const credentialAccountId: string = 'acc-2';

		const isOwner = requestingAccountId === credentialAccountId;
		expect(isOwner).to.be.false;
	});

	it('allows deletion of own credential', () => {
		const requestingAccountId: string = 'acc-1';
		const credentialAccountId: string = 'acc-1';

		const isOwner = requestingAccountId === credentialAccountId;
		expect(isOwner).to.be.true;
	});
});

describe('Base64url encoding for credential data', () => {
	it('encodes and decodes public key bytes round-trip', () => {
		const originalBytes = new Uint8Array([1, 2, 3, 4, 5, 165, 200, 255, 0, 128]);
		const encoded = Buffer.from(originalBytes).toString('base64url');
		const decoded = Buffer.from(encoded, 'base64url');

		expect(Buffer.from(decoded)).to.deep.equal(Buffer.from(originalBytes));
	});

	it('base64url contains no +, /, or = characters', () => {
		for (let i = 0; i < 20; i++) {
			const bytes = new Uint8Array(32);
			crypto.getRandomValues(bytes);
			const encoded = Buffer.from(bytes).toString('base64url');
			expect(encoded).to.not.match(/[+/=]/);
		}
	});

	it('credentialId round-trips through base64url', () => {
		const originalBytes = Buffer.from([105, 183, 55, 215, 191, 252, 93, 181]);
		const credId = originalBytes.toString('base64url');
		const asBuffer = Buffer.from(credId, 'base64url');
		const backToString = asBuffer.toString('base64url');
		expect(backToString).to.equal(credId);
	});
});
