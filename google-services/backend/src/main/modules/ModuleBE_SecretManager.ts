/*
 * @nu-art/google-services-backend - GCP clients, including Secret Manager
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {AnyPrimitive, exists, generateHex, Module, MUSTNeverHappenException, ThisShouldNotHappenException} from '@nu-art/ts-common';
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
import {google} from '@google-cloud/secret-manager/build/protos/protos.js';
import ISecret = google.cloud.secretmanager.v1.ISecret;
import ISecretVersion = google.cloud.secretmanager.v1.ISecretVersion;

type Secret = {
	key: string;
	projectId: string;
	version?: string;
};

/** 32 bytes, hex-encoded. Long enough for the embed signing key (min 32 chars). */
const GeneratedSecret_HexLength = 64;

const GrpcStatus_NotFound = 5;
const GrpcStatus_AlreadyExists = 6;

/** How many times to re-read after losing a create race, while the winner adds the first version. */
const GeneratedSecret_RaceAttempts = 5;
const GeneratedSecret_RaceDelayMs = 20;

/**
 * The slice of Secret Manager this module calls. A test supplies a fake through {@link ModuleBE_SecretManager_Class.useClient}.
 */
export type SecretManagerApi = {
	accessSecretVersion(request: { name: string }): Promise<ReadonlyArray<{ payload?: { data?: { toString(): string } | null } | null }>>;
	getSecret(request: { name: string }): Promise<ReadonlyArray<ISecret>>;
	createSecret(request: { parent: string; secretId: string; secret: { replication: { automatic: Record<string, never> } } }): Promise<ReadonlyArray<ISecret>>;
	addSecretVersion(request: { parent: string; payload: { data: Buffer } }): Promise<unknown>;
	listSecretVersions(request: { parent: string }): Promise<ReadonlyArray<ISecretVersion[]>>;
	getSecretVersion(request: { name: string }): Promise<ReadonlyArray<ISecretVersion>>;
	deleteSecret(request: { name: string }): Promise<unknown>;
};

function composeSecretKey(secret: Secret): string {
	return `projects/${secret.projectId}/secrets/${secret.key}${secret.version ? `/versions/${secret.version}` : ''}`;
}

function grpcStatus(err: unknown): number | undefined {
	if (typeof err !== 'object' || err === null || !('code' in err))
		return undefined;

	const code = err.code;
	if (typeof code === 'number')
		return code;

	if (code === 'NOT_FOUND')
		return GrpcStatus_NotFound;

	if (code === 'ALREADY_EXISTS')
		return GrpcStatus_AlreadyExists;

	return undefined;
}

function isNotFound(err: unknown): boolean {
	return grpcStatus(err) === GrpcStatus_NotFound;
}

function isAlreadyExists(err: unknown): boolean {
	return grpcStatus(err) === GrpcStatus_AlreadyExists;
}

/**
 * Reads a generated secret. New values are raw random strings. A value stored earlier as a JSON string
 * (the rate-limit pepper) is unwrapped so existing secrets keep working.
 */
function decodeGeneratedSecret(payload: string): string {
	const trimmed = payload.trim();
	if (!trimmed.startsWith('"'))
		return trimmed;

	let parsed: unknown;
	try {
		parsed = JSON.parse(trimmed);
	} catch (err: unknown) {
		throw new ThisShouldNotHappenException('Generated secret payload is not valid JSON', errorCause(err));
	}

	if (typeof parsed !== 'string' || !parsed.trim())
		throw new ThisShouldNotHappenException('Generated secret JSON payload is not a string');

	return parsed;
}

function delay(ms: number): Promise<void> {
	return new Promise(resolve => setTimeout(resolve, ms));
}

function errorCause(err: unknown): Error | undefined {
	if (err instanceof Error)
		return err;

	return undefined;
}

export class SecretKey<T extends AnyPrimitive> {
	readonly secret: Secret;

	constructor(name: string, parent = process.env.GCP_PROJECT_ID ?? process.env.GCLOUD_PROJECT) {
		if (!parent)
			throw new MUSTNeverHappenException(`Missing the secret parent project id for secret ${name}`);

		this.secret = Object.freeze({projectId: parent, key: name});
	}

	get(): Promise<T | undefined>;
	get(fallbackValue: T): Promise<T>;
	async get(fallbackValue?: T, version: string = 'latest'): Promise<T | undefined> {
		let rawSecret = await ModuleBE_SecretManager.tryGetSecretValue({...this.secret, version});
		if (exists(rawSecret))
			return JSON.parse(rawSecret) as T;

		if (!exists(fallbackValue))
			return undefined;

		const secret = await ModuleBE_SecretManager.getOrCreateSecret(this.secret);
		rawSecret = JSON.stringify(fallbackValue);
		await ModuleBE_SecretManager.updateSecretImpl(secret, rawSecret);
		return fallbackValue;
	}

	async set(secret: T) {
		return ModuleBE_SecretManager.updateSecret(this.secret, JSON.stringify(secret));
	}

