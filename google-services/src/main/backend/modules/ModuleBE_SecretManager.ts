import {AnyPrimitive, Module, MUSTNeverHappenException, NotImplementedYetException} from '@nu-art/ts-common';
import {SecretManagerServiceClient} from '@google-cloud/secret-manager';
import {google} from '@google-cloud/secret-manager/build/protos/protos';

type Config = {}

type SecretUpsertProps = {
	//Path to secret, i.e. "projects/{parent}"
	parent: string;
	//Secret name
	name: string;
	//Secret data
	data: string
}

/**
 * A typed wrapper for interacting with GCP Secret Manager secrets.
 *
 * @template T The expected primitive JSON-parsable type of the secret's content (e.g., string, number, boolean, object).
 */
export class SecretKey<T extends AnyPrimitive> {
	readonly secretKey: string;

	/**
	 * Constructs a new SecretKey instance.
	 *
	 * @param name - The name of the secret.
	 * @param parent - The GCP project ID where the secret resides.
	 */
	constructor(name: string, parent = process.env.GCP_PROJECT_ID) {
		if (!parent)
			throw new MUSTNeverHappenException(`Missing the secret parent project id for secret ${name}`);

		this.secretKey = `projects/${parent}/secrets/${name}`;
	}

	get(): Promise<T | undefined>;
	get(fallbackValue: T): Promise<T>;

	/**
	 * Retrieves a secret value by version.
	 *
	 * @param fallbackValue - Will be returned if no secret value found
	 * @param version - The secret version to retrieve. Defaults to `'latest'`.
	 * @returns The parsed secret of type `T`, or `undefined` if not found or empty.
	 */
	async get(fallbackValue?: T, version: string = 'latest'): Promise<T | undefined> {
		const secretKey = `${this.secretKey}/versions/${version}`;
		const rawSecret = await ModuleBE_SecretManager.getSecret(secretKey);
		if (!rawSecret)
			return fallbackValue ?? undefined;

		return JSON.parse(rawSecret) as T;
	}

	/**
	 * Updates the secret by adding a new version with the provided value.
	 *
	 * @param secret - The value to store, serialized as JSON.
	 * @returns The full name of the secret (not the version).
	 */
	async set(secret: T) {
		return await ModuleBE_SecretManager.updateSecret(this.secretKey, JSON.stringify(secret));
	}

	/**
	 * Retrieves the previous enabled version of the secret, if available.
	 *
	 * @returns The parsed previous version of the secret as type `T`, or `undefined` if no prior version exists or is disabled.
	 */
	async previous(reverseIndex = 1): Promise<T | undefined> {
		const versions = await ModuleBE_SecretManager.listSecretVersions(this.secretKey);
		if (versions.length < reverseIndex + 1)
			return undefined;

		const previous = versions[reverseIndex];
		const rawSecret = await ModuleBE_SecretManager.getSecret(previous.name!);
		if (!rawSecret)
			return undefined;

		return JSON.parse(rawSecret) as T;
	}

	/**
	 * Returns the creation timestamp of the most recent enabled secret version.
	 *
	 * @returns A `Date` representing the latest version's creation time, or `undefined` if not available.
	 */
	async modifiedTimestamp(): Promise<number> {
		const versions = await ModuleBE_SecretManager.listSecretVersions(this.secretKey);
		if (!versions.length)
			return 0;

		const latest = versions[0];
		const metadata = await ModuleBE_SecretManager.getSecretVersionMetadata(latest.name!);
		return metadata.createTime ? Number(metadata.createTime.seconds) * 1000 : 0;
	}

}

export class ModuleBE_SecretManager_Class
	extends Module<Config> {

	constructor() {
		super();
	}

	public async getSecret(secretName: string) {
		let secretContent: string | undefined;
		try {
			const [version] = await this.getSecretManagerClient().accessSecretVersion({
				name: secretName
			}, {});

			secretContent = version.payload?.data?.toString();
		} catch (e: any) {
			this.logError(`Failed to get secret: ${secretName}`, e);
			throw e;
		}

		return secretContent;
	}

	public async updateSecret(secretKey: string, data: string): Promise<string> {
		const secret = await this.getOrCreateSecret(secretKey);
		if (!secret.name)
			throw new MUSTNeverHappenException(`Missing secret.name when updating: ${secretKey}`);

		await this._updateSecret(secret, data);
		return secret.name;
	}

	public async upsertSecret(props: SecretUpsertProps): Promise<string> {
		const secretKey = `projects/${props.parent}/secrets/${props.name}`;
		const secret = await this.getOrCreateSecret(secretKey);
		if (!secret.name)
			throw new MUSTNeverHappenException(`Missing secret.name when updating: ${secretKey}`);

		await this._updateSecret(secret, props.data);
		return secret.name;
	}

	public async listSecretVersions(secretKey: string): Promise<google.cloud.secretmanager.v1.ISecretVersion[]> {
		const [versions] = await this.getSecretManagerClient().listSecretVersions({parent: secretKey});

		return versions
			.filter(v => v.state === 'ENABLED')
			.sort((a, b) => {
				const aVer = parseInt(a.name!.split('/').pop() ?? '0', 10);
				const bVer = parseInt(b.name!.split('/').pop() ?? '0', 10);
				return bVer - aVer;
			});
	}

	public async getSecretVersionMetadata(versionName: string): Promise<google.cloud.secretmanager.v1.ISecretVersion> {
		const [version] = await this.getSecretManagerClient().getSecretVersion({name: versionName});
		return version;
	}


	//######################### Inner Logic #########################

	private getOrCreateSecret = async (secretKey: string): Promise<google.cloud.secretmanager.v1.ISecret> => {
		try {
			const [secret] = await this.getSecretManagerClient().getSecret({name: secretKey});
			//Secret exists, return it
			this.logVerbose(`Secret exists: ${secret.name}`);
			return secret;
		} catch (err: any) {
			if (err.code !== 5) { // error 5 means secret does not exist, so we continue on to create it
				this.logError('Failed to get secret', err);
				throw err;
			}

			const secretParts = secretKey.split('/');
			//Secret did not exist, create and return it
			const [secret] = await this.getSecretManagerClient().createSecret({
				parent: `projects/${secretParts[1]}`,
				secretId: secretParts[3],
				secret: {
					name: secretParts[3],
					replication: {
						automatic: {},
					}
				}
			});
			this.logDebug(`Created secret ${secret.name}`);
			return secret;
		}
	};

	private _updateSecret = async (secret: google.cloud.secretmanager.v1.ISecret, data: string): Promise<void> => {
		try {
			const [version] = await this.getSecretManagerClient().addSecretVersion({
				parent: secret.name,
				payload: {
					data: Buffer.from(data, 'utf-8')
				},
			});
			this.logVerbose(`Updated secret ${secret.name} version ${version.name}`);
		} catch (err: any) {
			this.logError(`Failed to update secret ${secret.name}`);
			throw err;
		}
	};

	private getSecretManagerClient(authKey?: string) {
		if (!authKey)
			return new SecretManagerServiceClient();

		throw new NotImplementedYetException('Auth key not implemented yet');
	}
}

export const ModuleBE_SecretManager = new ModuleBE_SecretManager_Class();