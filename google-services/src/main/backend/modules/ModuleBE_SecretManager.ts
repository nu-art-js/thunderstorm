import {AnyPrimitive, exists, Logger, Module, MUSTNeverHappenException} from '@nu-art/ts-common';
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
import {google} from '@google-cloud/secret-manager/build/protos/protos';
import {GoogleAuth} from 'google-auth-library';

export const printCallerIdentity = async () => {
	const logger = new Logger('GCP-Caller');
	const auth = new GoogleAuth({scopes: 'https://www.googleapis.com/auth/cloud-platform'});
	const client = await auth.getClient();
	const projectId = await auth.getProjectId();
	const token = await client.getAccessToken();
	const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token.token}`);
	const info = await res.json();
	logger.logInfo(`🔐 GCP Caller Identity: ${info.email || info.sub}`);
	logger.logInfo(`🏗️ GCP Project ID: ${projectId}`);
};

type Secret = {
	key: string;
	projectId: string;
	version?: string;
};

type Config = {};

function composeSecretKey(secret: Secret): string {
	return `projects/${secret.projectId}/secrets/${secret.key}${secret.version ? `/versions/${secret.version}` : ''}`;
}

class SecretManagerException
	extends Error {
	constructor(message: string, public meta?: any) {
		super(message);
		this.name = 'SecretManagerException';
	}
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

export class ModuleBE_SecretManager_Class
	extends Module<Config> {
	private client = new SecretManagerServiceClient({
		apiEndpoint: process.env.SECRET_MANAGER_EMULATOR_HOST ?? undefined
	});

	public getSecretValue = async (secret: Secret) => {
		return this.getSecretValueImpl(composeSecretKey(secret));
	};

	public tryGetSecretValue = async (secret: Secret) => {
		try {
			return await this.getSecretValue(secret);
		} catch (err: any) {
			if (err.code === 5)
				return undefined;

			throw new SecretManagerException('Failed to retrieve secret', {secret, error: err});
		}
	};

	public getSecretValueImpl = async (secretKey: string) => {
		const [version] = await this.client.accessSecretVersion({name: secretKey});
		return version.payload?.data?.toString();
	};

	public updateSecret = async (_secret: Secret, data: string): Promise<string> => {
		const secret = await this.getOrCreateSecret(_secret);
		if (!secret.name)
			throw new MUSTNeverHappenException(`Missing secret.name for ${composeSecretKey(_secret)}`);

		await this.updateSecretImpl(secret, data);
		return secret.name;
	};

	public updateSecretImpl = async (secret: google.cloud.secretmanager.v1.ISecret, data: string) => {
		try {
			await this.client.addSecretVersion({
				parent: secret.name!,
				payload: {data: Buffer.from(data, 'utf-8')}
			});
		} catch (err) {
			throw new SecretManagerException('Failed to add secret version', {secret, error: err});
		}
	};

	public listEnabledVersions = async (secret: Secret) => {
		const [versions] = await this.client.listSecretVersions({parent: composeSecretKey(secret)});
		return versions.filter(v => v.state === 'ENABLED').sort((a, b) => {
			const aVer = Number(a.name?.split('/').pop());
			const bVer = Number(b.name?.split('/').pop());
			return isNaN(bVer - aVer) ? 0 : bVer - aVer;
		});
	};

	public getSecretVersionMetadata = async (versionName: string) => {
		const [version] = await this.client.getSecretVersion({name: versionName});
		return version;
	};

	public getOrCreateSecret = async (_secret: Secret) => {
		const name = composeSecretKey(_secret);
		try {
			const [secret] = await this.client.getSecret({name});
			return secret;
		} catch (err: any) {
			if (err.code !== 5)
				throw new SecretManagerException('Failed to get secret', {secret: _secret, error: err});

			const [created] = await this.client.createSecret({
				parent: `projects/${_secret.projectId}`,
				secretId: _secret.key,
				secret: {replication: {automatic: {}}}
			});
			return created;
		}
	};
}

export const ModuleBE_SecretManager = new ModuleBE_SecretManager_Class();
