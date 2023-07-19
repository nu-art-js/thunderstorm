/*
 * Thunderstorm is a full web app framework!
 *
 * Typescript & Express backend infrastructure that natively runs on firebase function
 * Typescript & React frontend infrastructure
 *
 * Copyright (C) 2020 Adam van der Kruk aka TacB0sS
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */


import {DBApiConfig, ModuleBE_BaseDBV2} from '@nu-art/db-api-generator/backend/ModuleBE_BaseDBV2';
import {DBDef_RemoteProxy, ProxyServiceAccount} from '../../shared/proxy-v2/';
import {RequestBody_CreateAccountToken, ResponseBody_CreateAccountToken} from '../../shared/proxy-v2';
import {ModuleBE_Account_Class} from '../modules/ModuleBE_Account';
import {BadImplementationException, currentTimeMillis} from '@nu-art/ts-common';

export type RemoteProxyConfig = DBApiConfig<ProxyServiceAccount> & {}

export class ModuleBE_v2_RemoteProxyDB_Class
	extends ModuleBE_BaseDBV2<ProxyServiceAccount, RemoteProxyConfig> {

	constructor() {
		super(DBDef_RemoteProxy);
	}

	createAccountToken = async (body: RequestBody_CreateAccountToken): Promise<ResponseBody_CreateAccountToken> => {
		const serviceAccount = await this.query.unique(body.serviceAccountId);
		if (!serviceAccount)
			throw new BadImplementationException(`Received the _id of a non-existing service account! (${body.serviceAccountId})`);

		const now = currentTimeMillis();
		const sessionDataToTokenize = {
			name: serviceAccount.label,
			email: serviceAccount.email,
			creationTimestamp: now,
			expirationTimestamp: now + body.ttl,
			claims: serviceAccount.extra
		};

		const token = await ModuleBE_Account_Class.encodeSessionData(sessionDataToTokenize);

		//todo create DB_Session?

		return {token: token};
	};
}

export const ModuleBE_v2_RemoteProxyDB = new ModuleBE_v2_RemoteProxyDB_Class();