/*
 * @nu-art/google-services-backend - in-memory Secret Manager client
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import type {SecretManagerApi} from './ModuleBE_SecretManager.js';

const GrpcStatus_NotFound = 5;
const GrpcStatus_AlreadyExists = 6;

type StoredVersion = {
	payload: string;
	createdAtMs: number;
};

type StoredSecret = {
	versions: StoredVersion[];
};

function grpcError(code: number, message: string): Error {
	const err = new Error(message);
	return Object.assign(err, {code});
}

function splitVersion(name: string): {secretName: string; version?: string} {
	const marker = '/versions/';
	const at = name.lastIndexOf(marker);
	if (at === -1)
		return {secretName: name};

	return {secretName: name.slice(0, at), version: name.slice(at + marker.length)};
}

function versionResource(secretName: string, version: number, stored: StoredVersion) {
	return {
		name: `${secretName}/versions/${version}`,
		state: 'ENABLED' as const,
		createTime: {seconds: Math.floor(stored.createdAtMs / 1000)},
	};
}

/**
 * In-memory {@link SecretManagerApi}. Install with {@link ModuleBE_SecretManager_Class.useClient}.
 * A missing name is gRPC 5. Creating a name that is already stored is gRPC 6.
 */
export class MemorySecretManager implements SecretManagerApi {
	private readonly secrets = new Map<string, StoredSecret>();

	async accessSecretVersion(request: {name: string}) {
		const {secretName, version} = splitVersion(request.name);
		const stored = version === undefined ? undefined : this.storedVersion(secretName, version);
		if (!stored)
			throw grpcError(GrpcStatus_NotFound, `Secret version not found: ${request.name}`);

		return [{payload: {data: Buffer.from(stored.payload, 'utf8')}}];
	}

	async getSecret(request: {name: string}) {
		if (!this.secrets.has(request.name))
			throw grpcError(GrpcStatus_NotFound, `Secret not found: ${request.name}`);

		return [{name: request.name}];
	}

	async createSecret(request: {parent: string; secretId: string}) {
		const name = `${request.parent}/secrets/${request.secretId}`;
		if (this.secrets.has(name))
			throw grpcError(GrpcStatus_AlreadyExists, `Secret already exists: ${name}`);

		this.secrets.set(name, {versions: []});
		return [{name}];
	}

	async addSecretVersion(request: {parent: string; payload: {data: Buffer}}) {
		const stored = this.secrets.get(request.parent);
		if (!stored)
			throw grpcError(GrpcStatus_NotFound, `Secret not found: ${request.parent}`);

		stored.versions.push({
			payload: request.payload.data.toString('utf8'),
			createdAtMs: Date.now(),
		});
		return [];
	}

	async listSecretVersions(request: {parent: string}) {
		const stored = this.secrets.get(request.parent);
		if (!stored)
			throw grpcError(GrpcStatus_NotFound, `Secret not found: ${request.parent}`);

		const versions = stored.versions.map((version, index) => versionResource(request.parent, index + 1, version));
		versions.reverse();
		return [versions];
	}

	async getSecretVersion(request: {name: string}) {
		const {secretName, version} = splitVersion(request.name);
		const stored = this.secrets.get(secretName);
		const index = version === undefined || !stored ? -1 : this.versionIndex(stored, version);
		if (!stored || index < 0)
			throw grpcError(GrpcStatus_NotFound, `Secret version not found: ${request.name}`);

		return [versionResource(secretName, index + 1, stored.versions[index])];
	}

	async deleteSecret(request: {name: string}) {
		if (!this.secrets.delete(request.name))
			throw grpcError(GrpcStatus_NotFound, `Secret not found: ${request.name}`);

		return [];
	}

	private storedVersion(secretName: string, version: string): StoredVersion | undefined {
		const stored = this.secrets.get(secretName);
		if (!stored)
			return undefined;

		const index = this.versionIndex(stored, version);
		return index < 0 ? undefined : stored.versions[index];
	}

	private versionIndex(stored: StoredSecret, version: string): number {
		if (stored.versions.length === 0)
			return -1;

		if (version === 'latest')
			return stored.versions.length - 1;

		const number = Number(version);
		if (!Number.isInteger(number) || number < 1 || number > stored.versions.length)
			return -1;

		return number - 1;
	}
}
