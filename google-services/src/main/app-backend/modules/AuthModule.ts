/**
 * Created by tacb0ss on 07/05/2018.
 */

import {
	ImplementationMissingException,
	Module
} from "@nu-art/ts-common";
import {
	JWT,
	GoogleAuth,
	JWTInput,
} from "google-auth-library";

type AuthModuleConfig = {
	auth: {
		[k: string]: JWTInput | string
	}
}

export class AuthModule_Class
	extends Module<AuthModuleConfig> {

	getAuth(configKey?: string, projectId?: string, version: 'v1' | 'v2' = 'v2') {
		let projectAuth: JWTInput | string | undefined;
		if (!configKey) {
			projectAuth = '../.trash/service-account.json';
		} else {
			projectAuth = this.config?.auth?.[configKey];
		}

		if (!projectAuth) {
			throw new ImplementationMissingException(`Config of AuthModule_Class for project ${projectId} was not found`);
		}

		let auth;

		if (typeof projectAuth === 'string') {
			auth = new GoogleAuth(
				{
					keyFile: projectAuth,
					projectId,
					scopes: ['https://www.googleapis.com/auth/cloud-platform'],
				}
			);
		} else {
			auth = new GoogleAuth(
				{
					credentials: projectAuth,
					projectId,
					scopes: ['https://www.googleapis.com/auth/cloud-platform'],
				}
			);
		}

		return {version, auth};
	}

	async getToken() {
		return new JWT({keyFile: '../service-account.json', scopes: ['https://www.googleapis.com/auth/cloud-platform']}).authorize();
	};
}

export const AuthModule = new AuthModule_Class();