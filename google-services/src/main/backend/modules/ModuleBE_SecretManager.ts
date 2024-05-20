import {__stringify, Module, MUSTNeverHappenException} from '@nu-art/ts-common';
import {SecretManagerServiceClient, v1} from '@google-cloud/secret-manager';

type Config = {}

export class ModuleBE_SecretManager_Class
	extends Module<Config> {
	private secretManagerClient: v1.SecretManagerServiceClient;

	constructor() {
		super();
		this.secretManagerClient = new SecretManagerServiceClient();
	}

	public async getSecret(secretName: string) {
		try {
			const [version] = await this.secretManagerClient.accessSecretVersion({
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
}

export const ModuleBE_SecretManager = new ModuleBE_SecretManager_Class();