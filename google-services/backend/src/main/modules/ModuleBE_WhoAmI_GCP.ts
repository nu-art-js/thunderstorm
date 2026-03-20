import {Module, tsValidateMandatoryBoolean} from '@nu-art/ts-common';
import {GoogleAuth} from 'google-auth-library';


type Config = { printEnvVars: boolean, printIdentity: boolean };
const defaultConfig: Config = {printEnvVars: false, printIdentity: true};
const configValidator = {
	printEnvVars: tsValidateMandatoryBoolean,
	printIdentity: tsValidateMandatoryBoolean
};

export class ModuleBE_WhoAmI_GCP_Class
	extends Module<Config> {

	constructor() {
		super();
		this.setDefaultConfig(defaultConfig);
		this.setConfigValidator(configValidator);
	}


	init() {
		this.printCallerIdentity().then(({projectId, info}) => {
			if (this.config.printEnvVars)
				this.logInfo('env: ', process.env);

			if (this.config.printIdentity) {
				this.logInfo('GOOGLE_APPLICATION_CREDENTIALS: ', process.env.GOOGLE_APPLICATION_CREDENTIALS ?? 'not set');
				this.logInfo(`🔐 GCP Caller Identity: ${info.email || info.sub}`);
				this.logInfo(`🏗️ GCP Project ID: ${projectId}`);
			}
		}).catch(err => {
			this.logError('error: ', err);
		});
	}

	printCallerIdentity = async () => {
		const auth = new GoogleAuth({scopes: 'https://www.googleapis.com/auth/cloud-platform'});
		const client = await auth.getClient();
		const projectId = await auth.getProjectId();
		const token = await client.getAccessToken();
		const res = await fetch(`https://oauth2.googleapis.com/tokeninfo?access_token=${token.token}`);
		const info = await res.json();
		return {projectId, info};
	};
}

export const ModuleBE_WhoAmI_GCP = new ModuleBE_WhoAmI_GCP_Class();
