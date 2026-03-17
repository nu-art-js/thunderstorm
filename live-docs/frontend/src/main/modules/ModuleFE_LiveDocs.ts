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
import {ApiCaller} from '@nu-art/http-client';
import {ToastBuilder} from '@nu-art/thunder-widgets';
import {DB_Document} from '@nu-art/live-docs-shared';
import {ApiDef_LiveDoc, API_LiveDoc} from '@nu-art/live-docs-shared/api';
import {DefaultLiveDocEditor} from '../utils.js';


export type LiveDocActionResolver = (doc: DB_Document) => ToastBuilder;

export class ModuleFE_LiveDocs_Class
	extends Module {

	private docs: { [key: string]: DB_Document } = {};
	private toasterResolver: LiveDocActionResolver = DefaultLiveDocEditor;

	constructor() {
		super();
	}

	protected init(): void {
	}

	onGotDoc = async (response: DB_Document, key: string) => {
		const _doc = this.docs[key];
		if (_doc && response.document === _doc.document)
			return;

		this.docs[key] = response;
		this.toasterResolver(response).show();
	};

	@ApiCaller(ApiDef_LiveDoc.get, {
		onComplete: (m, ctx) => m.onGotDoc(ctx.response, ctx.params!.key)
	})
	async get(params: API_LiveDoc['get']['Params']): Promise<API_LiveDoc['get']['Response']> {
		void params;
		return undefined as unknown as API_LiveDoc['get']['Response'];
	}

	@ApiCaller(ApiDef_LiveDoc.upsert, {
		onComplete: (m, ctx) => m.onGotDoc(ctx.response, ctx.body!.key)
	})
	async upsert(body: API_LiveDoc['upsert']['Body']): Promise<API_LiveDoc['upsert']['Response']> {
		void body;
		return undefined as unknown as API_LiveDoc['upsert']['Response'];
	}

	@ApiCaller(ApiDef_LiveDoc.history, {
		onComplete: (m, ctx) => m.onGotDoc(ctx.response, ctx.params!.key)
	})
	async history(params: API_LiveDoc['history']['Params']): Promise<API_LiveDoc['history']['Response']> {
		void params;
		return undefined as unknown as API_LiveDoc['history']['Response'];
	}

	getDoc(key: string) {
		return this.docs[key];
	}

	setActionsResolver(resolver: LiveDocActionResolver) {
		this.toasterResolver = resolver;
	}

}

export const ModuleFE_LiveDocs = new ModuleFE_LiveDocs_Class();