	async previous(reverseIndex = 1): Promise<T | undefined> {
		const versions = await ModuleBE_SecretManager.listEnabledVersions(this.secret);
		const version = versions[reverseIndex];
		if (!version?.name)
			throw new MUSTNeverHappenException(`Missing version name at index ${reverseIndex}`);

		const rawSecret = await ModuleBE_SecretManager.getSecretValueImpl(version.name);
		return rawSecret ? JSON.parse(rawSecret) as T : undefined;
	}

	async delete(): Promise<void> {
		await ModuleBE_SecretManager.deleteSecret(this.secret);
	}

	async modifiedTimestamp(): Promise<number> {
		const versions = await ModuleBE_SecretManager.listEnabledVersions(this.secret);
		if (!versions.length)
			return 0;

		const versionName = versions[0].name;
		if (!versionName)
			return 0;

		const metadata = await ModuleBE_SecretManager.getSecretVersionMetadata(versionName);
		return metadata.createTime ? Number(metadata.createTime.seconds) * 1000 : 0;
	}
}

/**
 * A secret whose value is random and owned by the code that uses it.
 *
 * Declaring one does not talk to Secret Manager. The first {@link get} reads the latest version and caches it.
 * When the secret is missing, that call generates a random value, creates the secret, and stores the value as
 * version 1. A create that loses to another instance reads the value that instance stored.
 *
 * Externally provided secrets (API keys) stay on {@link SecretKey} and are not created here.
 */
export class GeneratedSecret {
	private resolved?: Promise<string>;

	constructor(
		public readonly key: string,
		private readonly projectId = process.env.GCP_PROJECT_ID ?? process.env.GCLOUD_PROJECT,
		private readonly manager?: ModuleBE_SecretManager_Class,
	) {}

	/** Cached for this instance. Runs on first use, not at construction. */
	public get(): Promise<string> {
		this.resolved ??= this.load().catch((err: unknown) => {
			this.resolved = undefined;
			throw err;
		});
		return this.resolved;
	}

	private load(): Promise<string> {
		if (!this.projectId)
			return Promise.reject(new MUSTNeverHappenException(`Missing the secret parent project id for secret ${this.key}`));

		return (this.manager ?? ModuleBE_SecretManager).getOrCreateGenerated({projectId: this.projectId, key: this.key});
	}
}

