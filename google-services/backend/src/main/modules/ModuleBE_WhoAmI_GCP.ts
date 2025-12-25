import {Module} from '@nu-art/ts-common';
import {GoogleAuth} from 'google-auth-library';


export class ModuleBE_WhoAmI_GCP_Class
	extends Module {

	init() {

		this.printCallerIdentity().then(({projectId, info}) => {
			this.logInfo('env: ', process.env);
			this.logInfo('GOOGLE_APPLICATION_CREDENTIALS: ', process.env.GOOGLE_APPLICATION_CREDENTIALS ?? 'not set');
			this.logInfo(`🔐 GCP Caller Identity: ${info.email || info.sub}`);
			this.logInfo(`🏗️ GCP Project ID: ${projectId}`);
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
