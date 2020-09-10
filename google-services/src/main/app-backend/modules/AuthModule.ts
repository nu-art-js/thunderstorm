/**
 * Created by tacb0ss on 07/05/2018.
 */

import {Module} from "@nu-art/ts-common";
import {
	JWT,
	GoogleAuth
} from "google-auth-library";


export class AuthModule_Class
	extends Module {

	public auth1!: { auth: any; version: string };
	public auth2!: { auth: any; version: string };

	protected init() {
		const auth = new GoogleAuth({
			                            keyFile: '../.trash/service-account.json',
			                            scopes: ['https://www.googleapis.com/auth/cloud-platform'],
		                            });

		this.auth1 = {
			version: 'v1',
			auth: auth,
		};

		this.auth2 = {
			version: 'v2',
			auth: auth
		};
	}

	async getToken() {
		return new JWT({keyFile: '../service-account.json', scopes: ['https://www.googleapis.com/auth/cloud-platform']}).authorize();
	};
}

export const AuthModule = new AuthModule_Class();