export class ModuleBE_SecretManager_Class
	extends Module {
	private api?: SecretManagerApi;
	private readonly generated = new Map<string, Promise<string>>();

	/**
	 * Replaces the GCP client. Tests use this so a missing auto-generated secret can be exercised without Secret Manager.
	 * Clears the in-process cache of generated values.
	 */
	public useClient(client: SecretManagerApi) {
		this.api = client;
		this.generated.clear();
	}

	private gcp(): SecretManagerApi {
		if (this.api)
			return this.api;

		const real = new SecretManagerServiceClient();
		return this.api = {
			accessSecretVersion: async request => {
				const [version] = await real.accessSecretVersion(request);
				return [{payload: version.payload}];
			},
			getSecret: async request => {
				const [secret] = await real.getSecret(request);
				return [secret];
			},
			createSecret: async request => {
				const [secret] = await real.createSecret(request);
				return [secret];
			},
			addSecretVersion: async request => {
				await real.addSecretVersion(request);
			},
			listSecretVersions: async request => {
				const [versions] = await real.listSecretVersions(request);
				return [versions];
			},
			getSecretVersion: async request => {
				const [version] = await real.getSecretVersion(request);
				return [version];
			},
			deleteSecret: async request => {
				await real.deleteSecret(request);
			},
		};
	}

	public getSecretValue = async (secret: Secret) => {
		return this.getSecretValueImpl(composeSecretKey(secret));
	};

	public tryGetSecretValue = async (secret: Secret) => {
		try {
			return await this.getSecretValue(secret);
		} catch (err: unknown) {
			if (isNotFound(err))
				return undefined;

			throw new ThisShouldNotHappenException(`Failed to retrieve secret \n Secret: ${JSON.stringify(secret)}`, errorCause(err));
		}
	};

	/**
	 * Latest value of a generated secret. Creates it on first use when it does not exist.
	 * Concurrent callers in this process share one resolution. A failed resolution is not cached.
	 */
	public getOrCreateGenerated = (secret: Secret): Promise<string> => {
		const id = `${secret.projectId}/${secret.key}`;
		const current = this.generated.get(id);
		if (current)
			return current;

		const pending = this.resolveGenerated(secret).then(value => {
			this.generated.set(id, Promise.resolve(value));
			return value;
		}, (err: unknown) => {
			this.generated.delete(id);
			throw err;
		});
		this.generated.set(id, pending);
		return pending;
	};

	public getSecretValueImpl = async (secretKey: string) => {
		const [version] = await this.gcp().accessSecretVersion({name: secretKey});
		return version.payload?.data?.toString();
	};

	public updateSecret = async (_secret: Secret, data: string): Promise<string> => {
		const secret = await this.getOrCreateSecret(_secret);
		if (!secret.name)
			throw new MUSTNeverHappenException(`Missing secret.name for ${composeSecretKey(_secret)}`);

		await this.updateSecretImpl(secret, data);
		return secret.name;
	};

	public updateSecretImpl = async (secret: ISecret, data: string) => {
		try {
			await this.gcp().addSecretVersion({
				parent: secret.name!,
				payload: {data: Buffer.from(data, 'utf-8')}
			});
		} catch (err: unknown) {
			throw new ThisShouldNotHappenException(`Failed to update secret version (${secret.name})`, errorCause(err));
		}
	};

	public listEnabledVersions = async (secret: Secret) => {
		const [versions] = await this.gcp().listSecretVersions({parent: composeSecretKey(secret)});
		return versions.filter(v => v.state === 'ENABLED').sort((a, b) => {
			const aVer = Number(a.name?.split('/').pop());
			const bVer = Number(b.name?.split('/').pop());
			return isNaN(bVer - aVer) ? 0 : bVer - aVer;
		});
	};

	public getSecretVersionMetadata = async (versionName: string) => {
		const [version] = await this.gcp().getSecretVersion({name: versionName});
		return version;
	};

	public deleteSecret = async (_secret: Secret) => {
		const name = composeSecretKey(_secret);
		try {
			await this.gcp().deleteSecret({name});
		} catch (err: unknown) {
			if (isNotFound(err))
				return;

			throw new ThisShouldNotHappenException(`Failed to delete secret (${JSON.stringify(_secret)})`, errorCause(err));
		}
	};

	public getOrCreateSecret = async (_secret: Secret) => {
		const name = composeSecretKey(_secret);
		try {
			const [secret] = await this.gcp().getSecret({name});
			return secret;
		} catch (err: unknown) {
			if (!isNotFound(err))
				throw new ThisShouldNotHappenException(`Failed to get secret (${_secret.key})`, errorCause(err));
		}

		try {
			const [created] = await this.gcp().createSecret({
				parent: `projects/${_secret.projectId}`,
				secretId: _secret.key,
				secret: {replication: {automatic: {}}}
			});
			return created;
		} catch (err: unknown) {
			if (!isAlreadyExists(err))
				throw new ThisShouldNotHappenException(`Failed to create secret (${_secret.key})`, errorCause(err));
		}

		const [secret] = await this.gcp().getSecret({name});
		return secret;
	};

	private resolveGenerated = async (secret: Secret): Promise<string> => {
		const existing = await this.readGenerated(secret);
		if (existing !== undefined)
			return existing;

		const value = generateHex(GeneratedSecret_HexLength);
		const created = await this.createContainer(secret);
		if (!created) {
			const raced = await this.readGeneratedAfterRace(secret);
			if (raced !== undefined) {
				this.logDebug(`Using existing generated secret key=${secret.key}`);
				return raced;
			}
		}

		await this.addFirstVersion(secret, value);
		const stored = await this.readGenerated(secret);
		if (stored === undefined)
			throw new ThisShouldNotHappenException(`Generated secret ${secret.key} has no version after it was created`);

		return stored;
	};

	private readGenerated = async (secret: Secret): Promise<string | undefined> => {
		const raw = await this.tryGetSecretValue({...secret, version: 'latest'});
		if (!exists(raw) || !raw.trim())
			return undefined;

		return decodeGeneratedSecret(raw);
	};

	/** The other instance created the container and may still be writing version 1. */
	private readGeneratedAfterRace = async (secret: Secret): Promise<string | undefined> => {
		for (let attempt = 0; attempt < GeneratedSecret_RaceAttempts; attempt++) {
			const value = await this.readGenerated(secret);
			if (value !== undefined)
				return value;

			if (attempt < GeneratedSecret_RaceAttempts - 1)
				await delay(GeneratedSecret_RaceDelayMs * (attempt + 1));
		}

		return undefined;
	};

	/** @returns true when this call created the container. */
	private createContainer = async (secret: Secret): Promise<boolean> => {
		try {
			await this.gcp().createSecret({
				parent: `projects/${secret.projectId}`,
				secretId: secret.key,
				secret: {replication: {automatic: {}}}
			});
			this.logInfo(`Created generated secret key=${secret.key}`);
			return true;
		} catch (err: unknown) {
			if (isAlreadyExists(err))
				return false;

			throw new ThisShouldNotHappenException(`Failed to create generated secret ${secret.key}`, errorCause(err));
		}
	};

	private addFirstVersion = async (secret: Secret, value: string) => {
		try {
			await this.gcp().addSecretVersion({
				parent: composeSecretKey(secret),
				payload: {data: Buffer.from(value, 'utf8')}
			});
		} catch (err: unknown) {
			throw new ThisShouldNotHappenException(`Failed to add the first version of generated secret ${secret.key}`, errorCause(err));
		}
	};
}

export const ModuleBE_SecretManager = new ModuleBE_SecretManager_Class();
