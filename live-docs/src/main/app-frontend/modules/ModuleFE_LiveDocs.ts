/*
 * Live-Docs will allow you to add and edit tool-tips from within your app...
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

import {Module} from '@nu-art/ts-common';
import {apiWithBody, apiWithQuery, ToastBuilder} from '@nu-art/thunderstorm/frontend';
import {DB_Document, LiveDocReqParams} from '../../shared/types';
import {ApiDef_LiveDoc_Get, ApiDef_LiveDoc_History, ApiDef_LiveDoc_Upsert, ApiStruct_LiveDoc} from '../../shared/api';
import {ApiDefCaller} from '@nu-art/thunderstorm';
import {DefaultLiveDocEditor} from '../utils';


export type LiveDocActionResolver = (doc: DB_Document) => ToastBuilder;

export class ModuleFE_LiveDocs_Class
	extends Module
	implements ApiDefCaller<ApiStruct_LiveDoc> {

	private docs: { [key: string]: DB_Document } = {};
	private toasterResolver: LiveDocActionResolver = DefaultLiveDocEditor;

	constructor() {
		super();
	}

	protected init(): void {
	}

	onGotDoc = async (response: DB_Document, params: LiveDocReqParams) => {
		const _doc = this.docs[params.key];
		if (_doc && response.document === _doc.document)
			return;

		this.docs[params.key] = response;
		this.toasterResolver(response).show();
	};

	get(key: string) {
		return this.docs[key];
	}

	setActionsResolver(resolver: LiveDocActionResolver) {
		this.toasterResolver = resolver;
	}

	v1 = {
		get: apiWithQuery(ApiDef_LiveDoc_Get, this.onGotDoc),
		upsert: apiWithBody(ApiDef_LiveDoc_Upsert, this.onGotDoc),
		history: apiWithQuery(ApiDef_LiveDoc_History, this.onGotDoc),
	};
}

export const ModuleFE_LiveDocs = new ModuleFE_LiveDocs_Class();
