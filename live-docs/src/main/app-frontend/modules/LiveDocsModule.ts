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
import {ToastBuilder, ToastModule, XhrHttpModule} from '@nu-art/thunderstorm/frontend';
import {DB_Document, LiveDocHistoryReqParams, LiveDocReqParams, Request_UpdateDocument} from '../../shared/types';
import {setDefaultLiveDocEditor} from '../utils';
import {ApiDef_LiveDoc_Get, ApiDef_LiveDoc_History, ApiDef_LiveDoc_Upsert, ApiStruct_LiveDoc} from '../../shared/api';
import {ApiDef, ApiDefCaller, TypedApi} from '@nu-art/thunderstorm';


export const RequestKey_FetchDoc = 'FetchDoc';
export const RequestKey_UpdateDoc = 'UpdateDoc';
export const RequestKey_UpdatePointer = 'UpdatePointer';

export type LiveDocActionResolver = (docKey: string) => ToastBuilder;

function createApiFe(apiDef: ApiDef<TypedApi<any, any, any, any>>) {
	return XhrHttpModule
		.createRequest(apiDef)
		.setUrlParams(params)
		.setRelativeUrl('/v1/live-docs/get')
		.setLabel(`Fetch live-docs for key: ${docKey}`)
		.setOnError(`Error fetching live-docs for key: ${docKey}`)
		.execute(async (_response) => {
			const response = _response as DB_Document;

			const _doc = this.docs[docKey];
			if (_doc && response.document === _doc.document)
				return;

			this.docs[docKey] = response;
			this._showDocImpl(docKey, this.docs[docKey]);
		});

}

export class LiveDocsModule_Class
	extends Module
	implements ApiDefCaller<ApiStruct_LiveDoc> {

	private docs: { [key: string]: DB_Document } = {};
	private toasterResolver!: LiveDocActionResolver;

	v1 = {
		get: createApiFe(ApiDef_LiveDoc_Get),
		// get: this.showLiveDoc,
		upsert: this.update,
		history: this.changeHistory
	};

	v2 = {
		upsert: this.update,
	};

	set showDocImpl(value: (docKey: string, doc: DB_Document) => void) {
		this._showDocImpl = value;
	}

	constructor() {
		super();
	}

	protected init(): void {
		setDefaultLiveDocEditor();
	}

	get(key: string) {
		return this.docs[key];
	}

	setActionsResolver(resolver: LiveDocActionResolver) {
		this.toasterResolver = resolver;
	}

	private _showDocImpl = (docKey: string, doc: DB_Document) => {
		this.toasterResolver(docKey).show();
	};

	private showLiveDoc(params: LiveDocReqParams): void {
		const docKey = params.key;
		const doc = this.docs[docKey];
		if (doc)
			this._showDocImpl(docKey, doc);
		else
			ToastModule.toastInfo('Loading...');

		XhrHttpModule
			.createRequest(ApiDef_LiveDoc_Get, `${RequestKey_FetchDoc}-${docKey}`)
			.setUrlParams(params)
			.setRelativeUrl('/v1/live-docs/get')
			.setLabel(`Fetch live-docs for key: ${docKey}`)
			.setOnError(`Error fetching live-docs for key: ${docKey}`)
			.execute(async (_response) => {
				const response = _response as DB_Document;

				const _doc = this.docs[docKey];
				if (_doc && response.document === _doc.document)
					return;

				this.docs[docKey] = response;
				this._showDocImpl(docKey, this.docs[docKey]);
			});
	}

	private update(liveDoc: Request_UpdateDocument) {
		const docKey = liveDoc.key;

		XhrHttpModule
			.createRequest(ApiDef_LiveDoc_Upsert, `${RequestKey_UpdateDoc}-${docKey}`)
			.setJsonBody(liveDoc)
			.setRelativeUrl('/v1/live-docs/update')
			.setLabel(`Update live-docs with key: ${docKey}`)
			.setOnError(`Error updating live-docs for key: ${docKey}`)
			.execute(async () => this.showLiveDoc(liveDoc));
	}

	private changeHistory(params: LiveDocHistoryReqParams) {
		const {key, change} = params;
		XhrHttpModule
			.createRequest(ApiDef_LiveDoc_History, `${RequestKey_UpdatePointer}-${key}`)
			.setUrlParams(params)
			.setRelativeUrl('/v1/live-docs/change-history')
			.setLabel(`${change} live-docs history with key: ${key}`)
			.setOnError(`Error ${change} live-docs history for key: ${key}`)
			.execute(async () => this.showLiveDoc(params));
	}
}

export const LiveDocsModule = new LiveDocsModule_Class();
