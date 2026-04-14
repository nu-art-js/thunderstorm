/**
 * Created by tacb0ss on 07/05/2018.
 */

import {ImplementationMissingException, Module, NotImplementedYetException} from '@nu-art/ts-common';
import {google} from 'googleapis';
import {AuthClient, GoogleAuth, JWT, JWTInput,} from 'google-auth-library';

type AuthClient_ = typeof google.auth.getClient
type ClientOptions = NonNullable<Parameters<AuthClient_>[0]>['clientOptions']
export type AuthEntryConfig = {
	credentials: JWT_Input | string;
	mongo?: {
		mongoUrl?: string;
		firestoreMongo?: {
			firestoreUid: string;
			firestoreLocation: string;
		};
	};
};

type AuthModuleConfig = {
	auth: {
		[k: string]: JWT_Input | string | AuthEntryConfig
	}
}
export type JWT_Input = JWTInput

export class ModuleBE_Auth_Class
	extends Module<AuthModuleConfig> {
	constructor() {
		super();
		this.setDefaultConfig({auth: {}});
	}

	getAuth(authKey: string, scopes: string[], clientOptions?: ClientOptions): ({ auth: GoogleAuth }) {
		const conf = this.getCredentials(authKey);
		const base =
						typeof conf === 'string'
							? {keyFile: conf}
							: {credentials: conf};

		const auth = new GoogleAuth<AuthClient>({...base, scopes, clientOptions});
		return {auth};
	}

	getAuthConfig(authKey: string): JWT_Input | string | AuthEntryConfig {
		const projectAuth = this.config.auth[authKey];

		if (!projectAuth)
			throw new ImplementationMissingException(`Config of authKey: ${authKey} was not found`);

		return projectAuth;
	}

	getCredentials(authKey: string): JWT_Input | string {
		const config = this.getAuthConfig(authKey);
		if (typeof config === 'string')
			return config;

		if ('credentials' in config)
			return (config as AuthEntryConfig).credentials;

		return config as JWT_Input;
	}

	async getJWT(authKey: string, scopes: string[]) {
		const credentials = this.getCredentials(authKey);
		if (typeof credentials === 'string')
			return new JWT({keyFile: credentials, scopes}).authorize();

		throw new NotImplementedYetException('cannot create a JWT from a raw credentials.. need path to file');
	}
}

export const ModuleBE_Auth = new ModuleBE_Auth_Class();