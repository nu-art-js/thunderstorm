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
import {ImplementationMissingException, Module, TS_Object} from '@nu-art/ts-common';

import {ApiException} from '../../exceptions';
import {ServerApi} from '../server/server-api';
import {ServerApi_Middleware} from '../../utils/types';
import {HeaderKey} from '../server/HeaderKey';
import {TypedApi} from '../../../shared';
import {MemStorage} from '@nu-art/ts-common/mem-storage/MemStorage';
import {MemKey_HttpRequestOriginalUrl} from '../server/consts';


type ProxyConfig = {
	extras?: TS_Object
	urls: string[],
	secret: string
};

export type RemoteProxyConfig = {
	remotes: {
		[proxyId: string]: ProxyConfig
	}
	secretHeaderName?: string
	proxyHeaderName?: string
}

export class ModuleBE_RemoteProxy_Class<Config extends RemoteProxyConfig>
	extends Module<Config> {

	readonly Middleware: ServerApi_Middleware = async (mem: MemStorage) => {
		ModuleBE_RemoteProxy.assertSecret(mem);
	};
	private secretHeader!: HeaderKey;
	private proxyHeader!: HeaderKey;

	protected init(): void {
		if (!this.config)
			throw new ImplementationMissingException('MUST specify config for this module!!');

		if (!this.config.secretHeaderName)
			this.config.secretHeaderName = 'x-secret';

		if (!this.config.proxyHeaderName)
			this.config.proxyHeaderName = 'x-proxy';

		this.secretHeader = new HeaderKey(this.config.secretHeaderName);
		this.proxyHeader = new HeaderKey(this.config.proxyHeaderName);
	}

	assertSecret(mem: MemStorage) {
		if (!this.secretHeader || !this.proxyHeader)
			throw new ImplementationMissingException('MUST add RemoteProxy to your module list!!!');

		const secret = this.secretHeader.get(mem);
		const proxyId = this.proxyHeader.get(mem);

		const expectedSecret = this.config.remotes[proxyId];

		if (!proxyId)
			throw new ApiException(403, `Missing proxy declaration in config for ${proxyId} !!`);

		if (!secret)
			throw new ApiException(403, `Missing secret !!`);

		if (!expectedSecret)
			throw new ApiException(403, `ProxyId '${proxyId}' is not registered for remote access !!`);

		if (expectedSecret.secret !== secret)
			throw new ApiException(403, `Secret does not match for proxyId: ${proxyId}`);

		const requestUrl = MemKey_HttpRequestOriginalUrl.get(mem);
		if (!expectedSecret.urls?.find(urlPattern => requestUrl.match(urlPattern)))
			throw new ApiException(403, `Requested url '${requestUrl}' is not allowed from proxyId: ${proxyId}`);

		return expectedSecret.extras;
	}
}

export class ServerApi_Proxy<API extends TypedApi<any, any, any, any>>
	extends ServerApi<API> {
	private readonly api: ServerApi<API>;

	public constructor(api: ServerApi<API>) {
		// super(api.method, `${api.relativePath}/proxy`);
		super({...api.apiDef, path: `${api.apiDef.path}/proxy`});
		this.api = api;
		this.setMiddlewares(ModuleBE_RemoteProxy.Middleware);
	}

	protected async process(mem: MemStorage): Promise<API['R']> {
		// @ts-ignore
		return this.api.process(mem);
	}
}

export class ServerApi_Alternate<API extends TypedApi<any, any, any, any>>
	extends ServerApi<API> {
	private readonly api: ServerApi<API>;

	public constructor(api: ServerApi<API>, pathSuffix: string) {
		// super(api.method, `${api.relativePath}/proxy`);
		super({...api.apiDef, path: `${api.apiDef.path}/${pathSuffix}`});
		this.api = api;
	}

	protected async process(mem: MemStorage): Promise<API['R']> {
		// @ts-ignore
		return this.api.process(mem);
	}
}

export const ModuleBE_RemoteProxy = new ModuleBE_RemoteProxy_Class();