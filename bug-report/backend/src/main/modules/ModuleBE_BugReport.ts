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

import {addItemToArray, auditBy, filterInstances, generateHex, Module, padNumber} from '@nu-art/ts-common';
import {FirestoreCollection, ModuleBE_Firebase, StorageWrapperBE} from '@nu-art/firebase-backend';
import {ApiHandler} from '@nu-art/http-server';
import JSZip from 'jszip';
import {API_BugReport, ApiDef_BugReport, BugReport, BugReport_DbKey, DatabaseDef_BugReport, DBDef_BugReport, ReportLogFile, Request_BugReport, TicketDetails} from '@nu-art/bug-report-shared';
import {MemKey_AccountId} from '@nu-art/user-account-backend';
import {stringToUniqueId} from '@nu-art/db-api-shared';

type Config = {
	projectId?: string,
	bucket?: string,
}
type TicketCreatorApi = (bugReport: Request_BugReport, logs: ReportLogFile[], email?: string) => Promise<TicketDetails | undefined>;

export class ModuleBE_BugReport_Class
	extends Module<Config> {

	private bugReport!: FirestoreCollection<DatabaseDef_BugReport>;
	private storage!: StorageWrapperBE;
	private ticketCreatorApis: TicketCreatorApi[] = [];

	constructor() {
		super();
	}

	protected init(): void {
		const sessionAdmin = ModuleBE_Firebase.createAdminSession();
		const firestore = sessionAdmin.getFirestore();
		this.bugReport = firestore.getCollection(DBDef_BugReport);
		this.storage = sessionAdmin.getStorage();
	}

	@ApiHandler(ApiDef_BugReport.sendBugReport)
	async sendBugReport(body: API_BugReport['sendBugReport']['Body']): Promise<API_BugReport['sendBugReport']['Response']> {
		return await ModuleBE_BugReport.saveFile(body, MemKey_AccountId.get());
	}

	addTicketCreator(ticketCreator: TicketCreatorApi) {
		addItemToArray(this.ticketCreatorApis, ticketCreator);
	}

	saveLog = async (report: BugReport, id: string): Promise<ReportLogFile> => {
		const zip = new JSZip();

		report.log.forEach((message, i) => zip.file(`${report.name}_${padNumber(i, 2)}.txt`, message));

		const buffer = await zip.generateAsync({type: 'nodebuffer'});
		const bucket = await this.storage.getOrCreateBucket(this.config?.bucket);
		const fileName = `${id}-${report.name}.zip`;
		const file = await bucket.getFile(fileName);
		await file.write(buffer);
		return {
			path: `https://storage.cloud.google.com/${file.file.metadata.bucket}/${file.file.metadata.name}`,
			name: fileName
		};
	};

	saveFile = async (bugReport: Request_BugReport, email?: string) => {

		const _id = stringToUniqueId<typeof BugReport_DbKey>(generateHex(16));
		const logs: ReportLogFile[] = await Promise.all(bugReport.reports.map(report => this.saveLog(report, _id)));

		const instance: DatabaseDef_BugReport['uiType'] = {
			_id,
			subject: bugReport.subject,
			description: bugReport.description,
			reports: logs,
			_audit: auditBy(email || 'bug-report'),
		};

		if (this.config?.bucket)
			instance.bucket = this.config.bucket;

		const tickets = await Promise.all(this.ticketCreatorApis.map(api => api(bugReport, logs, email)));
		instance.tickets = filterInstances(tickets);
		await this.bugReport.create.item(instance);
		return instance.tickets;
	};
}

export const ModuleBE_BugReport = new ModuleBE_BugReport_Class();

