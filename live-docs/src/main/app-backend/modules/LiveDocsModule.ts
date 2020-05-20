/*
 * Permissions management system, define access level for each of
 * your server apis, and restrict users by giving them access levels
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
	AuditBy,
	Module,
	removeItemFromArray,
    BadImplementationException
} from "@nu-art/ts-common";

import {
	DB_Document,
	DB_DocumentHistory,
	Request_UpdateDocument,
} from "../../shared/types";

import {
	FirebaseModule,
	FirestoreCollection
} from "@nu-art/firebase/backend";

import {ApiException} from "@nu-art/thunderstorm/backend";

export const CollectionName_LiveDocs = "live-docs";

type Config = {
	projectId: string
}

export class LiveDocsModule_Class
	extends Module<Config> {

	private livedocs!: FirestoreCollection<DB_DocumentHistory>;

	constructor() {
		super();
	}

	protected init(): void {
		this.setDefaultConfig({projectId: process.env.GCLOUD_PROJECT || ""});
		const firestore = FirebaseModule.createAdminSession(this.config.projectId).getFirestore();
		this.livedocs = firestore.getCollection<DB_DocumentHistory>(CollectionName_LiveDocs, ["key"]);
	}

	async changeHistory(audit: AuditBy, key: string, change: "redo" | "undo") {
		await this.livedocs.runInTransaction(async (transaction) => {
			const docsHistory = await transaction.queryUnique(this.livedocs, {where: {key}});
			if(!docsHistory)
				throw new BadImplementationException(`Cannot change history of an non-existing doc with key: ${key}`);

			switch (change) {
				case "redo":
					if (docsHistory.index === 0)
						throw new ApiException(402, "Nothing to redo anymore");

					docsHistory.index--;
					break;

				case "undo":
					if (docsHistory.index === docsHistory.docs.length - 1)
						throw new ApiException(402, "Nothing to undo anymore");

					docsHistory.index++;
					break;
			}

			docsHistory._audit = audit;
			await transaction.upsert(this.livedocs,docsHistory);
		})

	}

	async updateLiveDoc(audit: AuditBy, document: Request_UpdateDocument) {
		const liveDocHistory: DB_DocumentHistory = await this.getLiveDocHistory(document.key);
		const docDB: DB_Document = {
			...document,
			_audit: audit
		};

		if (!liveDocHistory.index)
			liveDocHistory.index = 0;

		if (!liveDocHistory.docs) {
			this.logDebug("no history array.. creating a new one");
			liveDocHistory.docs = [];
		}

		if (liveDocHistory.index > liveDocHistory.docs.length) {
			liveDocHistory.index = liveDocHistory.docs.length - 1;
			if (liveDocHistory.index < 0)
				liveDocHistory.index = 0
		}

		if (liveDocHistory.index > 0) {
			this.logDebug(`Rewriting history, current index ${liveDocHistory.index}`);
			// this.logDebug(`Rewriting history, current history ${JSON.stringify(liveDocHistory.docs, null, 2)}`);
			liveDocHistory.docs.splice(0, liveDocHistory.index);
		}

		if (liveDocHistory.docs.length === 0 || liveDocHistory.docs[0].document !== docDB.document)
			addItemToArrayAtIndex(liveDocHistory.docs, docDB, 0);

		if (liveDocHistory.docs.length > 30)
			removeItemFromArray(liveDocHistory.docs, liveDocHistory.docs[liveDocHistory.docs.length - 1]);

		await this.livedocs.upsert(liveDocHistory);
	}

	private async getLiveDocHistory(docKey: string): Promise<DB_DocumentHistory> {
		const docFromDB = await this.livedocs.queryUnique({where: {key: docKey}});
		return docFromDB || {docs: [], key: docKey, index: 0};
	}

	async getLiveDoc(key: string): Promise<DB_Document> {
		const liveDocHistory = await this.getLiveDocHistory(key);
		let liveDoc: DB_Document = {
			document: ""
		};

		if (liveDocHistory.docs && liveDocHistory.docs.length > 0 && liveDocHistory.docs[liveDocHistory.index]) {
			this.logDebug(`Getting live doc from index: ${liveDocHistory.index}`);
			liveDoc = liveDocHistory.docs[liveDocHistory.index];
			//@ts-ignore
			delete liveDoc.key;
		}

		return liveDoc;
	}
}

export const LiveDocsModule = new LiveDocsModule_Class();
