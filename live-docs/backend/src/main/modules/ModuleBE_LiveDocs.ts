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

import {
	addItemToArrayAtIndex,
	ApiException,
	auditBy,
	BadImplementationException,
	Module,
	removeItemFromArray
} from '@nu-art/ts-common';

import {
	DB_Document,
	DBDef_DocumentHistory,
	LiveDocHistoryReqParams,
	LiveDocReqParams,
	Proto_DocumentHistory,
	Request_UpdateDocument,
} from '@nu-art/live-docs-shared';

import {FirestoreCollection, ModuleBE_Firebase} from '@nu-art/firebase-backend';

import {ApiHandler} from '@nu-art/http-server';
import {ApiDef_LiveDoc, API_LiveDoc} from '@nu-art/live-docs-shared/api';


type Config = {
	projectId: string
}

export class ModuleBE_LiveDocs_Class
	extends Module<Config> {

	private livedocs!: FirestoreCollection<Proto_DocumentHistory>;

	constructor() {
		super();
	}

	protected init(): void {
		super.init();
		this.setDefaultConfig({projectId: process.env.GCLOUD_PROJECT || ''});
		const firestore = ModuleBE_Firebase.createAdminSession(this.config.projectId).getFirestore();
		this.livedocs = firestore.getCollection<Proto_DocumentHistory>(DBDef_DocumentHistory);
	}

	@ApiHandler(ApiDef_LiveDoc.get)
	async get(params: API_LiveDoc['get']['Params']): Promise<API_LiveDoc['get']['Response']> {
		return this.getLiveDoc(params);
	}

	@ApiHandler(ApiDef_LiveDoc.upsert)
	async upsert(document: API_LiveDoc['upsert']['Body']): Promise<API_LiveDoc['upsert']['Response']> {
		return this.updateLiveDoc(document);
	}

	@ApiHandler(ApiDef_LiveDoc.history)
	async history(params: API_LiveDoc['history']['Params']): Promise<API_LiveDoc['history']['Response']> {
		return this.changeHistory(params);
	}

	async changeHistory(params: LiveDocHistoryReqParams) {
		const key = params.key;
		return await this.livedocs.runTransaction(async () => {
			const results = await this.livedocs.query.custom({where: {key}});
			const docsHistory = results[0];
			if (!docsHistory)
				throw new BadImplementationException(`Cannot change history of an non-existing doc with key: ${key}`);

			switch (params.change) {
				case 'redo':
					if (docsHistory.index === 0)
						throw new ApiException(402, 'Nothing to redo anymore');

					docsHistory.index--;
					break;

				case 'undo':
					if (docsHistory.index === docsHistory.docs.length - 1)
						throw new ApiException(402, 'Nothing to undo anymore');

					docsHistory.index++;
					break;
			}

			docsHistory._audit = auditBy('temp-no-user');
			await this.livedocs.set.item(docsHistory);
			return docsHistory.docs[docsHistory.index];
		});
	}

	async updateLiveDoc(document: Request_UpdateDocument) {
		const liveDocHistory = await this.getLiveDocHistory(document.key);
		const docDB: DB_Document = {
			...document,
			_audit: auditBy('user.userId')
		};

		if (!liveDocHistory.index)
			liveDocHistory.index = 0;

		if (!liveDocHistory.docs) {
			this.logDebug('no history array.. creating a new one');
			liveDocHistory.docs = [];
		}

		if (liveDocHistory.index > liveDocHistory.docs.length) {
			liveDocHistory.index = liveDocHistory.docs.length - 1;
			if (liveDocHistory.index < 0)
				liveDocHistory.index = 0;
		}

		if (liveDocHistory.index > 0) {
			this.logDebug(`Rewriting history, current index ${liveDocHistory.index}`);
			liveDocHistory.docs.splice(0, liveDocHistory.index);
		}

		if (liveDocHistory.docs.length === 0 || liveDocHistory.docs[0].document !== docDB.document)
			addItemToArrayAtIndex(liveDocHistory.docs, docDB, 0);

		if (liveDocHistory.docs.length > 30)
			removeItemFromArray(liveDocHistory.docs, liveDocHistory.docs[liveDocHistory.docs.length - 1]);

		await this.livedocs.set.item(liveDocHistory);
		return docDB;
	}

	private async getLiveDocHistory(docKey: string): Promise<Proto_DocumentHistory['uiType']> {
		const results = await this.livedocs.query.custom({where: {key: docKey}});
		return results[0] || {docs: [], key: docKey, index: 0};
	}

	async getLiveDoc(params: LiveDocReqParams): Promise<DB_Document> {
		const liveDocHistory = await this.getLiveDocHistory(params.key);
		let liveDoc: DB_Document = {
			document: ''
		};

		if (liveDocHistory.docs && liveDocHistory.docs.length > 0 && liveDocHistory.docs[liveDocHistory.index]) {
			this.logDebug(`Getting live doc from index: ${liveDocHistory.index}`);
			liveDoc = liveDocHistory.docs[liveDocHistory.index];
		}

		return liveDoc;
	}

}

export const ModuleBE_LiveDocs = new ModuleBE_LiveDocs_Class();
