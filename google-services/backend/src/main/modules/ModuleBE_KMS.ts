/*
 * @nu-art/google-services-backend - GCP clients, including Cloud KMS
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {
	ImplementationMissingException,
	MissingDataException,
	Module,
	MUSTNeverHappenException,
	ThisShouldNotHappenException
} from '@nu-art/ts-common';
import {KeyManagementServiceClient, protos} from '@google-cloud/kms';

/** gRPC status codes used by Cloud KMS (google.rpc.Code). */
const GrpcCode_NotFound = 5;
const GrpcCode_AlreadyExists = 6;

function isGrpcCode(err: unknown, code: number): boolean {
	return typeof err === 'object' && err !== null && 'code' in err && (err as { code: unknown }).code === code;
}

export type ModuleBE_KMS_Config = {
	projectId?: string;
	locationId?: string;
};

/** Optional per-request context for project/location; takes precedence over module config and env. */
export type KMSContext = {
	projectId?: string;
	locationId?: string;
};

/** Default KMS location when not provided via context or config (GCP multi-region "global"). */
const DefaultLocationId = 'global';

/** Re-export KMS purpose enum from package (use for ensureCryptoKey etc.). */
export const CryptoKeyPurpose = protos.google.cloud.kms.v1.CryptoKey.CryptoKeyPurpose;

/** Re-export KMS algorithm enum from package (use for ensureCryptoKey etc.). */
export const CryptoKeyVersionAlgorithm = protos.google.cloud.kms.v1.CryptoKeyVersion.CryptoKeyVersionAlgorithm;

export type EnsureCryptoKeyOptions = {
	purpose: number;
	algorithm: number;
};

/** Digest for asymmetric sign: SHA-256 of the data (32 bytes). */
export type KMSDigest = {
	sha256: Buffer;
};

type KmsNamed = { name?: string | null };

/**
 * The slice of Cloud KMS this module calls. A test supplies a fake through {@link ModuleBE_KMS_Class.useClient}.
 */
export type KmsClient = {
	locationPath(projectId: string, locationId: string): string;
	keyRingPath(projectId: string, locationId: string, keyRingId: string): string;
	cryptoKeyPath(projectId: string, locationId: string, keyRingId: string, keyId: string): string;
	cryptoKeyVersionPath(projectId: string, locationId: string, keyRingId: string, keyId: string, versionId: string): string;
	getKeyRing(request: { name: string }): Promise<unknown>;
	createKeyRing(request: { parent: string; keyRingId: string; keyRing: Record<string, never> }): Promise<unknown>;
	getCryptoKey(request: { name: string }): Promise<unknown>;
	listCryptoKeyVersions(request: { parent: string; filter: string }): Promise<[KmsNamed[], ...unknown[]]>;
	createCryptoKeyVersion(request: { parent: string; cryptoKeyVersion: Record<string, never> }): Promise<[KmsNamed, ...unknown[]]>;
	createCryptoKey(request: {
		parent: string;
		cryptoKeyId: string;
		cryptoKey: { purpose: number; versionTemplate: { algorithm: number } };
	}): Promise<unknown>;
	getPublicKey(request: { name: string }): Promise<[{ pem?: string | null }, ...unknown[]]>;
	asymmetricSign(request: { name: string; digest: KMSDigest }): Promise<[{ signature?: Uint8Array | string | null }, ...unknown[]]>;
};

