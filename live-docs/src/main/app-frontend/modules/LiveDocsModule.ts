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
import {ToastBuilder, XhrHttpModule} from '@nu-art/thunderstorm/frontend';
import {DB_Document, LiveDocReqParams} from '../../shared/types';
import {ApiDef_LiveDoc_Get, ApiDef_LiveDoc_History, ApiDef_LiveDoc_Upsert, ApiStruct_LiveDoc} from '../../shared/api';
import {ApiDef, ApiDefCaller, BaseHttpRequest, BodyApi, QueryApi} from '@nu-art/thunderstorm';
import {DefaultLiveDocEditor} from '../utils';
import {response} from 'express';


export type LiveDocActionResolver = (doc: DB_Document) => ToastBuilder;

function apiWithQuery<T extends QueryApi<any, any, any>>(apiDef: ApiDef<T>, _processor?: (response: T['R'], params: T['P']) => Promise<any>) {
	return (params: T['P']) => {
		const request: BaseHttpRequest<T> = XhrHttpModule
			.createRequest(apiDef)
			.setUrlParams(params)
			.setOnComplete();

		return {
			request,
			execute: () => {
				request.execute(async (response) => {
					await _processor?.(response, params);
				});
			},
			executeSync: async () => {
				const response = request.executeSync();
				await _processor?.(response, params);
			}
		};
	};
}

function apiWithBody<T extends BodyApi<any, any, any>>(apiDef: ApiDef<T>, _processor?: (response: T['R'], body: T['B']) => Promise<any>) {
	return (body: T['B'], processor?: (response: T['R']) => Promise<any>) => {
		XhrHttpModule
			.createRequest(apiDef)
			.setJsonBody(body)
			.execute(async () => {
				await _processor?.(response, body);
				await processor?.(response);
			});
	};
}

export class LiveDocsModule_Class
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
		history: apiWithQuery(ApiDef_LiveDoc_History, this.onGotDoc)
	};
}

export const LiveDocsModule = new LiveDocsModule_Class();
