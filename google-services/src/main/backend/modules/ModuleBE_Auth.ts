/**
 * Created by tacb0ss on 07/05/2018.
 */

import {ImplementationMissingException, Module, NotImplementedYetException} from '@nu-art/ts-common';
import {GoogleAuth, JWT, JWTInput,} from 'google-auth-library';
import {JWTOptions} from 'google-auth-library/build/src/auth/jwtclient';
import {OAuth2ClientOptions} from 'google-auth-library/build/src/auth/oauth2client';
import {UserRefreshClientOptions} from 'google-auth-library/build/src/auth/refreshclient';


type AuthModuleConfig = {
	auth: {
		[k: string]: JWT_Input | string
	}
}
type Version = 'v1' | 'v2'
export type JWT_Input = JWTInput

export class ModuleBE_Auth_Class
	extends Module<AuthModuleConfig> {
	constructor() {
		super();
		this.setDefaultConfig({auth: {}});
	}

	getAuth<T extends Version = 'v2'>(authKey: string, scopes: string[], version: T = 'v2' as T, clientOptions?: JWTOptions | OAuth2ClientOptions | UserRefreshClientOptions) {
		const authConfig = this.getAuthConfig(authKey);

		let opts;
		if (typeof authConfig === 'string') {
			opts = {keyFile: authConfig, scopes, clientOptions};
		} else {
			opts = {credentials: authConfig, scopes, clientOptions};
		}

		return {version, auth: new GoogleAuth(opts)};
	}

	getAuthConfig(authKey: string) {
		const projectAuth: JWT_Input | string | undefined = this.config.auth[authKey];

		if (!projectAuth)
			throw new ImplementationMissingException(`Config of AuthModule_Class for authKey: ${authKey} was not found`);

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