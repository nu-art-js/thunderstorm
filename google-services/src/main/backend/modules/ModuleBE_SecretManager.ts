import {__stringify, BadImplementationException, Module, MUSTNeverHappenException} from '@nu-art/ts-common';
import {SecretManagerServiceClient, v1} from '@google-cloud/secret-manager';
import {google} from '@google-cloud/secret-manager/build/protos/protos';
import {AuthObject, ModuleBE_Auth} from './ModuleBE_Auth';

type Config = {
	authKey: string
}

type SecretUpsertProps = {
	//Path to secret, i.e. "projects/{parent}"
	parent: string;
	//Secret name
	name: string;
	//Secret data
	data: string
}

export class ModuleBE_SecretManager_Class
	extends Module<Config> {

	constructor() {
		super();
	}

	protected init() {
		this.secretManager();
	}

	private secretManager(authKey = this.config.authKey) {
		let auth: AuthObject | undefined;
		if (authKey)
			auth = ModuleBE_Auth.getAuth(authKey, []);

		return new SecretManagerServiceClient(auth);
	}

	public async getSecret(secretName: string, authKey = this.config.authKey) {
		try {
			const [version] = await this.secretManager(authKey).accessSecretVersion({
				name: secretName
			});

			const secretContent = version.payload?.data?.toString();
			if (!secretContent)
				throw new MUSTNeverHappenException(`Got empty content for secret: ${secretName}`);

			return secretContent;
		} catch (e: any) {
			this.logError(`Failed to get secret: ${secretName}`, __stringify(e));
			throw e;
		}
	}

	public async upsertSecret(props: SecretUpsertProps, authKey = this.config.authKey): Promise<string> {
		const secretManager = this.secretManager(authKey);
		const secret = await this.getOrCreateSecret(secretManager, props.parent, props.name);
		if (!secret.name)
			throw new BadImplementationException(`Got string with no name on it for ${__stringify(props)}`);

		await this.updateSecret(secretManager, secret, props.data);
		return secret.name;
	}

	//######################### Inner Logic #########################

	private getOrCreateSecret = async (secretManager: v1.SecretManagerServiceClient, parent: string, name: string): Promise<google.cloud.secretmanager.v1.ISecret> => {
		try {
			const pathToSecret = `projects/${parent}/secrets/${name}`;
			const [secret] = await secretManager.getSecret({name: pathToSecret});
			//Secret exists, return it
			this.logVerbose(`Secret exists: ${secret.name}`);
			return secret;
		} catch (err: any) {
			if (err.code !== 5) { // error 5 means secret does not exist, so we continue on to create it
				this.logError('Failed to get secret', err);
				throw err;
			}
			//Secret did not exist, create and return it
			const [secret] = await secretManager.createSecret({
				parent: `projects/${parent}`,
				secretId: name,
				secret: {
					name: name,
					replication: {
						automatic: {},
					}
				}
			});
			this.logVerbose(`Created secret ${secret.name}`);
			return secret;
		}
	};

	private updateSecret = async (secretManager: v1.SecretManagerServiceClient, secret: google.cloud.secretmanager.v1.ISecret, data: string): Promise<void> => {
		try {
			const [version] = await secretManager.addSecretVersion({
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
}

export const ModuleBE_SecretManager = new ModuleBE_SecretManager_Class();