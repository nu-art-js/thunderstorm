/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
 *
 * Copyright (C) 2020 Intuition Robotics
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

import {Module} from "@intuitionrobotics/ts-common";
import {
	XhrHttpModule,
	ToastBuilder,
	ToastModule
} from "@intuitionrobotics/thunderstorm/frontend";
import {
	DB_Document,
	Request_UpdateDocument
} from "../../shared/types";
import {
	ApiGetLiveDoc,
	ApiHistoryLiveDocs,
	ApiUpdateLiveDocs
} from "../../shared/api";
import {setDefaultLiveDocEditor} from "../utils";
import {HttpMethod} from "@intuitionrobotics/thunderstorm";

export const RequestKey_FetchDoc = "FetchDoc";
export const RequestKey_UpdateDoc = "UpdateDoc";


export type LiveDocActionResolver = (docKey: string) => ToastBuilder;

export class LiveDocsModule_Class
	extends Module {

	private docs: { [key: string]: DB_Document } = {};
	private toasterResolver!: LiveDocActionResolver;

	set showDocImpl(value: (docKey: string, doc: DB_Document) => void) {
		this._showDocImpl = value;
	}

	constructor() {
		super();
	}

	protected init(): void {
		setDefaultLiveDocEditor()
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

	public showLiveDoc(docKey: string) {
		const doc = this.docs[docKey];
		if (doc)
			this._showDocImpl(docKey, doc);
		else
			ToastModule.toastInfo("Loading...");

		XhrHttpModule
			.createRequest<ApiGetLiveDoc>(HttpMethod.GET, RequestKey_FetchDoc, docKey)
			.setUrlParams({key: docKey})
			.setRelativeUrl("/v1/live-docs/get")
			.setLabel(`Fetch live-docs for key: ${docKey}`)
			.setOnError(`Error fetching live-docs for key: ${docKey}`)
			.execute(async (response: DB_Document) => {
				const _doc = this.docs[docKey];
				if (_doc && response.document === _doc.document)
					return;

				this.docs[docKey] = response;
				this._showDocImpl(docKey, this.docs[docKey]);
			});
	}

	update(liveDoc: Request_UpdateDocument) {
		const docKey = liveDoc.key;

		XhrHttpModule
			.createRequest<ApiUpdateLiveDocs>(HttpMethod.POST, RequestKey_UpdateDoc, docKey)
			.setJsonBody(liveDoc)
			.setRelativeUrl("/v1/live-docs/update")
			.setLabel(`Update live-docs with key: ${docKey}`)
			.setOnError(`Error updating live-docs for key: ${docKey}`)
			.execute(async () => this.showLiveDoc(docKey));
	}

	changeHistory(docKey: string, change: "undo" | "redo") {
		XhrHttpModule
			.createRequest<ApiHistoryLiveDocs>(HttpMethod.POST, RequestKey_UpdateDoc, docKey)
			.setJsonBody({key: docKey, change: change})
			.setRelativeUrl("/v1/live-docs/change-history")
			.setLabel(`${change} live-docs history with key: ${docKey}`)
			.setOnError(`Error ${change} live-docs history for key: ${docKey}`)
			.execute(async () => this.showLiveDoc(docKey));
	}
}

export const LiveDocsModule = new LiveDocsModule_Class();
