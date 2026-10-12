/*
 * @nu-art/firebase-backend — lazy Mongo connect (mongoUrl and mongoUrlSecret)
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {expect} from 'chai';
import {LazyMongoConnection, type MongoConnectionConfig} from '../main/LazyMongoConnection.js';

type Client = { url: string };

function connectionFor(config: MongoConnectionConfig, secrets: Record<string, string | Promise<string>>) {
	const created: string[] = [];
	const secretReads: string[] = [];
	let driverFailures = 0;
	const connection = new LazyMongoConnection<Client>(
		() => LazyMongoConnection.resolveUrl(config, async secret => {
			secretReads.push(secret);
			const value = secrets[secret];
			if (value === undefined)
				throw new Error(`missing secret ${secret}`);

			return value;
		}, 'test'),
		async url => {
			if (driverFailures > 0) {
				driverFailures--;
				throw new Error('driver down');
			}

			created.push(url);
			return {url};
		},
	);

	return {
		connection,
		created,
		secretReads,
		failDriver(times = 1) {
			driverFailures = times;
		},
	};
}

async function rejectionOf(action: Promise<unknown>): Promise<unknown> {
	try {
		await action;
	} catch (err) {
		return err;
	}

	throw new Error('expected the connection to fail');
}

describe('LazyMongoConnection', () => {
	it('does not connect until get, then reuses one client for mongoUrl', async () => {
		const {connection, created, secretReads} = connectionFor(
			{mongoUrl: 'mongodb://localhost:27017/app', params: {directConnection: 'true'}},
			{},
		);
		expect(created).to.deep.equal([]);

		const first = await connection.get();
		const second = await connection.get();

		expect(second).to.equal(first);
		expect(created).to.deep.equal(['mongodb://localhost:27017/app?directConnection=true']);
		expect(secretReads).to.deep.equal([]);
	});

	it('resolves mongoUrlSecret through the same get and does not use mongoUrl', async () => {
		const {connection, created, secretReads} = connectionFor(
			{mongoUrlSecret: 'mongo-prod', mongoUrl: 'mongodb://localhost:27017/nope'},
			{'mongo-prod': 'mongodb://secret-host/db'},
		);

		const first = await connection.get();
		const second = await connection.get();

		expect(second).to.equal(first);
		expect(secretReads).to.deep.equal(['mongo-prod']);
		expect(created).to.deep.equal(['mongodb://secret-host/db']);
	});

	it('shares one in-flight connect across concurrent callers for both url sources', async () => {
		let releaseSecret: (url: string) => void = () => undefined;
		const secretGate = new Promise<string>(resolve => {
			releaseSecret = resolve;
		});
		const secret = connectionFor(
			{mongoUrlSecret: 'mongo-prod', mongoUrl: 'mongodb://localhost:27017/nope'},
			{'mongo-prod': secretGate},
		);
		const secretCalls = Promise.all([secret.connection.get(), secret.connection.get()]);
		expect(secret.created).to.deep.equal([]);
		releaseSecret('mongodb://secret-host/db');
		const [secretA, secretB] = await secretCalls;
		expect(secretA).to.equal(secretB);
		expect(secret.created).to.deep.equal(['mongodb://secret-host/db']);

		let releaseDriver: (client: Client) => void = () => undefined;
		const driverGate = new Promise<Client>(resolve => {
			releaseDriver = resolve;
		});
		const created: string[] = [];
		const direct = new LazyMongoConnection<Client>(
			() => LazyMongoConnection.resolveUrl({mongoUrl: 'mongodb://localhost:27017/app'}, async () => {
				throw new Error('secret should not be read');
			}, 'test'),
			() => {
				created.push('mongodb://localhost:27017/app');
				return driverGate;
			},
		);
		const directCalls = Promise.all([direct.get(), direct.get()]);
		await Promise.resolve();
		expect(created).to.deep.equal(['mongodb://localhost:27017/app']);
		const client = {url: 'mongodb://localhost:27017/app'};
		releaseDriver(client);
		const [directA, directB] = await directCalls;
		expect(directA).to.equal(client);
		expect(directB).to.equal(client);
		expect(created).to.have.length(1);
	});

	it('drops a failed connect so the next get retries, and a secret failure does not fall back to mongoUrl', async () => {
		const secret = connectionFor(
			{mongoUrlSecret: 'mongo-prod', mongoUrl: 'mongodb://localhost:27017/nope'},
			{},
		);
		const failed = await rejectionOf(secret.connection.get());
		expect(String(failed)).to.contain('missing secret mongo-prod');
		expect(secret.created).to.deep.equal([]);

		const retried = connectionFor(
			{mongoUrlSecret: 'mongo-prod', mongoUrl: 'mongodb://localhost:27017/nope'},
			{'mongo-prod': 'mongodb://secret-host/db'},
		);
		retried.failDriver();
		const driverFailed = await rejectionOf(retried.connection.get());
		expect(String(driverFailed)).to.contain('driver down');
		expect(retried.created).to.deep.equal([]);

		const client = await retried.connection.get();
		expect(client.url).to.equal('mongodb://secret-host/db');
		expect(retried.created).to.deep.equal(['mongodb://secret-host/db']);
		expect(retried.secretReads).to.deep.equal(['mongo-prod', 'mongo-prod']);
	});

	it('uses an emulator host through the same get and does not read the secret', async () => {
		const created: string[] = [];
		const secretReads: string[] = [];
		const connection = new LazyMongoConnection<{ url: string }>(
			() => LazyMongoConnection.resolveUrl(
				{mongoUrlSecret: 'mongo-prod', mongoUrl: 'mongodb://localhost:27017/nope'},
				async secret => {
					secretReads.push(secret);
					return 'mongodb://secret-host/db';
				},
				'test',
				'127.0.0.1:27017',
			),
			async url => {
				created.push(url);
				return {url};
			},
		);

		const client = await connection.get();
		expect(client.url).to.equal('mongodb://127.0.0.1:27017/?directConnection=true');
		expect(created).to.deep.equal(['mongodb://127.0.0.1:27017/?directConnection=true']);
		expect(secretReads).to.deep.equal([]);
	});

	it('reconnects through get after the open client drops', async () => {
		const closed: number[] = [];
		let n = 0;
		const connection = new LazyMongoConnection<{id: number; close: () => Promise<void>}>(
			async () => 'mongodb://localhost:27017/app',
			async () => {
				const id = ++n;
				return {
					id,
					close: () => {
						closed.push(id);
						return Promise.reject(new Error('mongodb://localhost:27017/app'));
					},
				};
			},
		);

		const first = await connection.get();
		connection.drop(first);
		await Promise.resolve();
		expect(closed).to.deep.equal([1]);
		expect(connection.current()).to.equal(undefined);

		const second = await connection.get();
		const third = await connection.get();
		expect(second).to.not.equal(first);
		expect(third).to.equal(second);
		expect(second.id).to.equal(2);
		expect(closed).to.deep.equal([1]);
	});

	it('drops a client that closes while it is created, then the next get reconnects', async () => {
		let n = 0;
		let connection!: LazyMongoConnection<{id: number; close: () => void}>;
		connection = new LazyMongoConnection(
			async () => 'mongodb://localhost:27017/app',
			() => {
				const client = {
					id: ++n,
					close: () => {
						throw new Error('mongodb://localhost:27017/app');
					},
				};
				connection.remember(client);
				if (client.id === 1)
					connection.drop(client);

				return client;
			},
		);

		const first = await connection.get();
		expect(first.id).to.equal(1);
		expect(connection.current()).to.equal(undefined);

		const second = await connection.get();
		expect(second.id).to.equal(2);
		expect(second).to.not.equal(first);
		expect(connection.current()).to.equal(second);
	});

	it('ignores a drop from a client that is no longer the cached one', async () => {
		const closed: number[] = [];
		let n = 0;
		const connection = new LazyMongoConnection<{id: number; close: () => void}>(
			async () => 'mongodb://localhost:27017/app',
			async () => {
				const id = ++n;
				return {
					id,
					close: () => {
						closed.push(id);
					},
				};
			},
		);

		const first = await connection.get();
		connection.drop(first);
		const second = await connection.get();
		connection.drop(first);
		const third = await connection.get();

		expect(third).to.equal(second);
		expect(second.id).to.equal(2);
		expect(connection.current()).to.equal(second);
		expect(closed).to.deep.equal([1]);
	});

	it('retries mongoUrl on the same path after the driver fails', async () => {
		const {connection, created, secretReads, failDriver} = connectionFor(
			{mongoUrl: 'mongodb://localhost:27017/app'},
			{},
		);
		failDriver();
		const failed = await rejectionOf(connection.get());
		expect(String(failed)).to.contain('driver down');

		const client = await connection.get();
		expect(client.url).to.equal('mongodb://localhost:27017/app');
		expect(created).to.deep.equal(['mongodb://localhost:27017/app']);
		expect(secretReads).to.deep.equal([]);
	});
});
