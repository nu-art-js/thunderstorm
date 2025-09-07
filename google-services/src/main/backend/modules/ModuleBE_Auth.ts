/**
 * Created by tacb0ss on 07/05/2018.
 */

import {ImplementationMissingException, Module, NotImplementedYetException} from '@nu-art/ts-common';
import {google} from 'googleapis';
import {AuthClient, GoogleAuth, JWT, JWTInput,} from 'google-auth-library';

type AuthClient_ = typeof google.auth.getClient
type ClientOptions = NonNullable<Parameters<AuthClient_>[0]>['clientOptions']
type AuthModuleConfig = {
	auth: {
		[k: string]: JWT_Input | string
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
		const conf = this.getAuthConfig(authKey);
		const base =
						typeof conf === 'string'
							? {keyFile: conf}
							: {credentials: conf}; // JWTInput

		const auth = new GoogleAuth<AuthClient>({...base, scopes, clientOptions});
		return {auth};
	}

	getAuthConfig(authKey: string) {
		const projectAuth: JWT_Input | string | undefined = this.config.auth[authKey];

		if (!projectAuth)
			throw new ImplementationMissingException(`Config of authKey: ${authKey} was not found`);

		return projectAuth;
	}

	async getJWT(authKey: string, scopes: string[]) {
		const authConfig = this.getAuthConfig(authKey);
		if (typeof authConfig === 'string') {
			return new JWT({keyFile: authConfig, scopes}).authorize();
		}

		throw new NotImplementedYetException('cannot create a JWT from a raw credentials.. need path to file');
	}
}

export const ModuleBE_Auth = new ModuleBE_Auth_Class();