/*
 * @nu-art/oauth-frontend - OAuth consent API client
 * Copyright (C) 2026 Adam van der Kruk aka TacB0sS
 * Licensed under the Apache License, Version 2.0
 */

import {ApiCaller} from '@nu-art/http-client';
import {Module} from '@nu-art/ts-common';
import type {API_OAuth} from '@nu-art/oauth-shared';
import {ApiDef_OAuth} from '@nu-art/oauth-shared';

export const QueryParam_AuthReqId = 'authReqId';

export class ModuleFE_OAuth_Class
	extends Module {

	@ApiCaller(ApiDef_OAuth.consentContext)
	async loadConsentContext(params: API_OAuth['consentContext']['Params']): Promise<API_OAuth['consentContext']['Response']> {
		void params;
		return undefined as unknown as API_OAuth['consentContext']['Response'];
	}

	@ApiCaller(ApiDef_OAuth.completeAuthorization)
	async completeAuthorization(body: API_OAuth['completeAuthorization']['Body']): Promise<API_OAuth['completeAuthorization']['Response']> {
		void body;
		return undefined as unknown as API_OAuth['completeAuthorization']['Response'];
	}
}

export const ModuleFE_OAuth = new ModuleFE_OAuth_Class();

export const ModulePackFE_OAuth = [ModuleFE_OAuth];
