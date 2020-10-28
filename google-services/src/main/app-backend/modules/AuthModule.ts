/**
 * Created by tacb0ss on 07/05/2018.
 */

import {
	ImplementationMissingException,
	Module,
	NotImplementedYetException
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
type Version = 'v1' | 'v2'

export class AuthModule_Class
	extends Module<AuthModuleConfig> {

	getAuth<T extends Version = "v2">(authKey: string, scopes: string[], version: T = 'v2' as T) {
		const authConfig = this.getAuthConfig(authKey)

		let opts;
		if (typeof authConfig === 'string') {
			opts = {keyFile: authConfig, scopes,};
		} else {
			opts = {credentials: authConfig, scopes,};
		}

		return {version, auth: new GoogleAuth(opts)};
	}

	getAuthConfig(authKey: string) {
		const projectAuth: JWTInput | string | undefined = this.config.auth[authKey];

		if (!projectAuth)
			throw new ImplementationMissingException(`Config of AuthModule_Class for authKey: ${authKey} was not found`);

		return projectAuth;
	}

	async getJWT(authKey: string, scopes: string[]) {
		const authConfig = this.getAuthConfig(authKey)
		if (typeof authConfig === 'string') {
			return new JWT({keyFile: authConfig, scopes}).authorize();
		}

		throw new NotImplementedYetException("cannot create a JWT from a raw credentials.. need path to file")
	};
}

export const AuthModule = new AuthModule_Class();