export class ModuleBE_KMS_Class
	extends Module<ModuleBE_KMS_Config> {
	private api?: KmsClient;

	/** A test supplies a fake. The next call uses it instead of Cloud KMS. */
	public useClient(client: KmsClient) {
		this.api = client;
	}

	private kms(): KmsClient {
		if (this.api)
			return this.api;

		const real = new KeyManagementServiceClient();
		return this.api = {
			locationPath: (projectId, locationId) => real.locationPath(projectId, locationId),
			keyRingPath: (projectId, locationId, keyRingId) => real.keyRingPath(projectId, locationId, keyRingId),
			cryptoKeyPath: (projectId, locationId, keyRingId, keyId) => real.cryptoKeyPath(projectId, locationId, keyRingId, keyId),
			cryptoKeyVersionPath: (projectId, locationId, keyRingId, keyId, versionId) => real.cryptoKeyVersionPath(projectId, locationId, keyRingId, keyId, versionId),
			getKeyRing: request => real.getKeyRing(request),
			createKeyRing: request => real.createKeyRing(request),
			getCryptoKey: request => real.getCryptoKey(request),
			listCryptoKeyVersions: request => real.listCryptoKeyVersions(request),
			createCryptoKeyVersion: request => real.createCryptoKeyVersion(request),
			createCryptoKey: request => real.createCryptoKey(request),
			getPublicKey: request => real.getPublicKey(request),
			asymmetricSign: request => real.asymmetricSign(request),
		};
	}

	private resolveContext(requestContext?: KMSContext): { projectId: string; locationId: string } {
		const projectId = requestContext?.projectId
			?? this.config.projectId
			?? process.env.GCP_PROJECT_ID
			?? process.env.GCLOUD_PROJECT;

		if (!projectId)
			throw new ImplementationMissingException(
				'KMS projectId not provided via request context, module config, or env (GCP_PROJECT_ID / GCLOUD_PROJECT)'
			);

		const locationId = requestContext?.locationId
			?? this.config.locationId
			?? DefaultLocationId;

		return {projectId, locationId};
	}

	private getParent(ctx: { projectId: string; locationId: string }): string {
		return this.kms().locationPath(ctx.projectId, ctx.locationId);
	}

	private keyRingPath(ctx: { projectId: string; locationId: string }, keyRingId: string): string {
		return this.kms().keyRingPath(ctx.projectId, ctx.locationId, keyRingId);
	}

	private cryptoKeyPath(ctx: { projectId: string; locationId: string }, keyRingId: string, keyId: string): string {
		return this.kms().cryptoKeyPath(ctx.projectId, ctx.locationId, keyRingId, keyId);
	}

	private cryptoKeyVersionPath(ctx: { projectId: string; locationId: string }, keyRingId: string, keyId: string, versionId: string): string {
		return this.kms().cryptoKeyVersionPath(ctx.projectId, ctx.locationId, keyRingId, keyId, versionId);
	}

	/** Create key ring if it does not exist. Idempotent under concurrency (swallows ALREADY_EXISTS). */
	public ensureKeyRing = async (keyRingId: string, context?: KMSContext): Promise<void> => {
		const ctx = this.resolveContext(context);
		const parent = this.getParent(ctx);
		try {
			await this.kms().getKeyRing({name: this.keyRingPath(ctx, keyRingId)});
			return;
		} catch (err: unknown) {
			if (!isGrpcCode(err, GrpcCode_NotFound))
				throw new ThisShouldNotHappenException(`Failed to get key ring ${keyRingId}`, err instanceof Error ? err : undefined);
		}

		await this.createIgnoringAlreadyExists(
			() => this.kms().createKeyRing({parent, keyRingId, keyRing: {}}),
			`key ring ${keyRingId}`
		);
	};

	/** Create crypto key with given purpose and algorithm if it does not exist. Idempotent under concurrency. */
	public ensureCryptoKey = async (keyRingId: string, keyId: string, options: EnsureCryptoKeyOptions, context?: KMSContext): Promise<void> => {
		const ctx = this.resolveContext(context);
		const parent = this.keyRingPath(ctx, keyRingId);
		try {
			await this.kms().getCryptoKey({name: this.cryptoKeyPath(ctx, keyRingId, keyId)});
			const [versions] = await this.kms().listCryptoKeyVersions({
				parent: this.cryptoKeyPath(ctx, keyRingId, keyId),
				filter: 'state=ENABLED'
			});
			if (versions.length === 0)
				await this.createIgnoringAlreadyExists(
					() => this.kms().createCryptoKeyVersion({
						parent: this.cryptoKeyPath(ctx, keyRingId, keyId),
						cryptoKeyVersion: {}
					}),
					`key version ${keyRingId}/${keyId}`
				);
			return;
		} catch (err: unknown) {
			if (!isGrpcCode(err, GrpcCode_NotFound))
				throw new ThisShouldNotHappenException(`Failed to get crypto key ${keyRingId}/${keyId}`, err instanceof Error ? err : undefined);
		}

		await this.createIgnoringAlreadyExists(
			() => this.kms().createCryptoKey({
				parent,
				cryptoKeyId: keyId,
				cryptoKey: {
					purpose: options.purpose,
					versionTemplate: {algorithm: options.algorithm}
				}
			}),
			`crypto key ${keyRingId}/${keyId}`
		);
	};

	/** Fail if the crypto key is missing. Used to block a JWKS flip before rings exist. */
	public assertCryptoKeyExists = async (keyRingId: string, keyId: string, context?: KMSContext): Promise<void> => {
		const ctx = this.resolveContext(context);
		try {
			await this.kms().getCryptoKey({name: this.cryptoKeyPath(ctx, keyRingId, keyId)});
		} catch (err: unknown) {
			if (isGrpcCode(err, GrpcCode_NotFound))
				throw new MissingDataException(`KMS key ${keyRingId}/${keyId} does not exist`);

			throw new ThisShouldNotHappenException(`Failed to get crypto key ${keyRingId}/${keyId}`, err instanceof Error ? err : undefined);
		}
	};

	private async createIgnoringAlreadyExists(create: () => Promise<unknown>, label: string): Promise<void> {
		try {
			await create();
		} catch (err: unknown) {
			if (isGrpcCode(err, GrpcCode_AlreadyExists)) {
				this.logDebug(`create raced, ALREADY_EXISTS treated as success — ${label}`);
				return;
			}

			throw new ThisShouldNotHappenException(`Failed to create ${label}`, err instanceof Error ? err : undefined);
		}
	}

	/** Create a new key version for rotation. Old versions remain until manually destroyed. */
	public createNewKeyVersion = async (keyRingId: string, keyId: string, context?: KMSContext): Promise<string> => {
		const ctx = this.resolveContext(context);
		const [version] = await this.kms().createCryptoKeyVersion({
			parent: this.cryptoKeyPath(ctx, keyRingId, keyId),
			cryptoKeyVersion: {}
		});
		const versionId = version.name?.split('/').pop();
		if (!versionId)
			throw new MUSTNeverHappenException('Missing version id in createCryptoKeyVersion response');
		return versionId;
	};

	/** List enabled key versions (newest first). */
	public listKeyVersions = async (keyRingId: string, keyId: string, context?: KMSContext): Promise<KmsNamed[]> => {
		const ctx = this.resolveContext(context);
		const [versions] = await this.kms().listCryptoKeyVersions({
			parent: this.cryptoKeyPath(ctx, keyRingId, keyId),
			filter: 'state=ENABLED'
		});
		return versions.sort((a, b) => {
			const aVer = parseInt(a.name?.split('/').pop() ?? '0', 10);
			const bVer = parseInt(b.name?.split('/').pop() ?? '0', 10);
			return bVer - aVer;
		});
	};

	/** Get PEM-encoded public key for a key version. */
	public getPublicKey = async (keyRingId: string, keyId: string, versionId: string, context?: KMSContext): Promise<string> => {
		const ctx = this.resolveContext(context);
		const [pub] = await this.kms().getPublicKey({
			name: this.cryptoKeyVersionPath(ctx, keyRingId, keyId, versionId)
		});
		if (!pub.pem)
			throw new MUSTNeverHappenException(`Public key has no pem for ${keyRingId}/${keyId}/${versionId}`);
		return pub.pem;
	};

	/** Sign a digest with the given key version. Digest must be SHA-256 (32 bytes). */
	public asymmetricSign = async (keyRingId: string, keyId: string, versionId: string, digest: KMSDigest, context?: KMSContext): Promise<Buffer> => {
		const ctx = this.resolveContext(context);
		const [response] = await this.kms().asymmetricSign({
			name: this.cryptoKeyVersionPath(ctx, keyRingId, keyId, versionId),
			digest
		});
		if (!response.signature)
			throw new MUSTNeverHappenException('asymmetricSign returned no signature');
		return Buffer.isBuffer(response.signature) ? response.signature : Buffer.from(response.signature);
	};
}

export const ModuleBE_KMS = new ModuleBE_KMS_Class();
